"""Cart routes"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import query_db, execute_db

cart_bp = Blueprint('cart', __name__)


@cart_bp.route('/<int:shop_id>', methods=['GET'])
@jwt_required()
def get_cart(shop_id):
    user_id = get_jwt_identity()
    items = query_db(
        '''SELECT c.*, p.name, p.price, p.images, p.stock_quantity
           FROM cart c JOIN products p ON c.product_id = p.id
           WHERE c.user_id = %s AND c.shop_id = %s''',
        (user_id, shop_id)
    )
    total = sum(float(item['price']) * item['quantity'] for item in items)
    return jsonify({'items': items, 'total': round(total, 2)})


@cart_bp.route('/add', methods=['POST'])
@jwt_required()
def add_to_cart():
    user_id = get_jwt_identity()
    data = request.get_json()
    product_id = data.get('product_id')
    shop_id = data.get('shop_id')
    quantity = int(data.get('quantity', 1))

    product = query_db('SELECT id, stock_quantity FROM products WHERE id = %s AND is_active = 1', (product_id,), one=True)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    existing = query_db('SELECT id, quantity FROM cart WHERE user_id = %s AND product_id = %s', (user_id, product_id), one=True)
    if existing:
        new_qty = existing['quantity'] + quantity
        execute_db('UPDATE cart SET quantity = %s WHERE id = %s', (new_qty, existing['id']))
    else:
        execute_db('INSERT INTO cart (user_id, shop_id, product_id, quantity) VALUES (%s, %s, %s, %s)',
                   (user_id, shop_id, product_id, quantity))

    return jsonify({'message': 'Added to cart'})


@cart_bp.route('/update/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_cart(item_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    quantity = int(data.get('quantity', 1))

    item = query_db('SELECT id FROM cart WHERE id = %s AND user_id = %s', (item_id, user_id), one=True)
    if not item:
        return jsonify({'error': 'Cart item not found'}), 404

    if quantity <= 0:
        execute_db('DELETE FROM cart WHERE id = %s', (item_id,))
        return jsonify({'message': 'Item removed'})

    execute_db('UPDATE cart SET quantity = %s WHERE id = %s', (quantity, item_id))
    return jsonify({'message': 'Cart updated'})


@cart_bp.route('/remove/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(item_id):
    user_id = get_jwt_identity()
    execute_db('DELETE FROM cart WHERE id = %s AND user_id = %s', (item_id, user_id))
    return jsonify({'message': 'Item removed'})


@cart_bp.route('/clear/<int:shop_id>', methods=['DELETE'])
@jwt_required()
def clear_cart(shop_id):
    user_id = get_jwt_identity()
    execute_db('DELETE FROM cart WHERE user_id = %s AND shop_id = %s', (user_id, shop_id))
    return jsonify({'message': 'Cart cleared'})
