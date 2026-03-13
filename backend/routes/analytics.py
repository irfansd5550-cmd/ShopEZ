"""Analytics routes — enhanced with trends, conversion, and product performance"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import query_db

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/shop/<int:shop_id>', methods=['GET'])
@jwt_required()
def get_analytics(shop_id):
    user_id = get_jwt_identity()
    shop = query_db('SELECT id FROM shops WHERE id=%s AND user_id=%s', (shop_id, user_id), one=True)
    if not shop:
        return jsonify({'error': 'Unauthorized'}), 403

    # Revenue & order summary
    revenue = query_db(
        '''SELECT
             COALESCE(SUM(total_amount),0)      AS total_revenue,
             COUNT(*)                            AS total_orders,
             COALESCE(AVG(total_amount),0)       AS avg_order,
             COUNT(DISTINCT customer_email)      AS unique_customers
           FROM orders WHERE shop_id=%s AND status!="cancelled"''',
        (shop_id,), one=True
    )

    # Monthly revenue — last 12 months
    monthly = query_db(
        '''SELECT DATE_FORMAT(created_at,'%%Y-%%m') AS month,
                  COALESCE(SUM(total_amount),0)      AS revenue,
                  COUNT(*)                            AS orders
           FROM orders
           WHERE shop_id=%s AND status!="cancelled"
             AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
           GROUP BY month ORDER BY month''',
        (shop_id,)
    )

    # Weekly revenue — last 8 weeks
    weekly = query_db(
        '''SELECT YEARWEEK(created_at,1) AS week_key,
                  MIN(DATE(created_at))  AS week_start,
                  COALESCE(SUM(total_amount),0) AS revenue,
                  COUNT(*) AS orders
           FROM orders
           WHERE shop_id=%s AND status!="cancelled"
             AND created_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
           GROUP BY week_key ORDER BY week_key''',
        (shop_id,)
    )

    # Best-selling products
    best_sellers = query_db(
        '''SELECT p.name, p.sales_count, p.price,
                  (p.sales_count * p.price) AS revenue,
                  p.stock_quantity
           FROM products p
           WHERE p.shop_id=%s AND p.is_active=1
           ORDER BY p.sales_count DESC LIMIT 8''',
        (shop_id,)
    )

    # Order status breakdown
    status_counts = query_db(
        'SELECT status, COUNT(*) AS count FROM orders WHERE shop_id=%s GROUP BY status',
        (shop_id,)
    )

    # Products & categories count
    products_count = query_db(
        'SELECT COUNT(*) AS cnt FROM products WHERE shop_id=%s AND is_active=1',
        (shop_id,), one=True
    )
    categories_count = query_db(
        'SELECT COUNT(*) AS cnt FROM categories WHERE shop_id=%s',
        (shop_id,), one=True
    )

    # Today's revenue
    today = query_db(
        '''SELECT COALESCE(SUM(total_amount),0) AS revenue, COUNT(*) AS orders
           FROM orders WHERE shop_id=%s AND DATE(created_at)=CURDATE()
             AND status!="cancelled"''',
        (shop_id,), one=True
    )

    # This month vs last month
    this_month = query_db(
        '''SELECT COALESCE(SUM(total_amount),0) AS revenue
           FROM orders WHERE shop_id=%s
             AND DATE_FORMAT(created_at,'%%Y-%%m')=DATE_FORMAT(NOW(),'%%Y-%%m')
             AND status!="cancelled"''',
        (shop_id,), one=True
    )
    last_month = query_db(
        '''SELECT COALESCE(SUM(total_amount),0) AS revenue
           FROM orders WHERE shop_id=%s
             AND DATE_FORMAT(created_at,'%%Y-%%m')=DATE_FORMAT(DATE_SUB(NOW(),INTERVAL 1 MONTH),'%%Y-%%m')
             AND status!="cancelled"''',
        (shop_id,), one=True
    )

    # Recent orders (last 5)
    recent_orders = query_db(
        '''SELECT order_number, customer_name, total_amount, status, created_at
           FROM orders WHERE shop_id=%s
           ORDER BY created_at DESC LIMIT 5''',
        (shop_id,)
    )

    # Low stock products
    low_stock = query_db(
        '''SELECT name, stock_quantity, price FROM products
           WHERE shop_id=%s AND is_active=1 AND stock_quantity < 10
           ORDER BY stock_quantity ASC LIMIT 5''',
        (shop_id,)
    )

    return jsonify({
        'revenue':          revenue,
        'monthly':          monthly,
        'weekly':           weekly,
        'best_sellers':     best_sellers,
        'status_counts':    status_counts,
        'products_count':   products_count['cnt'] if products_count else 0,
        'categories_count': categories_count['cnt'] if categories_count else 0,
        'today':            today,
        'this_month':       this_month,
        'last_month':       last_month,
        'recent_orders':    recent_orders,
        'low_stock':        low_stock,
    })
