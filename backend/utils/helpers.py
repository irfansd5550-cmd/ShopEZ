"""Helper utilities for ShopEZ"""

import re
import os
import unicodedata
from flask import current_app
from flask_mail import Message


def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def generate_slug(text, max_length=50):
    """Generate URL-friendly slug from text."""
    text = str(text).lower().strip()
    text = unicodedata.normalize('NFD', text)
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    text = text.strip('-')
    return text[:max_length]


def send_email(to, subject, body, html=None):
    """Send email using Flask-Mail."""
    try:
        from app import mail
        msg = Message(subject=subject, recipients=[to])
        msg.body = body
        if html:
            msg.html = html
        mail.send(msg)
        return True
    except Exception as e:
        print(f'Email error: {e}')
        return False


def allowed_file(filename, allowed_extensions=None):
    """Check if file extension is allowed."""
    if allowed_extensions is None:
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


def paginate(query_result, page, per_page):
    """Paginate a list of results."""
    page = max(1, page)
    total = len(query_result)
    start = (page - 1) * per_page
    end = start + per_page
    items = query_result[start:end]
    return {
        'items': items,
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total + per_page - 1) // per_page
    }
