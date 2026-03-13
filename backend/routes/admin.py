"""Admin routes — enhanced with full platform management"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import query_db, execute_db

admin_bp = Blueprint('admin', __name__)


def require_admin(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = get_jwt_identity()
        user = query_db('SELECT role FROM users WHERE id=%s', (user_id,), one=True)
        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated


@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@require_admin
def dashboard():
    users_count    = query_db('SELECT COUNT(*) AS cnt FROM users', one=True)
    shops_count    = query_db('SELECT COUNT(*) AS cnt FROM shops', one=True)
    orders_count   = query_db('SELECT COUNT(*) AS cnt FROM orders', one=True)
    revenue        = query_db('SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE status!="cancelled"', one=True)
    published      = query_db('SELECT COUNT(*) AS cnt FROM shops WHERE is_published=1', one=True)
    products_count = query_db('SELECT COUNT(*) AS cnt FROM products WHERE is_active=1', one=True)
    today_orders   = query_db('SELECT COUNT(*) AS cnt FROM orders WHERE DATE(created_at)=CURDATE()', one=True)
    today_revenue  = query_db('SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE DATE(created_at)=CURDATE() AND status!="cancelled"', one=True)

    # Monthly growth (last 6 months)
    monthly = query_db(
        '''SELECT DATE_FORMAT(created_at,'%%Y-%%m') AS month, COUNT(*) AS signups
           FROM users WHERE created_at>=DATE_SUB(NOW(),INTERVAL 6 MONTH)
           GROUP BY month ORDER BY month''',
    )
    revenue_monthly = query_db(
        '''SELECT DATE_FORMAT(created_at,'%%Y-%%m') AS month,
                  COALESCE(SUM(total_amount),0) AS revenue
           FROM orders WHERE created_at>=DATE_SUB(NOW(),INTERVAL 6 MONTH)
             AND status!="cancelled"
           GROUP BY month ORDER BY month'''
    )

    recent_users = query_db(
        'SELECT id,name,email,created_at,is_active FROM users ORDER BY created_at DESC LIMIT 10'
    )
    recent_shops = query_db(
        '''SELECT s.*,u.name AS owner_name,u.email AS owner_email
           FROM shops s JOIN users u ON s.user_id=u.id
           ORDER BY s.created_at DESC LIMIT 10'''
    )
    recent_orders = query_db(
        '''SELECT o.*,s.name AS shop_name
           FROM orders o JOIN shops s ON o.shop_id=s.id
           ORDER BY o.created_at DESC LIMIT 10'''
    )

    return jsonify({
        'stats': {
            'users': users_count['cnt'],
            'shops': shops_count['cnt'],
            'orders': orders_count['cnt'],
            'revenue': float(revenue['total']),
            'published_shops': published['cnt'],
            'products': products_count['cnt'],
            'today_orders': today_orders['cnt'],
            'today_revenue': float(today_revenue['total']),
        },
        'monthly_signups':  monthly,
        'monthly_revenue':  revenue_monthly,
        'recent_users':     recent_users,
        'recent_shops':     recent_shops,
        'recent_orders':    recent_orders,
    })


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@require_admin
def get_users():
    page      = int(request.args.get('page', 1))
    per_page  = int(request.args.get('per_page', 20))
    search    = request.args.get('search', '').strip()
    offset    = (page - 1) * per_page

    where  = '1=1'
    params = []
    if search:
        where = '(u.name LIKE %s OR u.email LIKE %s)'
        params = [f'%{search}%', f'%{search}%']

    users = query_db(
        f'''SELECT u.id,u.name,u.email,u.role,u.is_active,u.created_at,
                   COUNT(s.id) AS shops_count
            FROM users u LEFT JOIN shops s ON u.id=s.user_id
            WHERE {where} GROUP BY u.id ORDER BY u.created_at DESC
            LIMIT %s OFFSET %s''',
        params + [per_page, offset]
    )
    total = query_db(f'SELECT COUNT(*) AS cnt FROM users u WHERE {where}', params, one=True)

    return jsonify({'users': users, 'total': total['cnt'] if total else 0})


@admin_bp.route('/users/<int:user_id>/toggle', methods=['POST'])
@jwt_required()
@require_admin
def toggle_user(user_id):
    user = query_db('SELECT is_active FROM users WHERE id=%s', (user_id,), one=True)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    new_status = 0 if user['is_active'] else 1
    execute_db('UPDATE users SET is_active=%s WHERE id=%s', (new_status, user_id))
    return jsonify({'message': 'User status updated', 'is_active': new_status})


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@require_admin
def delete_user(user_id):
    execute_db('DELETE FROM users WHERE id=%s', (user_id,))
    return jsonify({'message': 'User deleted'})


@admin_bp.route('/shops', methods=['GET'])
@jwt_required()
@require_admin
def get_shops():
    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    search   = request.args.get('search', '').strip()
    offset   = (page - 1) * per_page

    where  = '1=1'
    params = []
    if search:
        where = '(s.name LIKE %s OR u.name LIKE %s)'
        params = [f'%{search}%', f'%{search}%']

    shops = query_db(
        f'''SELECT s.*,u.name AS owner_name,u.email AS owner_email,
                   COUNT(DISTINCT p.id) AS products_count,
                   COUNT(DISTINCT o.id) AS orders_count
            FROM shops s
            JOIN users u ON s.user_id=u.id
            LEFT JOIN products p ON p.shop_id=s.id AND p.is_active=1
            LEFT JOIN orders o ON o.shop_id=s.id
            WHERE {where} GROUP BY s.id
            ORDER BY s.created_at DESC LIMIT %s OFFSET %s''',
        params + [per_page, offset]
    )
    total = query_db(
        f'''SELECT COUNT(*) AS cnt FROM shops s JOIN users u ON s.user_id=u.id WHERE {where}''',
        params, one=True
    )
    return jsonify({'shops': shops, 'total': total['cnt'] if total else 0})


@admin_bp.route('/shops/<int:shop_id>/suspend', methods=['POST'])
@jwt_required()
@require_admin
def suspend_shop(shop_id):
    shop = query_db('SELECT is_suspended FROM shops WHERE id=%s', (shop_id,), one=True)
    if not shop:
        return jsonify({'error': 'Shop not found'}), 404
    new_status = 0 if shop['is_suspended'] else 1
    execute_db('UPDATE shops SET is_suspended=%s WHERE id=%s', (new_status, shop_id))
    return jsonify({'message': 'Shop suspension toggled', 'is_suspended': new_status})


@admin_bp.route('/shops/<int:shop_id>', methods=['DELETE'])
@jwt_required()
@require_admin
def delete_shop(shop_id):
    execute_db('DELETE FROM shops WHERE id=%s', (shop_id,))
    return jsonify({'message': 'Shop deleted'})


@admin_bp.route('/make-admin/<int:user_id>', methods=['POST'])
@jwt_required()
@require_admin
def make_admin(user_id):
    execute_db('UPDATE users SET role="admin" WHERE id=%s', (user_id,))
    return jsonify({'message': 'User promoted to admin'})
