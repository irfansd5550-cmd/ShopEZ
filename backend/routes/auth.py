"""Authentication routes for ShopEZ — enhanced"""

import os
import bcrypt
import secrets
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import requests as http_requests
from utils.db import query_db, execute_db
from utils.helpers import validate_email, generate_slug
from services.email_service import send_welcome, send_password_reset

auth_bp = Blueprint('auth', __name__)


def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def safe_user(user):
    skip = {'password_hash', 'verification_token', 'reset_token', 'reset_token_expiry'}
    return {k: v for k, v in user.items() if k not in skip}


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name     = data.get('name', '').strip()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
    if not validate_email(email):
        return jsonify({'error': 'Invalid email address'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    if query_db('SELECT id FROM users WHERE email = %s', (email,), one=True):
        return jsonify({'error': 'Email already registered'}), 409

    password_hash       = hash_password(password)
    verification_token  = secrets.token_urlsafe(32)

    user_id = execute_db(
        'INSERT INTO users (name, email, password_hash, verification_token) VALUES (%s,%s,%s,%s)',
        (name, email, password_hash, verification_token),
        return_id=True
    )

    try:
        send_welcome(email, name)
    except Exception:
        pass

    token = create_access_token(identity=str(user_id))
    user  = query_db('SELECT id,name,email,role,avatar_url,created_at FROM users WHERE id=%s', (user_id,), one=True)
    return jsonify({'token': token, 'user': user}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data     = request.get_json() or {}
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = query_db('SELECT * FROM users WHERE email=%s', (email,), one=True)
    if not user or not user.get('password_hash') or not check_password(password, user['password_hash']):
        return jsonify({'error': 'Invalid email or password'}), 401
    if not user['is_active']:
        return jsonify({'error': 'Account suspended. Contact support.'}), 403

    token = create_access_token(identity=str(user['id']))
    return jsonify({'token': token, 'user': safe_user(user)})


@auth_bp.route('/google', methods=['POST'])
def google_auth():
    data         = request.get_json() or {}
    access_token = data.get('access_token') or data.get('token')
    id_token     = data.get('id_token')
    user_info    = None

    if access_token:
        resp = http_requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}, timeout=5
        )
        if resp.status_code == 200:
            user_info = resp.json()

    if not user_info and id_token:
        resp = http_requests.get(f'https://oauth2.googleapis.com/tokeninfo?id_token={id_token}', timeout=5)
        if resp.status_code == 200:
            info = resp.json()
            user_info = {'id': info.get('sub'), 'email': info.get('email'),
                         'name': info.get('name'), 'picture': info.get('picture')}

    if not user_info:
        return jsonify({'error': 'Failed to get user info from Google'}), 400

    google_id = user_info.get('id')
    email     = user_info.get('email', '').lower()
    name      = user_info.get('name', '')
    avatar    = user_info.get('picture', '')

    user = query_db('SELECT * FROM users WHERE google_id=%s OR email=%s', (google_id, email), one=True)

    if user:
        if not user['google_id']:
            execute_db('UPDATE users SET google_id=%s, avatar_url=%s WHERE id=%s', (google_id, avatar, user['id']))
        if not user['is_active']:
            return jsonify({'error': 'Account suspended'}), 403
        user_id = user['id']
    else:
        user_id = execute_db(
            'INSERT INTO users (name,email,google_id,avatar_url,email_verified) VALUES (%s,%s,%s,%s,1)',
            (name, email, google_id, avatar), return_id=True
        )
        try:
            send_welcome(email, name)
        except Exception:
            pass

    token = create_access_token(identity=str(user_id))
    user  = query_db('SELECT id,name,email,role,avatar_url,created_at FROM users WHERE id=%s', (user_id,), one=True)
    return jsonify({'token': token, 'user': user})


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = query_db('SELECT id,name,email,role,avatar_url,created_at FROM users WHERE id=%s', (user_id,), one=True)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user})


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data  = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    user  = query_db('SELECT id,name FROM users WHERE email=%s', (email,), one=True)

    if user:
        reset_token = secrets.token_urlsafe(32)
        execute_db(
            'UPDATE users SET reset_token=%s, reset_token_expiry=DATE_ADD(NOW(),INTERVAL 1 HOUR) WHERE email=%s',
            (reset_token, email)
        )
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
        reset_url = f'{frontend_url}/reset-password?token={reset_token}'
        try:
            send_password_reset(email, user['name'], reset_url)
        except Exception:
            pass

    return jsonify({'message': 'If that email exists, a reset link has been sent.'})


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data        = request.get_json() or {}
    token       = data.get('token', '')
    new_password = data.get('password', '')

    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    user = query_db(
        'SELECT id FROM users WHERE reset_token=%s AND reset_token_expiry>NOW()', (token,), one=True
    )
    if not user:
        return jsonify({'error': 'Invalid or expired reset token'}), 400

    execute_db(
        'UPDATE users SET password_hash=%s, reset_token=NULL, reset_token_expiry=NULL WHERE id=%s',
        (hash_password(new_password), user['id'])
    )
    return jsonify({'message': 'Password reset successfully'})
