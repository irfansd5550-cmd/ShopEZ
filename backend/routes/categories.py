"""Categories routes"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import query_db, execute_db

categories_bp = Blueprint('categories', __name__)


@categories_bp.route('/shop/<int:shop_id>', methods=['GET'])
def get_categories(shop_id):
    cats = query_db('SELECT * FROM categories WHERE shop_id = %s ORDER BY sort_order, name', (shop_id,))
    return jsonify({'categories': cats})


@categories_bp.route('', methods=['POST'])
@jwt_required()
def create_category():
    user_id = get_jwt_identity()
    data = request.get_json()
    shop_id = data.get('shop_id')

    shop = query_db('SELECT id FROM shops WHERE id = %s AND user_id = %s', (shop_id, user_id), one=True)
    if not shop:
        return jsonify({'error': 'Unauthorized'}), 403

    cat_id = execute_db(
        'INSERT INTO categories (shop_id, name, description, sort_order) VALUES (%s, %s, %s, %s)',
        (shop_id, data.get('name', ''), data.get('description', ''), data.get('sort_order', 0)),
        return_id=True
    )
    cat = query_db('SELECT * FROM categories WHERE id = %s', (cat_id,), one=True)
    return jsonify({'category': cat}), 201


@categories_bp.route('/<int:cat_id>', methods=['PUT'])
@jwt_required()
def update_category(cat_id):
    user_id = get_jwt_identity()
    cat = query_db('SELECT c.*, s.user_id FROM categories c JOIN shops s ON c.shop_id = s.id WHERE c.id = %s', (cat_id,), one=True)
    if not cat or str(cat['user_id']) != str(user_id):
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    execute_db('UPDATE categories SET name = %s, description = %s WHERE id = %s',
               (data.get('name', cat['name']), data.get('description', cat.get('description', '')), cat_id))
    return jsonify({'message': 'Category updated'})


@categories_bp.route('/<int:cat_id>', methods=['DELETE'])
@jwt_required()
def delete_category(cat_id):
    user_id = get_jwt_identity()
    cat = query_db('SELECT c.*, s.user_id FROM categories c JOIN shops s ON c.shop_id = s.id WHERE c.id = %s', (cat_id,), one=True)
    if not cat or str(cat['user_id']) != str(user_id):
        return jsonify({'error': 'Unauthorized'}), 403

    execute_db('DELETE FROM categories WHERE id = %s', (cat_id,))
    return jsonify({'message': 'Category deleted'})
