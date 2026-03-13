"""Builder routes — premium store generator + GitHub publish"""

import json, os, zipfile, io, re, base64
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import query_db, execute_db
import requests as http_req

builder_bp = Blueprint('builder', __name__)


# ── Save / Load ─────────────────────────────────────────────────────────────

@builder_bp.route('/save/<int:shop_id>', methods=['POST'])
@jwt_required()
def save_builder(shop_id):
    user_id = get_jwt_identity()
    shop = query_db('SELECT id FROM shops WHERE id=%s AND user_id=%s', (shop_id, user_id), one=True)
    if not shop:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    execute_db('UPDATE shops SET builder_html=%s, builder_css=%s WHERE id=%s',
               (data.get('html', ''), data.get('css', ''), shop_id))
    return jsonify({'message': 'Builder saved'})


@builder_bp.route('/load/<int:shop_id>', methods=['GET'])
@jwt_required()
def load_builder(shop_id):
    user_id = get_jwt_identity()
    shop = query_db('SELECT builder_html, builder_css, template_id FROM shops WHERE id=%s AND user_id=%s',
                    (shop_id, user_id), one=True)
    if not shop:
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify({'html': shop['builder_html'] or '', 'css': shop['builder_css'] or '', 'template': shop['template_id']})


# ── Download ZIP (full store) ────────────────────────────────────────────────

@builder_bp.route('/download/<int:shop_id>', methods=['GET'])
@jwt_required()
def download_store(shop_id):
    user_id = get_jwt_identity()
    shop = query_db('SELECT * FROM shops WHERE id=%s AND user_id=%s', (shop_id, user_id), one=True)
    if not shop:
        return jsonify({'error': 'Unauthorized'}), 403

    products   = query_db('SELECT * FROM products WHERE shop_id=%s AND is_active=1', (shop_id,))
    categories = query_db('SELECT * FROM categories WHERE shop_id=%s', (shop_id,))
    orders     = query_db('SELECT * FROM orders WHERE shop_id=%s ORDER BY created_at DESC LIMIT 50', (shop_id,))

    store_name = shop['name']
    slug       = shop['slug'] or 'store'

    html_file    = generate_full_store_html(shop, products, categories)
    css_file     = generate_full_store_css(shop)
    js_file      = generate_full_store_js(shop, products)
    db_sql_file  = generate_store_database(shop, products, categories, orders)
    readme_file  = generate_readme(shop)

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('index.html',  html_file)
        zf.writestr('style.css',   css_file)
        zf.writestr('app.js',      js_file)
        zf.writestr(f'{slug}-database.sql', db_sql_file)
        zf.writestr('README.md',   readme_file)
    buf.seek(0)
    return send_file(buf, mimetype='application/zip', as_attachment=True,
                     download_name=f'{slug}-store.zip')


# ── GitHub Publish ───────────────────────────────────────────────────────────

@builder_bp.route('/github/<int:shop_id>', methods=['POST'])
@jwt_required()
def publish_to_github(shop_id):
    user_id = get_jwt_identity()
    shop = query_db('SELECT * FROM shops WHERE id=%s AND user_id=%s', (shop_id, user_id), one=True)
    if not shop:
        return jsonify({'error': 'Unauthorized'}), 403

    data      = request.get_json()
    gh_token  = data.get('token', '').strip()
    repo_name = data.get('repo_name', '').strip()

    if not gh_token or not repo_name:
        return jsonify({'error': 'GitHub token and repository name are required'}), 400

    headers = {
        'Authorization': f'token {gh_token}',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
    }

    # Get authenticated user
    user_resp = http_req.get('https://api.github.com/user', headers=headers)
    if user_resp.status_code != 200:
        return jsonify({'error': 'Invalid GitHub token. Check token permissions.'}), 400
    gh_user = user_resp.json()['login']

    # Create repository
    create_resp = http_req.post('https://api.github.com/user/repos', headers=headers, json={
        'name': repo_name,
        'description': f'{shop["name"]} — online store built with ShopEZ',
        'private': False,
        'auto_init': False
    })

    repo_url = f'https://github.com/{gh_user}/{repo_name}'

    if create_resp.status_code == 422:
        # Repo exists — we'll update it
        pass
    elif create_resp.status_code not in (200, 201):
        err = create_resp.json().get('message', 'Failed to create repository')
        return jsonify({'error': err}), 400

    # Generate store files
    products   = query_db('SELECT * FROM products WHERE shop_id=%s AND is_active=1', (shop_id,))
    categories = query_db('SELECT * FROM categories WHERE shop_id=%s', (shop_id,))

    files = {
        'index.html': generate_full_store_html(shop, products, categories),
        'style.css':  generate_full_store_css(shop),
        'app.js':     generate_full_store_js(shop, products),
        'README.md':  generate_readme(shop)
    }

    # Push files via Contents API
    pushed = 0
    for filename, content in files.items():
        encoded = base64.b64encode(content.encode('utf-8')).decode('utf-8')
        url = f'https://api.github.com/repos/{gh_user}/{repo_name}/contents/{filename}'

        # Check if file exists (for update)
        sha = None
        existing = http_req.get(url, headers=headers)
        if existing.status_code == 200:
            sha = existing.json().get('sha')

        payload = {
            'message': f'Update {filename} via ShopEZ',
            'content': encoded
        }
        if sha:
            payload['sha'] = sha

        resp = http_req.put(url, headers=headers, json=payload)
        if resp.status_code in (200, 201):
            pushed += 1

    if pushed == 0:
        return jsonify({'error': 'Failed to push files to GitHub'}), 500

    # Save repo url to shop
    execute_db('UPDATE shops SET github_repo=%s WHERE id=%s', (repo_url, shop_id))

    return jsonify({
        'message': f'Successfully published {pushed} files to GitHub!',
        'repo_url': repo_url,
        'pages_url': f'https://{gh_user}.github.io/{repo_name}/'
    })


# ═══════════════════════════════════════════════════════════════════════════════
#  PREMIUM STORE GENERATOR
# ═══════════════════════════════════════════════════════════════════════════════

def _safe(val, fallback=''):
    if val is None:
        return fallback
    return str(val)

def _get_images(product):
    raw = product.get('images', '[]') or '[]'
    if isinstance(raw, list):
        return raw
    try:
        return json.loads(raw)
    except Exception:
        return []


def generate_full_store_html(shop, products, categories):
    name        = _safe(shop.get('name'), 'My Store')
    desc        = _safe(shop.get('description'), 'Welcome to our store')
    color       = _safe(shop.get('theme_color'), '#6366f1')
    secondary   = _safe(shop.get('secondary_color'), '#8b5cf6')
    font        = _safe(shop.get('font_family'), 'Poppins')
    logo        = _safe(shop.get('logo_url'))
    banner      = _safe(shop.get('banner_url'))
    whatsapp    = _safe(shop.get('whatsapp_number'))
    instagram   = _safe(shop.get('instagram_url'))
    builder_html= _safe(shop.get('builder_html'))

    # Category filter tabs
    cat_tabs = '<button class="cat-btn active" data-cat="all" onclick="filterCat(\'all\',this)">All</button>\n'
    for cat in categories:
        cat_tabs += f'<button class="cat-btn" data-cat="{cat["id"]}" onclick="filterCat(\'{cat["id"]}\',this)">{cat["name"]}</button>\n'

    # Products
    products_html = ''
    for p in products:
        imgs = _get_images(p)
        img_src = imgs[0] if imgs else 'https://placehold.co/400x400/f3f4f6/9ca3af?text=No+Image'
        thumb_strip = ''
        for i, im in enumerate(imgs[:4]):
            thumb_strip += f'<img src="{im}" class="thumb" onclick="swapImg(this,\'{img_src}\')" />'
        price     = float(p.get('price') or 0)
        comp      = float(p.get('compare_price') or 0)
        discount  = f'<span class="badge-discount">-{int((1-price/comp)*100)}%</span>' if comp > price > 0 else ''
        comp_html = f'<s class="compare-price">₹{comp:.2f}</s>' if comp > price > 0 else ''
        featured  = '<span class="badge-featured">⭐ Featured</span>' if p.get('is_featured') == 1 else ''
        cat_id    = p.get('category_id') or 'none'
        pname     = _safe(p.get('name'))
        pdesc     = _safe(p.get('description'))
        pid       = p.get('id', 0)

        products_html += f"""
<div class="product-card" data-id="{pid}" data-cat="{cat_id}" data-name="{pname.lower()}" data-price="{price}">
  <div class="product-img-wrap">
    <img id="prod-img-{pid}" src="{img_src}" alt="{pname}" loading="lazy" class="product-img" />
    {discount}
    {featured}
    <div class="product-overlay">
      <button class="overlay-btn" onclick="openQuickView({pid})">Quick View</button>
      <button class="overlay-btn" onclick="addToCart({pid},'{pname.replace(chr(39),chr(39))}',{price},'{img_src}')">Add to Cart</button>
    </div>
  </div>
  <div class="thumb-row">{thumb_strip}</div>
  <div class="product-body">
    <p class="product-cat">{next((c['name'] for c in categories if c['id']==cat_id), '')}</p>
    <h3 class="product-name">{pname}</h3>
    <p class="product-desc">{pdesc[:80]}{'...' if len(pdesc)>80 else ''}</p>
    <div class="product-price-row">
      <span class="product-price">₹{price:.2f}</span>
      {comp_html}
    </div>
    <button class="btn-add-cart" onclick="addToCart({pid},'{pname.replace(chr(39),chr(39))}',{price},'{img_src}')">
      🛒 Add to Cart
    </button>
  </div>
</div>"""

    # WhatsApp / Instagram FABs
    wa_fab = f'<a href="https://wa.me/{whatsapp}" target="_blank" class="fab fab-wa" title="Chat on WhatsApp" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.533 5.853L.057 24l6.305-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.575-.503-5.063-1.381l-.361-.214-3.744.981.999-3.648-.235-.374A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg></a>' if whatsapp else ''
    ig_fab = f'<a href="{instagram}" target="_blank" class="fab fab-ig" title="Follow on Instagram" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>' if instagram else ''

    logo_html = f'<img src="{logo}" alt="{name}" class="nav-logo-img" />' if logo else f'<div class="nav-logo-text">{name[0]}</div>'
    banner_html = f'<img src="{banner}" alt="Banner" class="hero-banner-img" />' if banner else ''
    builder_section = f'<section class="builder-section">{builder_html}</section>' if builder_html else ''

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="{desc}" />
  <title>{name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family={font.replace(' ','+' )}:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
  <style>
    :root {{
      --primary: {color};
      --secondary: {secondary};
      --font: '{font}', sans-serif;
    }}
    body {{ font-family: var(--font); }}
  </style>
</head>
<body>

<!-- Loader -->
<div id="page-loader">
  <div class="loader-ring"></div>
</div>

<!-- Notification bar -->
<div class="notif-bar">🎉 Free shipping on orders above ₹999 &nbsp;|&nbsp; Use code <strong>SHOPEZ10</strong> for 10% off!</div>

<!-- Navbar -->
<nav class="navbar" id="navbar">
  <div class="nav-container">
    <a href="#" class="nav-brand">
      {logo_html}
      <span class="nav-name">{name}</span>
    </a>
    <ul class="nav-links" id="navLinks">
      <li><a href="#home">Home</a></li>
      <li><a href="#products">Products</a></li>
      <li><a href="#about">About</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
    <div class="nav-actions">
      <div class="search-wrap">
        <input type="text" id="searchInput" placeholder="Search..." oninput="searchProducts()" />
        <span class="search-icon">🔍</span>
      </div>
      <button class="cart-btn" id="cartBtn" onclick="toggleCart()" aria-label="Cart">
        🛒 <span class="cart-badge" id="cartBadge">0</span>
      </button>
      <button class="menu-toggle" id="menuToggle" onclick="toggleMenu()" aria-label="Menu">☰</button>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="hero" id="home">
  {banner_html}
  <div class="hero-overlay"></div>
  <div class="hero-content" data-aos="fade-up">
    <div class="hero-tag">✨ New Collection Available</div>
    <h1 class="hero-title">{name}</h1>
    <p class="hero-sub">{desc}</p>
    <div class="hero-btns">
      <a href="#products" class="btn-hero-primary">Shop Now →</a>
      {'<a href="https://wa.me/'+whatsapp+'" target="_blank" class="btn-hero-secondary">💬 Chat with Us</a>' if whatsapp else ''}
    </div>
    <div class="hero-stats">
      <div class="stat"><span class="stat-n">{len(products)}+</span><span class="stat-l">Products</span></div>
      <div class="stat"><span class="stat-n">100%</span><span class="stat-l">Authentic</span></div>
      <div class="stat"><span class="stat-n">Fast</span><span class="stat-l">Delivery</span></div>
    </div>
  </div>
</section>

<!-- Builder content (GrapesJS) -->
{builder_section}

<!-- Products -->
<section class="products-section" id="products">
  <div class="section-container">
    <div class="section-header" data-aos="fade-up">
      <span class="section-tag">Our Collection</span>
      <h2 class="section-title">Featured Products</h2>
      <p class="section-sub">Discover our handpicked selection</p>
    </div>

    <!-- Category filter -->
    <div class="cat-filter" data-aos="fade-up">
      {cat_tabs}
    </div>

    <!-- Sort + Search bar -->
    <div class="products-toolbar" data-aos="fade-up">
      <span id="productsCount" class="products-count"></span>
      <select id="sortSelect" class="sort-select" onchange="sortProducts()">
        <option value="default">Sort: Default</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="name-asc">Name: A–Z</option>
      </select>
    </div>

    <div class="products-grid" id="productsGrid">
      {products_html if products_html else '<p class="no-products">No products available yet.</p>'}
    </div>
  </div>
</section>

<!-- About -->
<section class="about-section" id="about">
  <div class="section-container about-inner">
    <div class="about-text" data-aos="fade-right">
      <span class="section-tag">Our Story</span>
      <h2>Why Choose {name}?</h2>
      <p>{desc}</p>
      <ul class="about-list">
        <li>✅ 100% Authentic Products</li>
        <li>✅ Fast & Secure Delivery</li>
        <li>✅ Easy Returns & Refunds</li>
        <li>✅ 24/7 Customer Support</li>
      </ul>
      {'<a href="https://wa.me/'+whatsapp+'" target="_blank" class="btn-hero-primary">💬 Contact Us</a>' if whatsapp else ''}
    </div>
    <div class="about-visual" data-aos="fade-left">
      <div class="about-card">
        <div class="about-icon">🏆</div>
        <h3>Best Quality</h3>
        <p>Every product is quality checked before shipping.</p>
      </div>
      <div class="about-card">
        <div class="about-icon">🚚</div>
        <h3>Fast Delivery</h3>
        <p>Get your order delivered within 3-5 business days.</p>
      </div>
      <div class="about-card">
        <div class="about-icon">🔒</div>
        <h3>Secure Payments</h3>
        <p>100% safe and encrypted payment methods.</p>
      </div>
      <div class="about-card">
        <div class="about-icon">💬</div>
        <h3>24/7 Support</h3>
        <p>Our team is always here to help you.</p>
      </div>
    </div>
  </div>
</section>

<!-- Contact / Footer -->
<footer class="footer" id="contact">
  <div class="footer-inner">
    <div class="footer-brand">
      <h3>{name}</h3>
      <p>{desc[:100]}</p>
      <div class="social-links">
        {f'<a href="https://wa.me/{whatsapp}" target="_blank" class="social-link">💬 WhatsApp</a>' if whatsapp else ''}
        {f'<a href="{instagram}" target="_blank" class="social-link">📸 Instagram</a>' if instagram else ''}
      </div>
    </div>
    <div class="footer-links">
      <h4>Quick Links</h4>
      <a href="#home">Home</a>
      <a href="#products">Products</a>
      <a href="#about">About Us</a>
      <a href="#contact">Contact</a>
    </div>
    <div class="footer-contact">
      <h4>Get in Touch</h4>
      {f'<p>📱 <a href="https://wa.me/{whatsapp}">{whatsapp}</a></p>' if whatsapp else ''}
      {f'<p>📸 <a href="{instagram}">Instagram</a></p>' if instagram else ''}
      <p>🛍️ Powered by <strong>ShopEZ</strong></p>
    </div>
  </div>
  <div class="footer-bottom">
    <p>© 2024 <strong>{name}</strong>. All rights reserved.</p>
  </div>
</footer>

<!-- Cart Drawer -->
<div class="cart-overlay" id="cartOverlay" onclick="toggleCart()"></div>
<div class="cart-drawer" id="cartDrawer">
  <div class="cart-header">
    <h3>🛒 Your Cart</h3>
    <button onclick="toggleCart()" class="cart-close">✕</button>
  </div>
  <div class="cart-body" id="cartBody"></div>
  <div class="cart-footer" id="cartFooter" style="display:none">
    <div class="cart-total-row"><span>Subtotal</span><span id="cartTotal">₹0</span></div>
    <button class="btn-checkout" onclick="openCheckout()">Proceed to Checkout →</button>
    {'<a id="waCheckout" href="#" target="_blank" class="btn-wa-checkout">💬 Order via WhatsApp</a>' if whatsapp else ''}
  </div>
</div>

<!-- Quick View Modal -->
<div class="modal-overlay" id="qvOverlay" onclick="closeQuickView()"></div>
<div class="modal" id="quickViewModal">
  <button class="modal-close" onclick="closeQuickView()">✕</button>
  <div class="modal-body" id="quickViewBody"></div>
</div>

<!-- Checkout Modal -->
<div class="modal-overlay" id="coOverlay" onclick="closeCheckout()"></div>
<div class="modal" id="checkoutModal">
  <button class="modal-close" onclick="closeCheckout()">✕</button>
  <div class="modal-body">
    <h2>Complete Your Order</h2>
    <form id="checkoutForm" onsubmit="submitOrder(event)" class="checkout-form">
      <input name="customer_name" placeholder="Full Name *" required />
      <input name="customer_email" type="email" placeholder="Email *" required />
      <input name="customer_phone" placeholder="Phone Number" />
      <input name="shipping_address" placeholder="Full Address *" required />
      <div class="form-row">
        <input name="city" placeholder="City" />
        <input name="state" placeholder="State" />
      </div>
      <input name="postal_code" placeholder="Postal Code" />
      <div id="orderSummary" class="order-summary"></div>
      <button type="submit" class="btn-place-order">🎉 Place Order</button>
    </form>
  </div>
</div>

<!-- Toast container -->
<div id="toastContainer"></div>

<!-- FABs -->
<div class="fab-container">
  {wa_fab}
  {ig_fab}
</div>

<!-- Scroll to top -->
<button class="scroll-top" id="scrollTop" onclick="window.scrollTo({{top:0,behavior:'smooth'}})">↑</button>

<script src="app.js"></script>
</body>
</html>"""


def generate_full_store_css(shop):
    color     = _safe(shop.get('theme_color'), '#6366f1')
    secondary = _safe(shop.get('secondary_color'), '#8b5cf6')
    font      = _safe(shop.get('font_family'), 'Poppins')
    banner    = _safe(shop.get('banner_url'))

    hero_bg = f"url('{banner}') center/cover no-repeat" if banner else f"linear-gradient(135deg,{color},{secondary})"

    return f"""/* ShopEZ Premium Store CSS — {shop.get('name','Store')} */

:root {{
  --primary: {color};
  --secondary: {secondary};
  --dark: #0f0f1a;
  --gray: #6b7280;
  --light: #f9fafb;
  --white: #ffffff;
  --shadow: 0 4px 24px rgba(0,0,0,.08);
  --shadow-lg: 0 12px 40px rgba(0,0,0,.15);
  --radius: 16px;
  --radius-sm: 10px;
  --transition: all .3s cubic-bezier(.4,0,.2,1);
}}

*,*::before,*::after{{ box-sizing:border-box; margin:0; padding:0; }}
html{{ scroll-behavior:smooth; }}
body{{ font-family:'{font}',sans-serif; color:var(--dark); background:var(--white); overflow-x:hidden; }}
a{{ text-decoration:none; color:inherit; }}
img{{ max-width:100%; display:block; }}

/* ── Loader ── */
#page-loader{{
  position:fixed; inset:0; background:var(--white); display:flex;
  align-items:center; justify-content:center; z-index:9999;
  transition:opacity .5s,visibility .5s;
}}
#page-loader.hidden{{ opacity:0; visibility:hidden; }}
.loader-ring{{
  width:52px; height:52px; border:4px solid #e5e7eb;
  border-top-color:var(--primary); border-radius:50%;
  animation:spin .8s linear infinite;
}}
@keyframes spin{{ to{{transform:rotate(360deg)}} }}

/* ── Notification Bar ── */
.notif-bar{{
  background:linear-gradient(90deg,var(--primary),var(--secondary));
  color:#fff; text-align:center; padding:8px 16px; font-size:.8rem; font-weight:500;
  letter-spacing:.3px;
}}

/* ── Navbar ── */
.navbar{{
  position:sticky; top:0; z-index:100; background:rgba(255,255,255,.92);
  backdrop-filter:blur(14px); border-bottom:1px solid rgba(0,0,0,.06);
  transition:var(--transition);
}}
.navbar.scrolled{{ box-shadow:0 2px 20px rgba(0,0,0,.1); }}
.nav-container{{
  max-width:1280px; margin:0 auto; padding:0 24px;
  height:66px; display:flex; align-items:center; gap:24px;
}}
.nav-brand{{ display:flex; align-items:center; gap:10px; font-weight:800; font-size:1.25rem; color:var(--dark); }}
.nav-logo-img{{ width:38px; height:38px; border-radius:10px; object-fit:cover; }}
.nav-logo-text{{
  width:38px; height:38px; background:linear-gradient(135deg,var(--primary),var(--secondary));
  color:#fff; font-weight:900; font-size:1.1rem; border-radius:10px;
  display:flex; align-items:center; justify-content:center;
}}
.nav-links{{ list-style:none; display:flex; gap:28px; margin-left:auto; }}
.nav-links a{{ font-size:.9rem; font-weight:600; color:var(--gray); transition:var(--transition); position:relative; padding:4px 0; }}
.nav-links a::after{{
  content:''; position:absolute; bottom:0; left:0; width:0; height:2px;
  background:var(--primary); transition:var(--transition); border-radius:2px;
}}
.nav-links a:hover{{ color:var(--primary); }}
.nav-links a:hover::after{{ width:100%; }}
.nav-actions{{ display:flex; align-items:center; gap:12px; margin-left:auto; }}
.search-wrap{{ position:relative; }}
.search-wrap input{{
  border:1.5px solid #e5e7eb; border-radius:50px; padding:8px 16px 8px 36px;
  font-size:.85rem; outline:none; width:180px; font-family:inherit;
  transition:var(--transition);
}}
.search-wrap input:focus{{ border-color:var(--primary); width:220px; }}
.search-icon{{ position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:.85rem; }}
.cart-btn{{
  position:relative; background:linear-gradient(135deg,var(--primary),var(--secondary));
  color:#fff; border:none; padding:10px 18px; border-radius:50px; cursor:pointer;
  font-weight:700; font-size:.85rem; transition:var(--transition); font-family:inherit;
}}
.cart-btn:hover{{ transform:scale(1.05); }}
.cart-badge{{
  position:absolute; top:-6px; right:-6px; background:#ef4444; color:#fff;
  width:20px; height:20px; border-radius:50%; font-size:.7rem; font-weight:800;
  display:flex; align-items:center; justify-content:center; border:2px solid #fff;
}}
.menu-toggle{{ display:none; background:none; border:none; font-size:1.4rem; cursor:pointer; color:var(--dark); }}

/* ── Hero ── */
.hero{{
  position:relative; min-height:92vh; display:flex; align-items:center; justify-content:center;
  background:{hero_bg};
  overflow:hidden;
}}
.hero-banner-img{{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }}
.hero-overlay{{
  position:absolute; inset:0;
  background:linear-gradient(135deg,rgba(0,0,0,.65) 0%,rgba(0,0,0,.3) 60%,transparent 100%);
}}
.hero-content{{
  position:relative; z-index:2; text-align:center; color:#fff; padding:40px 24px;
  max-width:760px;
}}
.hero-tag{{
  display:inline-block; background:rgba(255,255,255,.15); backdrop-filter:blur(8px);
  border:1px solid rgba(255,255,255,.3); padding:8px 20px; border-radius:50px;
  font-size:.85rem; font-weight:600; letter-spacing:.5px; margin-bottom:24px;
  animation:fadeDown .8s ease both;
}}
.hero-title{{
  font-size:clamp(2.5rem,6vw,5.5rem); font-weight:900; line-height:1.05;
  margin-bottom:20px; letter-spacing:-1px;
  animation:fadeDown .8s .1s ease both;
  text-shadow:0 2px 20px rgba(0,0,0,.3);
}}
.hero-sub{{
  font-size:1.15rem; opacity:.85; max-width:560px; margin:0 auto 36px;
  line-height:1.7; animation:fadeDown .8s .2s ease both;
}}
.hero-btns{{ display:flex; gap:14px; justify-content:center; flex-wrap:wrap; animation:fadeDown .8s .3s ease both; }}
.btn-hero-primary{{
  background:linear-gradient(135deg,var(--primary),var(--secondary));
  color:#fff; padding:15px 36px; border-radius:50px; font-weight:700;
  font-size:1rem; transition:var(--transition);
  box-shadow:0 8px 30px rgba(99,102,241,.5);
}}
.btn-hero-primary:hover{{ transform:translateY(-3px); box-shadow:0 14px 40px rgba(99,102,241,.6); }}
.btn-hero-secondary{{
  background:rgba(255,255,255,.15); backdrop-filter:blur(8px);
  color:#fff; border:1.5px solid rgba(255,255,255,.4); padding:15px 36px;
  border-radius:50px; font-weight:600; font-size:1rem; transition:var(--transition);
}}
.btn-hero-secondary:hover{{ background:rgba(255,255,255,.25); transform:translateY(-3px); }}
.hero-stats{{
  display:flex; gap:36px; justify-content:center; margin-top:52px;
  animation:fadeDown .8s .4s ease both;
}}
.stat .stat-n{{ display:block; font-size:1.8rem; font-weight:900; }}
.stat .stat-l{{ font-size:.8rem; opacity:.7; letter-spacing:.5px; text-transform:uppercase; }}

/* ── Scroll animations ── */
@keyframes fadeDown{{
  from{{ opacity:0; transform:translateY(-24px); }}
  to{{ opacity:1; transform:translateY(0); }}
}}
[data-aos="fade-up"]{{
  opacity:0; transform:translateY(40px); transition:opacity .7s,transform .7s;
}}
[data-aos="fade-up"].aos-animate{{
  opacity:1; transform:translateY(0);
}}
[data-aos="fade-right"]{{
  opacity:0; transform:translateX(-40px); transition:opacity .7s,transform .7s;
}}
[data-aos="fade-right"].aos-animate{{ opacity:1; transform:translateX(0); }}
[data-aos="fade-left"]{{
  opacity:0; transform:translateX(40px); transition:opacity .7s,transform .7s;
}}
[data-aos="fade-left"].aos-animate{{ opacity:1; transform:translateX(0); }}

/* ── Sections ── */
.section-container{{ max-width:1280px; margin:0 auto; padding:90px 24px; }}
.section-header{{ text-align:center; margin-bottom:52px; }}
.section-tag{{
  display:inline-block; background:linear-gradient(135deg,var(--primary)22,var(--secondary)22);
  color:var(--primary); padding:6px 18px; border-radius:50px;
  font-size:.8rem; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-bottom:12px;
}}
.section-title{{ font-size:clamp(1.8rem,4vw,3rem); font-weight:900; letter-spacing:-1px; margin-bottom:10px; }}
.section-sub{{ color:var(--gray); font-size:1rem; max-width:500px; margin:0 auto; line-height:1.7; }}

/* ── Category Filter ── */
.cat-filter{{ display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-bottom:28px; }}
.cat-btn{{
  padding:8px 22px; border-radius:50px; border:1.5px solid #e5e7eb; background:#fff;
  color:var(--gray); font-size:.85rem; font-weight:600; cursor:pointer; transition:var(--transition);
  font-family:inherit;
}}
.cat-btn:hover,.cat-btn.active{{
  background:linear-gradient(135deg,var(--primary),var(--secondary));
  color:#fff; border-color:transparent;
  box-shadow:0 4px 14px rgba(99,102,241,.35);
}}

/* ── Products Toolbar ── */
.products-toolbar{{
  display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;
}}
.products-count{{ font-size:.85rem; color:var(--gray); font-weight:500; }}
.sort-select{{
  border:1.5px solid #e5e7eb; border-radius:10px; padding:8px 14px; font-size:.85rem;
  outline:none; background:#fff; font-family:inherit; cursor:pointer;
}}

/* ── Products Grid ── */
.products-grid{{
  display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:24px;
}}
.product-card{{
  background:#fff; border-radius:var(--radius); overflow:hidden;
  box-shadow:var(--shadow); transition:var(--transition);
  border:1px solid rgba(0,0,0,.05);
}}
.product-card:hover{{ transform:translateY(-8px); box-shadow:var(--shadow-lg); }}
.product-card.hidden{{ display:none; }}

.product-img-wrap{{ position:relative; overflow:hidden; aspect-ratio:4/3; background:#f9fafb; }}
.product-img{{ width:100%; height:100%; object-fit:cover; transition:transform .5s ease; }}
.product-card:hover .product-img{{ transform:scale(1.08); }}
.badge-discount{{
  position:absolute; top:12px; left:12px; background:#ef4444; color:#fff;
  font-size:.7rem; font-weight:800; padding:4px 10px; border-radius:50px;
}}
.badge-featured{{
  position:absolute; top:12px; right:12px; background:linear-gradient(135deg,#f59e0b,#f97316);
  color:#fff; font-size:.7rem; font-weight:700; padding:4px 10px; border-radius:50px;
}}
.product-overlay{{
  position:absolute; inset:0; background:rgba(0,0,0,.55);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px;
  opacity:0; transition:var(--transition);
}}
.product-card:hover .product-overlay{{ opacity:1; }}
.overlay-btn{{
  background:rgba(255,255,255,.95); color:var(--dark); padding:10px 22px;
  border-radius:50px; font-weight:700; font-size:.82rem; border:none; cursor:pointer;
  font-family:inherit; transition:var(--transition);
}}
.overlay-btn:hover{{ background:var(--primary); color:#fff; }}

.thumb-row{{ display:flex; gap:6px; padding:8px 12px 0; }}
.thumb{{ width:44px; height:44px; object-fit:cover; border-radius:8px; cursor:pointer; opacity:.6; transition:opacity .2s; border:2px solid transparent; }}
.thumb:hover{{ opacity:1; border-color:var(--primary); }}

.product-body{{ padding:16px 18px 20px; }}
.product-cat{{ font-size:.72rem; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--primary); margin-bottom:6px; }}
.product-name{{ font-size:1.02rem; font-weight:700; margin-bottom:6px; color:var(--dark); line-height:1.3; }}
.product-desc{{ font-size:.82rem; color:var(--gray); line-height:1.5; margin-bottom:12px; min-height:36px; }}
.product-price-row{{ display:flex; align-items:center; gap:10px; margin-bottom:14px; }}
.product-price{{ font-size:1.25rem; font-weight:800; color:var(--primary); }}
.compare-price{{ font-size:.85rem; color:#9ca3af; }}
.btn-add-cart{{
  width:100%; padding:12px; background:linear-gradient(135deg,var(--primary),var(--secondary));
  color:#fff; border:none; border-radius:var(--radius-sm); cursor:pointer;
  font-weight:700; font-size:.9rem; font-family:inherit; transition:var(--transition);
  letter-spacing:.3px;
}}
.btn-add-cart:hover{{ opacity:.88; transform:translateY(-1px); }}
.btn-add-cart:active{{ transform:scale(.97); }}

.no-products{{ text-align:center; color:var(--gray); padding:80px 0; font-size:1.1rem; }}

/* ── About ── */
.about-section{{ background:linear-gradient(135deg,{color}08,{secondary}08); }}
.about-inner{{
  display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center;
  padding:90px 24px;
}}
.about-text h2{{ font-size:2.4rem; font-weight:900; margin:12px 0 18px; letter-spacing:-1px; }}
.about-text p{{ color:var(--gray); line-height:1.8; margin-bottom:24px; font-size:1.02rem; }}
.about-list{{ list-style:none; display:flex; flex-direction:column; gap:10px; margin-bottom:32px; }}
.about-list li{{ font-weight:600; color:var(--dark); font-size:.95rem; }}
.about-visual{{
  display:grid; grid-template-columns:1fr 1fr; gap:18px;
}}
.about-card{{
  background:#fff; border-radius:var(--radius); padding:24px; text-align:center;
  box-shadow:var(--shadow); transition:var(--transition);
}}
.about-card:hover{{ transform:translateY(-4px); box-shadow:var(--shadow-lg); }}
.about-icon{{ font-size:2.2rem; margin-bottom:10px; }}
.about-card h3{{ font-size:.95rem; font-weight:700; margin-bottom:6px; }}
.about-card p{{ font-size:.82rem; color:var(--gray); line-height:1.5; }}

/* ── Footer ── */
.footer{{ background:var(--dark); color:rgba(255,255,255,.8); padding:70px 0 0; }}
.footer-inner{{ max-width:1280px; margin:0 auto; padding:0 24px 50px; display:grid; grid-template-columns:2fr 1fr 1fr; gap:48px; }}
.footer-brand h3{{ font-size:1.5rem; font-weight:800; color:#fff; margin-bottom:10px; }}
.footer-brand p{{ font-size:.88rem; line-height:1.7; opacity:.7; margin-bottom:20px; }}
.social-links{{ display:flex; gap:12px; flex-wrap:wrap; }}
.social-link{{
  background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.15);
  padding:8px 16px; border-radius:50px; font-size:.82rem; font-weight:600;
  transition:var(--transition);
}}
.social-link:hover{{ background:var(--primary); border-color:var(--primary); color:#fff; }}
.footer-links h4,.footer-contact h4{{
  font-size:.95rem; font-weight:700; color:#fff; margin-bottom:16px; letter-spacing:.5px; text-transform:uppercase;
}}
.footer-links a{{ display:block; margin-bottom:10px; font-size:.88rem; opacity:.7; transition:var(--transition); }}
.footer-links a:hover{{ opacity:1; color:var(--primary); }}
.footer-contact p{{ font-size:.88rem; margin-bottom:10px; opacity:.7; }}
.footer-contact a{{ color:var(--primary); }}
.footer-bottom{{ border-top:1px solid rgba(255,255,255,.08); padding:20px 24px; text-align:center; font-size:.82rem; opacity:.5; }}

/* ── Cart Drawer ── */
.cart-overlay,.modal-overlay{{
  position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:200;
  opacity:0; visibility:hidden; transition:var(--transition);
}}
.cart-overlay.active,.modal-overlay.active{{ opacity:1; visibility:visible; }}
.cart-drawer{{
  position:fixed; right:-420px; top:0; bottom:0; width:400px; max-width:100vw;
  background:#fff; z-index:201; box-shadow:-8px 0 40px rgba(0,0,0,.12);
  display:flex; flex-direction:column; transition:right .35s cubic-bezier(.4,0,.2,1);
}}
.cart-drawer.open{{ right:0; }}
.cart-header{{
  display:flex; justify-content:space-between; align-items:center; padding:20px 22px;
  border-bottom:1px solid #f3f4f6; font-weight:800; font-size:1.1rem;
}}
.cart-close{{ background:none; border:none; font-size:1.3rem; cursor:pointer; padding:4px; border-radius:8px; transition:var(--transition); }}
.cart-close:hover{{ background:#f3f4f6; }}
.cart-body{{ flex:1; overflow-y:auto; padding:16px 22px; }}
.cart-empty{{ text-align:center; padding:60px 0; color:var(--gray); }}
.cart-item{{ display:flex; gap:14px; padding:14px 0; border-bottom:1px solid #f3f4f6; align-items:center; }}
.cart-item-img{{ width:60px; height:60px; border-radius:12px; object-fit:cover; flex-shrink:0; background:#f3f4f6; }}
.cart-item-info{{ flex:1; min-width:0; }}
.cart-item-name{{ font-weight:700; font-size:.88rem; color:var(--dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }}
.cart-item-price{{ font-size:.9rem; font-weight:800; color:var(--primary); margin-top:3px; }}
.cart-qty{{ display:flex; align-items:center; gap:8px; margin-top:8px; }}
.qty-btn{{
  width:28px; height:28px; border-radius:8px; border:1.5px solid #e5e7eb; background:#fff;
  cursor:pointer; font-size:.9rem; font-weight:700; transition:var(--transition); font-family:inherit;
}}
.qty-btn:hover{{ border-color:var(--primary); color:var(--primary); }}
.qty-num{{ font-weight:700; font-size:.9rem; min-width:20px; text-align:center; }}
.remove-btn{{ background:none; border:none; color:#9ca3af; cursor:pointer; padding:4px; border-radius:6px; transition:var(--transition); font-size:.85rem; margin-left:auto; }}
.remove-btn:hover{{ color:#ef4444; background:#fef2f2; }}
.cart-footer{{ padding:18px 22px; border-top:1px solid #f3f4f6; }}
.cart-total-row{{ display:flex; justify-content:space-between; font-weight:800; font-size:1.05rem; margin-bottom:16px; }}
.btn-checkout{{
  width:100%; padding:14px; background:linear-gradient(135deg,var(--primary),var(--secondary));
  color:#fff; border:none; border-radius:var(--radius-sm); cursor:pointer;
  font-weight:700; font-size:.95rem; font-family:inherit; transition:var(--transition); margin-bottom:10px;
}}
.btn-checkout:hover{{ opacity:.88; }}
.btn-wa-checkout{{
  display:block; width:100%; padding:13px; background:#25D366; color:#fff;
  text-align:center; border-radius:var(--radius-sm); font-weight:700;
  font-size:.9rem; transition:var(--transition);
}}
.btn-wa-checkout:hover{{ background:#22c55e; }}

/* ── Modal ── */
.modal{{
  position:fixed; top:50%; left:50%; transform:translate(-50%,-60%);
  background:#fff; border-radius:var(--radius); z-index:202; padding:30px;
  max-width:600px; width:calc(100% - 40px); max-height:90vh; overflow-y:auto;
  visibility:hidden; opacity:0; transition:var(--transition);
  box-shadow:0 24px 80px rgba(0,0,0,.2);
}}
.modal.open{{ visibility:visible; opacity:1; transform:translate(-50%,-50%); }}
.modal-close{{ position:absolute; top:16px; right:16px; background:#f3f4f6; border:none; width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:.9rem; transition:var(--transition); }}
.modal-close:hover{{ background:#e5e7eb; }}
.modal-body h2{{ font-size:1.4rem; font-weight:800; margin-bottom:20px; }}

/* Quick view */
.qv-grid{{ display:grid; grid-template-columns:1fr 1fr; gap:24px; }}
.qv-img{{ width:100%; border-radius:var(--radius); object-fit:cover; aspect-ratio:1; }}
.qv-name{{ font-size:1.3rem; font-weight:800; margin-bottom:8px; }}
.qv-desc{{ font-size:.88rem; color:var(--gray); line-height:1.7; margin-bottom:16px; }}
.qv-price{{ font-size:1.6rem; font-weight:900; color:var(--primary); margin-bottom:20px; }}

/* Checkout form */
.checkout-form{{ display:flex; flex-direction:column; gap:12px; }}
.checkout-form input, .checkout-form select{{
  padding:12px 16px; border:1.5px solid #e5e7eb; border-radius:var(--radius-sm);
  font-size:.9rem; outline:none; font-family:inherit; transition:var(--transition);
}}
.checkout-form input:focus{{ border-color:var(--primary); }}
.form-row{{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }}
.order-summary{{ background:#f9fafb; border-radius:var(--radius-sm); padding:16px; margin:4px 0; }}
.order-summary-item{{ display:flex; justify-content:space-between; font-size:.88rem; margin-bottom:6px; }}
.order-summary-total{{ display:flex; justify-content:space-between; font-weight:800; font-size:.95rem; margin-top:10px; padding-top:10px; border-top:1px solid #e5e7eb; }}
.btn-place-order{{
  padding:15px; background:linear-gradient(135deg,var(--primary),var(--secondary));
  color:#fff; border:none; border-radius:var(--radius-sm); cursor:pointer;
  font-weight:800; font-size:1rem; font-family:inherit; transition:var(--transition);
}}
.btn-place-order:hover{{ opacity:.88; }}

/* ── Toast ── */
#toastContainer{{ position:fixed; bottom:28px; left:50%; transform:translateX(-50%); z-index:9999; display:flex; flex-direction:column; gap:8px; pointer-events:none; }}
.toast{{
  background:#1f2937; color:#fff; padding:12px 24px; border-radius:50px;
  font-size:.88rem; font-weight:600; animation:toastIn .35s ease;
  box-shadow:0 8px 24px rgba(0,0,0,.2);
}}
.toast.success{{ background:linear-gradient(135deg,#10b981,#059669); }}
.toast.error{{ background:linear-gradient(135deg,#ef4444,#dc2626); }}
@keyframes toastIn{{ from{{opacity:0;transform:translateY(16px)}} to{{opacity:1;transform:translateY(0)}} }}

/* ── FABs ── */
.fab-container{{ position:fixed; bottom:26px; right:22px; display:flex; flex-direction:column; gap:12px; z-index:150; }}
.fab{{
  width:52px; height:52px; border-radius:50%; display:flex; align-items:center; justify-content:center;
  box-shadow:0 6px 20px rgba(0,0,0,.22); transition:var(--transition); color:#fff;
}}
.fab:hover{{ transform:scale(1.12); }}
.fab-wa{{ background:#25D366; }}
.fab-ig{{ background:linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888); }}

/* ── Scroll Top ── */
.scroll-top{{
  position:fixed; bottom:90px; right:22px; width:40px; height:40px; border-radius:50%;
  background:linear-gradient(135deg,var(--primary),var(--secondary)); color:#fff; border:none;
  cursor:pointer; font-size:1rem; z-index:150; opacity:0; visibility:hidden;
  transition:var(--transition); box-shadow:0 4px 14px rgba(99,102,241,.4);
}}
.scroll-top.visible{{ opacity:1; visibility:visible; }}
.scroll-top:hover{{ transform:translateY(-3px) scale(1.05); }}

/* ── Builder content ── */
.builder-section{{ overflow:hidden; }}

/* ── Responsive ── */
@media (max-width:1024px){{
  .about-inner{{ grid-template-columns:1fr; gap:48px; }}
  .footer-inner{{ grid-template-columns:1fr 1fr; }}
}}
@media (max-width:768px){{
  .nav-links{{ display:none; flex-direction:column; position:fixed; top:66px; left:0; right:0;
    background:rgba(255,255,255,.97); padding:20px; border-bottom:1px solid #e5e7eb; gap:8px; z-index:99; }}
  .nav-links.open{{ display:flex; }}
  .nav-links a{{ padding:10px 16px; border-radius:10px; }}
  .menu-toggle{{ display:block; }}
  .search-wrap input{{ width:120px; }}
  .products-grid{{ grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; }}
  .about-visual{{ grid-template-columns:1fr 1fr; }}
  .footer-inner{{ grid-template-columns:1fr; gap:32px; }}
  .qv-grid{{ grid-template-columns:1fr; }}
}}
@media (max-width:480px){{
  .hero-stats{{ gap:20px; }}
  .products-grid{{ grid-template-columns:1fr 1fr; gap:12px; }}
  .hero-title{{ font-size:2.2rem; }}
  .cart-drawer{{ width:100%; right:-100%; }}
  .about-visual{{ grid-template-columns:1fr; }}
}}
"""


def generate_full_store_js(shop, products):
    whatsapp = _safe(shop.get('whatsapp_number'))
    shop_id  = shop.get('id', 0)
    shop_name = _safe(shop.get('name'), 'Store')

    # Serialize products for search/filter
    products_data = []
    for p in products:
        imgs = _get_images(p)
        products_data.append({
            'id': p.get('id'),
            'name': _safe(p.get('name')),
            'price': float(p.get('price') or 0),
            'cat': str(p.get('category_id') or 'none'),
            'img': imgs[0] if imgs else ''
        })

    return f"""/* ShopEZ Premium Store JS — {shop_name} */
'use strict';

// ── Data ──────────────────────────────────────────────────────────────────────
const SHOP_ID = {shop_id};
const WA_NUMBER = '{whatsapp}';
const SHOP_NAME = '{shop_name.replace(chr(39),chr(39))}';
const PRODUCTS_DATA = {json.dumps(products_data)};

// ── State ─────────────────────────────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('cart_' + SHOP_ID) || '[]');
let activeCat = 'all';
let searchQ = '';

// ── Page Loader ───────────────────────────────────────────────────────────────
window.addEventListener('load', () => {{
  setTimeout(() => document.getElementById('page-loader')?.classList.add('hidden'), 500);
}});

// ── AOS (scroll animations) ───────────────────────────────────────────────────
const aosObserver = new IntersectionObserver((entries) => {{
  entries.forEach(e => {{ if (e.isIntersecting) {{ e.target.classList.add('aos-animate'); }} }});
}}, {{ threshold: 0.12 }});
document.querySelectorAll('[data-aos]').forEach(el => aosObserver.observe(el));

// ── Navbar scroll ─────────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {{
  const nb = document.getElementById('navbar');
  if (nb) nb.classList.toggle('scrolled', window.scrollY > 40);
  const st = document.getElementById('scrollTop');
  if (st) st.classList.toggle('visible', window.scrollY > 400);
}});

// ── Mobile menu ───────────────────────────────────────────────────────────────
function toggleMenu() {{
  document.getElementById('navLinks')?.classList.toggle('open');
}}

// ── Image swap (thumbnail) ────────────────────────────────────────────────────
function swapImg(thumb, defaultSrc) {{
  const card = thumb.closest('.product-card');
  if (!card) return;
  const mainId = card.dataset.id;
  const mainImg = document.getElementById('prod-img-' + mainId);
  if (mainImg) mainImg.src = thumb.src;
  card.querySelectorAll('.thumb').forEach(t => t.style.opacity = '0.6');
  thumb.style.opacity = '1';
}}

// ── Cart ──────────────────────────────────────────────────────────────────────
function saveCart() {{ localStorage.setItem('cart_' + SHOP_ID, JSON.stringify(cart)); }}

function addToCart(id, name, price, img) {{
  id = parseInt(id);
  const idx = cart.findIndex(i => i.id === id);
  if (idx > -1) {{ cart[idx].qty++; }}
  else {{ cart.push({{ id, name, price, img, qty: 1 }}); }}
  saveCart();
  renderCart();
  showToast('🛒 ' + name + ' added!', 'success');
  animCartBtn();
}}

function animCartBtn() {{
  const btn = document.getElementById('cartBtn');
  if (!btn) return;
  btn.style.transform = 'scale(1.2)';
  setTimeout(() => btn.style.transform = '', 200);
}}

function removeFromCart(id) {{
  cart = cart.filter(i => i.id !== id);
  saveCart(); renderCart();
}}

function changeQty(id, delta) {{
  const idx = cart.findIndex(i => i.id === id);
  if (idx === -1) return;
  cart[idx].qty = Math.max(1, cart[idx].qty + delta);
  saveCart(); renderCart();
}}

function renderCart() {{
  const badge = document.getElementById('cartBadge');
  const body  = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');

  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const totalAmt = cart.reduce((s, i) => s + i.price * i.qty, 0);

  if (badge) badge.textContent = totalQty;

  if (!body) return;

  if (cart.length === 0) {{
    body.innerHTML = '<div class="cart-empty">🛒<p style="margin-top:16px;font-weight:600">Your cart is empty</p><p style="font-size:.83rem;color:#9ca3af;margin-top:6px">Start adding some products!</p></div>';
    if (footer) footer.style.display = 'none';
    return;
  }}

  body.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${{item.img || 'https://placehold.co/60x60/f3f4f6/9ca3af?text=No+Img'}}" class="cart-item-img" alt="${{item.name}}" />
      <div class="cart-item-info">
        <div class="cart-item-name">${{item.name}}</div>
        <div class="cart-item-price">₹${{(item.price * item.qty).toFixed(2)}}</div>
        <div class="cart-qty">
          <button class="qty-btn" onclick="changeQty(${{item.id}},-1)">−</button>
          <span class="qty-num">${{item.qty}}</span>
          <button class="qty-btn" onclick="changeQty(${{item.id}},1)">+</button>
          <button class="remove-btn" onclick="removeFromCart(${{item.id}})" title="Remove">✕</button>
        </div>
      </div>
    </div>`).join('');

  if (footer) {{ footer.style.display = 'block'; }}
  if (totalEl) {{ totalEl.textContent = '₹' + totalAmt.toFixed(2); }}

  // WhatsApp checkout button
  if (WA_NUMBER) {{
    const waBtn = document.getElementById('waCheckout');
    if (waBtn) {{
      const msg = 'Hi! I want to order from ' + SHOP_NAME + ':\\n' +
        cart.map(i => i.name + ' x' + i.qty + ' = ₹' + (i.price*i.qty).toFixed(2)).join('\\n') +
        '\\nTotal: ₹' + totalAmt.toFixed(2);
      waBtn.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
    }}
  }}
}}

function toggleCart() {{
  document.getElementById('cartDrawer')?.classList.toggle('open');
  document.getElementById('cartOverlay')?.classList.toggle('active');
}}

// ── Quick View ────────────────────────────────────────────────────────────────
function openQuickView(id) {{
  const card = document.querySelector(`.product-card[data-id="${{id}}"]`);
  if (!card) return;
  const name = card.dataset.name;
  const price = card.dataset.price;
  const img = card.querySelector('.product-img')?.src || '';
  const desc = card.querySelector('.product-desc')?.textContent || '';

  document.getElementById('quickViewBody').innerHTML = `
    <div class="qv-grid">
      <img src="${{img}}" class="qv-img" alt="${{name}}" />
      <div>
        <h3 class="qv-name">${{card.querySelector('.product-name')?.textContent || name}}</h3>
        <p class="qv-desc">${{desc}}</p>
        <div class="qv-price">₹${{parseFloat(price).toFixed(2)}}</div>
        <button class="btn-add-cart" onclick="addToCart(${{id}},'${{card.querySelector('.product-name')?.textContent.replace(/'/g,\\"'\\")||name}}',${{price}},'${{img}}');closeQuickView()">
          🛒 Add to Cart
        </button>
      </div>
    </div>`;
  document.getElementById('quickViewModal')?.classList.add('open');
  document.getElementById('qvOverlay')?.classList.add('active');
}}

function closeQuickView() {{
  document.getElementById('quickViewModal')?.classList.remove('open');
  document.getElementById('qvOverlay')?.classList.remove('active');
}}

// ── Checkout ──────────────────────────────────────────────────────────────────
function openCheckout() {{
  if (!cart.length) {{ showToast('Cart is empty!', 'error'); return; }}
  toggleCart();
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  document.getElementById('orderSummary').innerHTML =
    `<div class="order-summary">` +
    cart.map(i=>`<div class="order-summary-item"><span>${{i.name}} x${{i.qty}}</span><span>₹${{(i.price*i.qty).toFixed(2)}}</span></div>`).join('') +
    `<div class="order-summary-total"><span>Total</span><span>₹${{total.toFixed(2)}}</span></div></div>`;
  document.getElementById('checkoutModal')?.classList.add('open');
  document.getElementById('coOverlay')?.classList.add('active');
}}

function closeCheckout() {{
  document.getElementById('checkoutModal')?.classList.remove('open');
  document.getElementById('coOverlay')?.classList.remove('active');
}}

function submitOrder(e) {{
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());

  const items = cart.map(i=>({{'product_id':i.id,'quantity':i.qty}}));
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  data.shop_id = SHOP_ID;
  data.items = items;

  const btn = e.target.querySelector('.btn-place-order');
  if (btn) {{ btn.textContent='Placing order...'; btn.disabled=true; }}

  fetch('/api/orders', {{
    method:'POST',
    headers:{{'Content-Type':'application/json'}},
    body: JSON.stringify(data)
  }}).then(r=>r.json()).then(res=>{{
    if (res.order_number) {{
      showToast('🎉 Order placed! #'+res.order_number,'success');
      cart = [];
      saveCart(); renderCart();
      closeCheckout();
      if (btn) {{ btn.textContent='Place Order'; btn.disabled=false; }}
      e.target.reset();
    }} else {{
      showToast(res.error||'Order failed','error');
      if (btn) {{ btn.textContent='🎉 Place Order'; btn.disabled=false; }}
    }}
  }}).catch(()=>{{
    showToast('Network error. Try WhatsApp instead.','error');
    if (btn) {{ btn.textContent='🎉 Place Order'; btn.disabled=false; }}
  }});
}}

// ── Filter & Search ───────────────────────────────────────────────────────────
function filterCat(cat, btn) {{
  activeCat = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyFilters();
}}

function searchProducts() {{
  searchQ = (document.getElementById('searchInput')?.value || '').toLowerCase();
  applyFilters();
}}

function applyFilters() {{
  const cards = document.querySelectorAll('.product-card');
  let visible = 0;
  cards.forEach(card => {{
    const matchCat = activeCat === 'all' || card.dataset.cat === activeCat;
    const matchSearch = !searchQ || card.dataset.name.includes(searchQ);
    const show = matchCat && matchSearch;
    card.classList.toggle('hidden', !show);
    if (show) visible++;
  }});
  const countEl = document.getElementById('productsCount');
  if (countEl) countEl.textContent = visible + ' product' + (visible !== 1 ? 's' : '');
}}

function sortProducts() {{
  const val = document.getElementById('sortSelect')?.value || 'default';
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll('.product-card'));
  cards.sort((a, b) => {{
    const pa = parseFloat(a.dataset.price), pb = parseFloat(b.dataset.price);
    const na = a.dataset.name || '', nb = b.dataset.name || '';
    if (val === 'price-asc') return pa - pb;
    if (val === 'price-desc') return pb - pa;
    if (val === 'name-asc') return na.localeCompare(nb);
    return 0;
  }});
  cards.forEach(c => grid.appendChild(c));
}}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type='') {{
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}}

// ── Init ──────────────────────────────────────────────────────────────────────
renderCart();
applyFilters();
"""


def generate_store_database(shop, products, categories, orders):
    """Generate a complete SQL dump for the shop's data."""
    name    = _safe(shop.get('name'), 'store').replace("'", "''")
    slug    = _safe(shop.get('slug'), 'store')
    shop_id = shop.get('id', 1)

    lines = [
        f"-- ShopEZ Store Database Export",
        f"-- Store: {name}",
        f"-- Generated automatically by ShopEZ",
        f"",
        f"CREATE DATABASE IF NOT EXISTS `{slug}_store` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
        f"USE `{slug}_store`;",
        f"",
        f"-- ─────────────────────────────────────────",
        f"-- Table: products",
        f"-- ─────────────────────────────────────────",
        f"CREATE TABLE IF NOT EXISTS `products` (",
        f"  `id` INT AUTO_INCREMENT PRIMARY KEY,",
        f"  `name` VARCHAR(255) NOT NULL,",
        f"  `description` TEXT,",
        f"  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,",
        f"  `compare_price` DECIMAL(10,2),",
        f"  `sku` VARCHAR(100),",
        f"  `stock_quantity` INT DEFAULT 0,",
        f"  `images` JSON,",
        f"  `category_id` INT,",
        f"  `is_active` TINYINT(1) DEFAULT 1,",
        f"  `is_featured` TINYINT(1) DEFAULT 0,",
        f"  `sales_count` INT DEFAULT 0,",
        f"  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        f") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
        f"",
        f"-- ─────────────────────────────────────────",
        f"-- Table: categories",
        f"-- ─────────────────────────────────────────",
        f"CREATE TABLE IF NOT EXISTS `categories` (",
        f"  `id` INT AUTO_INCREMENT PRIMARY KEY,",
        f"  `name` VARCHAR(255) NOT NULL,",
        f"  `description` TEXT,",
        f"  `sort_order` INT DEFAULT 0,",
        f"  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        f") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
        f"",
        f"-- ─────────────────────────────────────────",
        f"-- Table: orders",
        f"-- ─────────────────────────────────────────",
        f"CREATE TABLE IF NOT EXISTS `orders` (",
        f"  `id` INT AUTO_INCREMENT PRIMARY KEY,",
        f"  `order_number` VARCHAR(50) NOT NULL UNIQUE,",
        f"  `customer_name` VARCHAR(255) NOT NULL,",
        f"  `customer_email` VARCHAR(255) NOT NULL,",
        f"  `customer_phone` VARCHAR(30),",
        f"  `shipping_address` TEXT NOT NULL,",
        f"  `city` VARCHAR(100),",
        f"  `state` VARCHAR(100),",
        f"  `postal_code` VARCHAR(20),",
        f"  `subtotal` DECIMAL(10,2) NOT NULL,",
        f"  `total_amount` DECIMAL(10,2) NOT NULL,",
        f"  `status` ENUM('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending',",
        f"  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        f") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
        f"",
        f"-- ─────────────────────────────────────────",
        f"-- Table: order_items",
        f"-- ─────────────────────────────────────────",
        f"CREATE TABLE IF NOT EXISTS `order_items` (",
        f"  `id` INT AUTO_INCREMENT PRIMARY KEY,",
        f"  `order_id` INT NOT NULL,",
        f"  `product_id` INT,",
        f"  `product_name` VARCHAR(255) NOT NULL,",
        f"  `product_price` DECIMAL(10,2) NOT NULL,",
        f"  `quantity` INT NOT NULL,",
        f"  `subtotal` DECIMAL(10,2) NOT NULL,",
        f"  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE",
        f") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
        f"",
        f"-- ─────────────────────────────────────────",
        f"-- Table: cart",
        f"-- ─────────────────────────────────────────",
        f"CREATE TABLE IF NOT EXISTS `cart` (",
        f"  `id` INT AUTO_INCREMENT PRIMARY KEY,",
        f"  `session_id` VARCHAR(100),",
        f"  `product_id` INT NOT NULL,",
        f"  `quantity` INT NOT NULL DEFAULT 1,",
        f"  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        f") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
        f"",
        f"-- ─────────────────────────────────────────",
        f"-- Table: settings",
        f"-- ─────────────────────────────────────────",
        f"CREATE TABLE IF NOT EXISTS `settings` (",
        f"  `id` INT AUTO_INCREMENT PRIMARY KEY,",
        f"  `setting_key` VARCHAR(100) NOT NULL UNIQUE,",
        f"  `setting_value` LONGTEXT,",
        f"  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        f") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
        f"",
        f"-- ─────────────────────────────────────────",
        f"-- INSERT: Store settings",
        f"-- ─────────────────────────────────────────",
        f"INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES",
        f"  ('store_name', '{name}'),",
        f"  ('theme_color', '{_safe(shop.get('theme_color'), '#6366f1')}'),",
        f"  ('font_family', '{_safe(shop.get('font_family'), 'Poppins')}'),",
        f"  ('whatsapp', '{_safe(shop.get('whatsapp_number'))}'),",
        f"  ('instagram', '{_safe(shop.get('instagram_url'))}');",
        f""
    ]

    # Insert categories
    if categories:
        lines.append("-- ─────────────────────────────────────────")
        lines.append("-- INSERT: Categories")
        lines.append("-- ─────────────────────────────────────────")
        for cat in categories:
            cname = _safe(cat.get('name')).replace("'", "''")
            cdesc = _safe(cat.get('description')).replace("'", "''")
            lines.append(f"INSERT INTO `categories` (`id`,`name`,`description`,`sort_order`) VALUES ({cat['id']},'{cname}','{cdesc}',{cat.get('sort_order',0)});")
        lines.append("")

    # Insert products
    if products:
        lines.append("-- ─────────────────────────────────────────")
        lines.append("-- INSERT: Products")
        lines.append("-- ─────────────────────────────────────────")
        for p in products:
            pname  = _safe(p.get('name')).replace("'", "''")
            pdesc  = _safe(p.get('description')).replace("'", "''")
            price  = float(p.get('price') or 0)
            comp   = f"{float(p.get('compare_price') or 0):.2f}" if p.get('compare_price') else 'NULL'
            sku    = _safe(p.get('sku')).replace("'", "''")
            stock  = int(p.get('stock_quantity') or 0)
            imgs   = json.dumps(_get_images(p)).replace("'", "''")
            cat_id = f"{p.get('category_id')}" if p.get('category_id') else 'NULL'
            feat   = 1 if p.get('is_featured') == 1 else 0
            sales  = int(p.get('sales_count') or 0)
            lines.append(f"INSERT INTO `products` (`id`,`name`,`description`,`price`,`compare_price`,`sku`,`stock_quantity`,`images`,`category_id`,`is_featured`,`sales_count`) VALUES ({p['id']},'{pname}','{pdesc}',{price:.2f},{comp},'{sku}',{stock},'{imgs}',{cat_id},{feat},{sales});")
        lines.append("")

    # Insert orders
    if orders:
        lines.append("-- ─────────────────────────────────────────")
        lines.append("-- INSERT: Orders")
        lines.append("-- ─────────────────────────────────────────")
        for o in orders:
            onum  = _safe(o.get('order_number')).replace("'","''")
            oname = _safe(o.get('customer_name')).replace("'","''")
            omail = _safe(o.get('customer_email')).replace("'","''")
            ophone= _safe(o.get('customer_phone')).replace("'","''")
            oaddr = _safe(o.get('shipping_address')).replace("'","''")
            ocity = _safe(o.get('city')).replace("'","''")
            ostate= _safe(o.get('state')).replace("'","''")
            ozip  = _safe(o.get('postal_code')).replace("'","''")
            osub  = float(o.get('subtotal') or 0)
            otot  = float(o.get('total_amount') or 0)
            ostat = _safe(o.get('status'), 'pending')
            lines.append(f"INSERT INTO `orders` (`order_number`,`customer_name`,`customer_email`,`customer_phone`,`shipping_address`,`city`,`state`,`postal_code`,`subtotal`,`total_amount`,`status`) VALUES ('{onum}','{oname}','{omail}','{ophone}','{oaddr}','{ocity}','{ostate}','{ozip}',{osub:.2f},{otot:.2f},'{ostat}');")
        lines.append("")

    lines += [
        "-- ─────────────────────────────────────────",
        "-- Indexes for performance",
        "-- ─────────────────────────────────────────",
        "CREATE INDEX idx_product_active ON `products`(`is_active`);",
        "CREATE INDEX idx_product_featured ON `products`(`is_featured`);",
        "CREATE INDEX idx_product_category ON `products`(`category_id`);",
        "CREATE INDEX idx_order_status ON `orders`(`status`);",
        "CREATE FULLTEXT INDEX idx_product_search ON `products`(`name`,`description`);",
        "",
        f"-- End of {name} database export"
    ]
    return "\n".join(lines)


def generate_readme(shop):
    name = _safe(shop.get('name'), 'My Store')
    slug = _safe(shop.get('slug'), 'store')
    return f"""# {name} — Online Store

Built with **ShopEZ** No-Code E-commerce Platform.

## Files in this package

| File | Description |
|------|-------------|
| `index.html` | Main store page (fully self-contained) |
| `style.css` | Complete CSS with animations, dark-mode ready |
| `app.js` | Cart, checkout, filters, search, quick-view |
| `{slug}-database.sql` | MySQL schema + all product & order data |
| `README.md` | This file |

## Quick Deploy Options

### 1. Netlify Drop (Easiest)
1. Go to [netlify.com/drop](https://app.netlify.com/drop)
2. Drag this folder onto the page
3. Your store is live instantly — free!

### 2. GitHub Pages
1. Push to a GitHub repository
2. Settings → Pages → Deploy from main branch
3. Access at `https://<user>.github.io/<repo>/`

### 3. Vercel
```bash
npm i -g vercel
vercel --prod
```

### 4. Traditional Hosting
Upload all files to your `public_html` folder via FTP/cPanel.

## Database Setup
```sql
-- Import the SQL file into your MySQL server:
mysql -u root -p < {slug}-database.sql
```

## Customization
- Open `style.css` and change `:root {{ --primary: ... }}` to your brand color
- Edit product cards in `index.html`
- Add your Google Analytics in `<head>`

---
© 2024 {name} · Powered by [ShopEZ](https://shopez.app)
"""
