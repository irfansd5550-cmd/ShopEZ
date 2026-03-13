"""ShopEZ Email Service — HTML email templates via SMTP"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def _send(to: str, subject: str, html: str, plain: str = ""):
    host = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    port = int(os.getenv("MAIL_PORT", 587))
    user = os.getenv("MAIL_USERNAME", "")
    pwd  = os.getenv("MAIL_PASSWORD", "")
    sender = os.getenv("MAIL_DEFAULT_SENDER", f"ShopEZ <{user}>")

    if not user:
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = sender
    msg["To"]      = to

    if plain:
        msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(host, port) as s:
            s.ehlo()
            s.starttls()
            s.login(user, pwd)
            s.sendmail(sender, [to], msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


# ── Base template ─────────────────────────────────────────────────────────────

def _base(title: str, body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>{title}</title>
<style>
  *{{box-sizing:border-box;margin:0;padding:0}}
  body{{font-family:'Segoe UI',Arial,sans-serif;background:#f4f6fb;color:#1a1a2e}}
  .wrap{{max-width:580px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1)}}
  .header{{background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:36px 40px;text-align:center}}
  .header h1{{color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.5px}}
  .header p{{color:rgba(255,255,255,.8);font-size:14px;margin-top:6px}}
  .body{{padding:36px 40px}}
  .body h2{{font-size:20px;font-weight:700;margin-bottom:12px;color:#1a1a2e}}
  .body p{{font-size:15px;line-height:1.7;color:#4b5563;margin-bottom:14px}}
  .btn{{display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;margin:8px 0}}
  .info-box{{background:#f9fafb;border-left:4px solid #6366f1;border-radius:8px;padding:16px 20px;margin:20px 0}}
  .info-box p{{margin:0;font-size:14px}}
  table{{width:100%;border-collapse:collapse;margin:16px 0}}
  table th{{background:#f3f4f6;padding:10px 14px;text-align:left;font-size:13px;font-weight:600;color:#6b7280}}
  table td{{padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:14px}}
  .total-row td{{font-weight:700;font-size:15px;border-top:2px solid #e5e7eb;padding-top:14px}}
  .footer{{background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb}}
  .footer p{{font-size:13px;color:#9ca3af}}
  .footer a{{color:#6366f1;text-decoration:none}}
  .badge{{display:inline-block;background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;border-radius:50px;padding:4px 14px;font-size:13px;font-weight:600}}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>🛍️ ShopEZ</h1>
    <p>No-Code E-commerce Platform</p>
  </div>
  {body_html}
  <div class="footer">
    <p>© 2024 ShopEZ · <a href="#">Privacy</a> · <a href="#">Unsubscribe</a></p>
    <p style="margin-top:6px">Powered by ShopEZ — Build stores without code.</p>
  </div>
</div>
</body>
</html>"""


# ── Template functions ─────────────────────────────────────────────────────────

def send_welcome(to: str, name: str) -> bool:
    body = f"""
    <div class="body">
      <h2>Welcome to ShopEZ, {name}! 🎉</h2>
      <p>Your account is ready. You can now create stunning online stores without writing a single line of code.</p>
      <div class="info-box">
        <p>✅ <strong>What you can do:</strong></p>
        <p>• Create multiple stores<br>• Add unlimited products<br>• Use our drag-and-drop builder<br>• Publish your store in one click</p>
      </div>
      <p style="text-align:center">
        <a href="{os.getenv('FRONTEND_URL','http://localhost:5173')}/dashboard" class="btn">
          🚀 Open Dashboard
        </a>
      </p>
      <p>If you have any questions, just reply to this email — we're happy to help!</p>
    </div>"""
    return _send(to, f"Welcome to ShopEZ, {name}! 🎉", _base("Welcome to ShopEZ", body))


def send_order_confirmation(to: str, customer_name: str, order_number: str,
                             items: list, total: float, store_name: str) -> bool:
    rows = "".join(
        f"<tr><td>{i.get('product_name','')}</td><td>×{i.get('quantity',1)}</td>"
        f"<td>₹{float(i.get('product_price',0))*int(i.get('quantity',1)):.2f}</td></tr>"
        for i in items
    )
    body = f"""
    <div class="body">
      <h2>Order Confirmed! 🎊</h2>
      <p>Hi <strong>{customer_name}</strong>, your order from <strong>{store_name}</strong> has been placed successfully.</p>
      <div class="info-box">
        <p>Order Number: <strong>#{order_number}</strong> &nbsp;<span class="badge">Confirmed</span></p>
      </div>
      <table>
        <thead><tr><th>Product</th><th>Qty</th><th>Total</th></tr></thead>
        <tbody>
          {rows}
          <tr class="total-row"><td colspan="2">Order Total</td><td>₹{total:.2f}</td></tr>
        </tbody>
      </table>
      <p>The store owner will contact you shortly with shipping details.</p>
    </div>"""
    return _send(to, f"Order #{order_number} Confirmed — {store_name}", _base("Order Confirmed", body))


def send_password_reset(to: str, name: str, reset_url: str) -> bool:
    body = f"""
    <div class="body">
      <h2>Reset Your Password 🔐</h2>
      <p>Hi <strong>{name}</strong>, we received a request to reset your ShopEZ password.</p>
      <p style="text-align:center">
        <a href="{reset_url}" class="btn">Reset Password</a>
      </p>
      <div class="info-box">
        <p>⚠️ This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    </div>"""
    return _send(to, "Reset your ShopEZ password", _base("Password Reset", body))


def send_store_published(to: str, name: str, store_name: str, store_url: str) -> bool:
    body = f"""
    <div class="body">
      <h2>Your store is live! 🚀</h2>
      <p>Hi <strong>{name}</strong>, congratulations! <strong>{store_name}</strong> is now published and accessible to customers.</p>
      <p style="text-align:center">
        <a href="{store_url}" class="btn">Visit Your Store →</a>
      </p>
      <div class="info-box">
        <p>💡 <strong>Pro tip:</strong> Share your store link on WhatsApp and Instagram to start getting orders!</p>
      </div>
    </div>"""
    return _send(to, f"🚀 {store_name} is now live!", _base("Store Published", body))
