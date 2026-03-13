/**
 * Template HTML/CSS generator for GrapesJS builder
 */

export function getTemplateContent(templateId, shop = {}) {
  const name = shop.name || 'My Store'
  const desc = shop.description || 'Welcome to our store'
  const color = shop.theme_color || '#6366f1'
  const font = shop.font_family || 'Poppins'

  const templates = {
    fashion: getFashionTemplate(name, desc, color, font),
    electronics: getElectronicsTemplate(name, desc, color, font),
    furniture: getFurnitureTemplate(name, desc, color, font),
    luxury: getLuxuryTemplate(name, desc, color, font),
    minimal: getMinimalTemplate(name, desc, color, font),
    modern: getModernTemplate(name, desc, color, font),
    creative: getCreativeTemplate(name, desc, color, font)
  }

  return templates[templateId] || templates.minimal
}

function getMinimalTemplate(name, desc, color, font) {
  return {
    html: `
<div class="store-wrapper">
  <header class="store-header">
    <nav class="nav-container">
      <div class="logo">${name}</div>
      <ul class="nav-links">
        <li><a href="#home">Home</a></li>
        <li><a href="#products">Products</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <section class="hero-section" id="home">
    <div class="hero-content">
      <h1 class="hero-title">${name}</h1>
      <p class="hero-subtitle">${desc}</p>
      <a href="#products" class="hero-btn">Shop Now</a>
    </div>
  </section>

  <section class="products-section" id="products">
    <div class="section-container">
      <h2 class="section-title">Our Products</h2>
      <div class="products-grid">
        <div class="product-card">
          <div class="product-image">
            <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400" alt="Product" />
          </div>
          <div class="product-info">
            <h3>Premium Watch</h3>
            <p class="product-price">₹2,999</p>
            <button class="add-cart-btn">Add to Cart</button>
          </div>
        </div>
        <div class="product-card">
          <div class="product-image">
            <img src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400" alt="Product" />
          </div>
          <div class="product-info">
            <h3>Camera Lens</h3>
            <p class="product-price">₹8,500</p>
            <button class="add-cart-btn">Add to Cart</button>
          </div>
        </div>
        <div class="product-card">
          <div class="product-image">
            <img src="https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400" alt="Product" />
          </div>
          <div class="product-info">
            <h3>Running Shoes</h3>
            <p class="product-price">₹3,200</p>
            <button class="add-cart-btn">Add to Cart</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="about-section" id="about">
    <div class="section-container about-grid">
      <div class="about-text">
        <h2>About Us</h2>
        <p>We're passionate about bringing you the finest products. Our store offers carefully curated items that blend quality, style, and value.</p>
        <a href="#contact" class="hero-btn">Get in Touch</a>
      </div>
      <div class="about-image">
        <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500" alt="About" />
      </div>
    </div>
  </section>

  <footer class="store-footer" id="contact">
    <div class="section-container">
      <div class="footer-logo">${name}</div>
      <p>Quality products, delivered to your door.</p>
      <p style="margin-top: 20px; opacity: 0.6; font-size: 14px;">© 2024 ${name}. Built with ShopEZ.</p>
    </div>
  </footer>
</div>`,
    css: `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: '${font}', sans-serif; color: #1a1a2e; }
.store-wrapper { min-height: 100vh; }

.store-header { position: sticky; top: 0; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-bottom: 1px solid #eee; z-index: 100; }
.nav-container { max-width: 1200px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
.logo { font-size: 1.5rem; font-weight: 800; color: ${color}; }
.nav-links { display: flex; list-style: none; gap: 32px; }
.nav-links a { text-decoration: none; color: #4b5563; font-weight: 500; transition: color 0.2s; }
.nav-links a:hover { color: ${color}; }

.hero-section { min-height: 85vh; display: flex; align-items: center; justify-content: center; text-align: center; background: linear-gradient(135deg, ${color}15, ${color}30); padding: 80px 24px; }
.hero-title { font-size: 4rem; font-weight: 900; color: #1a1a2e; margin-bottom: 20px; line-height: 1.1; }
.hero-subtitle { font-size: 1.25rem; color: #6b7280; margin-bottom: 36px; max-width: 600px; }
.hero-btn { display: inline-block; background: ${color}; color: white; padding: 14px 36px; border-radius: 50px; font-weight: 700; text-decoration: none; transition: all 0.3s; font-size: 1rem; }
.hero-btn:hover { transform: translateY(-3px); box-shadow: 0 12px 30px ${color}55; }

.section-container { max-width: 1200px; margin: 0 auto; padding: 80px 24px; }
.section-title { text-align: center; font-size: 2.5rem; font-weight: 800; margin-bottom: 48px; color: #1a1a2e; }

.products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 28px; }
.product-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); transition: all 0.3s; }
.product-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(0,0,0,0.15); }
.product-image img { width: 100%; height: 240px; object-fit: cover; }
.product-info { padding: 20px; }
.product-info h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
.product-price { font-size: 1.4rem; font-weight: 800; color: ${color}; margin-bottom: 16px; }
.add-cart-btn { width: 100%; padding: 12px; background: ${color}; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 700; font-size: 0.95rem; transition: opacity 0.2s; }
.add-cart-btn:hover { opacity: 0.85; }

.about-section { background: #f8fafc; }
.about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
.about-text h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 20px; }
.about-text p { color: #6b7280; line-height: 1.8; margin-bottom: 28px; }
.about-image img { width: 100%; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }

.store-footer { background: #1a1a2e; color: white; text-align: center; padding: 48px 24px; }
.footer-logo { font-size: 2rem; font-weight: 900; color: ${color}; margin-bottom: 12px; }

@media (max-width: 768px) {
  .hero-title { font-size: 2.5rem; }
  .about-grid { grid-template-columns: 1fr; }
  .nav-links { display: none; }
}`
  }
}

function getFashionTemplate(name, desc, color, font) {
  return {
    html: `
<div class="fashion-store">
  <header class="fashion-header">
    <div class="fashion-nav">
      <div class="fashion-logo">${name}</div>
      <div class="nav-menu">
        <a href="#new">New Arrivals</a>
        <a href="#women">Women</a>
        <a href="#men">Men</a>
        <a href="#sale">Sale</a>
      </div>
    </div>
  </header>
  <section class="fashion-hero">
    <div class="fashion-hero-content">
      <span class="fashion-tag">New Collection 2024</span>
      <h1>Style That <span>Speaks</span></h1>
      <p>${desc}</p>
      <div class="hero-actions">
        <a href="#products" class="btn-dark">Shop Women</a>
        <a href="#products" class="btn-outline">Shop Men</a>
      </div>
    </div>
    <div class="fashion-hero-image">
      <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600" alt="Fashion" />
    </div>
  </section>
  <section class="fashion-products" id="products">
    <div class="fashion-container">
      <h2>Featured Collection</h2>
      <div class="fashion-grid">
        <div class="fashion-item">
          <div class="fashion-item-img"><img src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400" alt="Dress" /><div class="fashion-overlay"><button>Quick View</button></div></div>
          <p class="fashion-cat">Women's</p><h3>Summer Floral Dress</h3><p class="fashion-price">₹1,299</p>
        </div>
        <div class="fashion-item">
          <div class="fashion-item-img"><img src="https://images.unsplash.com/photo-1542060748-10c28b62716f?w=400" alt="Jacket" /><div class="fashion-overlay"><button>Quick View</button></div></div>
          <p class="fashion-cat">Men's</p><h3>Classic Denim Jacket</h3><p class="fashion-price">₹2,499</p>
        </div>
        <div class="fashion-item">
          <div class="fashion-item-img"><img src="https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=400" alt="Shoes" /><div class="fashion-overlay"><button>Quick View</button></div></div>
          <p class="fashion-cat">Footwear</p><h3>Leather Oxford Shoes</h3><p class="fashion-price">₹3,799</p>
        </div>
        <div class="fashion-item">
          <div class="fashion-item-img"><img src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400" alt="Bag" /><div class="fashion-overlay"><button>Quick View</button></div></div>
          <p class="fashion-cat">Accessories</p><h3>Tote Bag</h3><p class="fashion-price">₹899</p>
        </div>
      </div>
    </div>
  </section>
  <footer class="fashion-footer">
    <p>${name} — Fashion for Everyone</p>
    <p style="opacity:0.5; font-size:13px; margin-top:8px">© 2024 ${name}. Built with ShopEZ.</p>
  </footer>
</div>`,
    css: `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: '${font}', sans-serif; }
.fashion-store { background: #fff; }
.fashion-header { background: white; border-bottom: 1px solid #f0f0f0; position: sticky; top: 0; z-index: 100; }
.fashion-nav { max-width: 1200px; margin: 0 auto; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
.fashion-logo { font-size: 1.8rem; font-weight: 900; letter-spacing: -1px; }
.nav-menu a { margin-left: 28px; text-decoration: none; color: #333; font-size: 0.9rem; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
.fashion-hero { display: grid; grid-template-columns: 1fr 1fr; min-height: 90vh; }
.fashion-hero-content { display: flex; flex-direction: column; justify-content: center; padding: 80px; }
.fashion-tag { font-size: 0.8rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${color}; background: ${color}15; padding: 8px 16px; border-radius: 50px; display: inline-block; margin-bottom: 24px; width: fit-content; }
.fashion-hero-content h1 { font-size: 5rem; font-weight: 900; line-height: 1; margin-bottom: 20px; }
.fashion-hero-content h1 span { color: ${color}; }
.fashion-hero-content p { color: #666; font-size: 1.1rem; margin-bottom: 36px; line-height: 1.7; }
.hero-actions { display: flex; gap: 16px; }
.btn-dark { padding: 16px 36px; background: #1a1a2e; color: white; border-radius: 6px; text-decoration: none; font-weight: 700; transition: all 0.3s; }
.btn-outline { padding: 16px 36px; border: 2px solid #1a1a2e; color: #1a1a2e; border-radius: 6px; text-decoration: none; font-weight: 700; transition: all 0.3s; }
.btn-dark:hover, .btn-outline:hover { transform: translateY(-2px); }
.fashion-hero-image img { width: 100%; height: 100%; object-fit: cover; }
.fashion-container { max-width: 1200px; margin: 0 auto; padding: 80px 24px; }
.fashion-container h2 { font-size: 2.5rem; font-weight: 900; margin-bottom: 40px; text-align: center; }
.fashion-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
.fashion-item-img { position: relative; overflow: hidden; border-radius: 12px; }
.fashion-item-img img { width: 100%; height: 320px; object-fit: cover; transition: transform 0.5s; }
.fashion-item:hover .fashion-item-img img { transform: scale(1.08); }
.fashion-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); padding: 16px; transform: translateY(100%); transition: transform 0.3s; }
.fashion-item:hover .fashion-overlay { transform: translateY(0); }
.fashion-overlay button { width: 100%; padding: 10px; background: white; border: none; cursor: pointer; font-weight: 700; border-radius: 6px; }
.fashion-cat { color: ${color}; font-size: 0.8rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-top: 12px; }
.fashion-item h3 { font-size: 1rem; font-weight: 700; margin: 6px 0 4px; }
.fashion-price { font-size: 1.1rem; font-weight: 800; color: #1a1a2e; }
.fashion-footer { background: #1a1a2e; color: white; text-align: center; padding: 40px; }`
  }
}

function getElectronicsTemplate(name, desc, color, font) {
  return {
    html: `
<div class="tech-store">
  <header class="tech-header">
    <div class="tech-nav"><span class="tech-logo">⚡ ${name}</span>
      <div class="tech-links"><a href="#products">Products</a><a href="#deals">Deals</a><a href="#support">Support</a></div>
    </div>
  </header>
  <section class="tech-hero">
    <div class="tech-hero-text">
      <div class="tech-badge">🚀 Latest Tech</div>
      <h1>${name}</h1>
      <p>${desc}</p>
      <a href="#products" class="tech-cta">Explore Products →</a>
    </div>
  </section>
  <section class="tech-products" id="products">
    <div class="tech-container">
      <h2>Featured Tech</h2>
      <div class="tech-grid">
        <div class="tech-card"><div class="tech-img"><img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400" alt="Laptop" /></div><div class="tech-info"><span class="tech-label">Laptop</span><h3>MacBook Pro M3</h3><p class="tech-spec">Apple M3 Chip • 16GB RAM • 512GB SSD</p><div class="tech-row"><span class="tech-price">₹1,49,990</span><button class="tech-btn">Buy Now</button></div></div></div>
        <div class="tech-card"><div class="tech-img"><img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400" alt="Phone" /></div><div class="tech-info"><span class="tech-label">Smartphone</span><h3>iPhone 15 Pro</h3><p class="tech-spec">A17 Pro • 256GB • Titanium</p><div class="tech-row"><span class="tech-price">₹1,34,900</span><button class="tech-btn">Buy Now</button></div></div></div>
        <div class="tech-card"><div class="tech-img"><img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400" alt="Headphones" /></div><div class="tech-info"><span class="tech-label">Audio</span><h3>Sony WH-1000XM5</h3><p class="tech-spec">ANC • 30hr Battery • Hi-Res</p><div class="tech-row"><span class="tech-price">₹28,990</span><button class="tech-btn">Buy Now</button></div></div></div>
      </div>
    </div>
  </section>
  <footer class="tech-footer"><p>© 2024 ${name} | Premium Tech Store</p></footer>
</div>`,
    css: `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: '${font}', sans-serif; background: #0a0a1a; color: white; }
.tech-header { background: rgba(10,10,26,0.95); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255,255,255,0.1); position: sticky; top: 0; z-index: 100; }
.tech-nav { max-width: 1200px; margin: 0 auto; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
.tech-logo { font-size: 1.4rem; font-weight: 800; color: ${color}; }
.tech-links a { margin-left: 28px; text-decoration: none; color: rgba(255,255,255,0.7); font-size: 0.9rem; transition: color 0.2s; }
.tech-links a:hover { color: ${color}; }
.tech-hero { min-height: 85vh; display: flex; align-items: center; justify-content: center; text-align: center; background: radial-gradient(ellipse at center, ${color}33 0%, transparent 70%); padding: 80px 24px; }
.tech-badge { display: inline-block; background: ${color}22; border: 1px solid ${color}55; color: ${color}; padding: 8px 20px; border-radius: 50px; font-size: 0.85rem; font-weight: 700; margin-bottom: 24px; }
.tech-hero h1 { font-size: 5rem; font-weight: 900; background: linear-gradient(135deg, white, ${color}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 20px; }
.tech-hero p { color: rgba(255,255,255,0.6); font-size: 1.2rem; margin-bottom: 36px; max-width: 500px; }
.tech-cta { display: inline-block; background: ${color}; color: white; padding: 16px 40px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 1.1rem; transition: all 0.3s; }
.tech-cta:hover { transform: translateY(-3px); box-shadow: 0 12px 30px ${color}66; }
.tech-container { max-width: 1200px; margin: 0 auto; padding: 80px 24px; }
.tech-container h2 { font-size: 2.5rem; font-weight: 800; text-align: center; margin-bottom: 48px; }
.tech-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }
.tech-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; overflow: hidden; transition: all 0.3s; }
.tech-card:hover { border-color: ${color}55; transform: translateY(-4px); }
.tech-img img { width: 100%; height: 220px; object-fit: cover; }
.tech-info { padding: 20px; }
.tech-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: ${color}; }
.tech-info h3 { font-size: 1.2rem; font-weight: 700; margin: 8px 0; }
.tech-spec { color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-bottom: 16px; }
.tech-row { display: flex; justify-content: space-between; align-items: center; }
.tech-price { font-size: 1.3rem; font-weight: 800; color: ${color}; }
.tech-btn { background: ${color}; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 700; transition: opacity 0.2s; }
.tech-btn:hover { opacity: 0.8; }
.tech-footer { background: rgba(0,0,0,0.5); text-align: center; padding: 32px; color: rgba(255,255,255,0.4); font-size: 0.9rem; }`
  }
}

function getFurnitureTemplate(name, desc, color, font) {
  return getMinimalTemplate(name, desc, '#b45309', font)
}

function getLuxuryTemplate(name, desc, color, font) {
  return getElectronicsTemplate(name, desc, '#c084fc', font)
}

function getModernTemplate(name, desc, color, font) {
  return getMinimalTemplate(name, desc, color, font)
}

function getCreativeTemplate(name, desc, color, font) {
  return getMinimalTemplate(name, desc, '#10b981', font)
}
