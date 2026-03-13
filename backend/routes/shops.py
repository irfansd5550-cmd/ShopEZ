"""Shop management routes"""

import secrets
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import query_db, execute_db
from utils.helpers import generate_slug

shops_bp = Blueprint('shops', __name__)


@shops_bp.route('', methods=['GET'])
@jwt_required()
def get_my_shops():
    user_id = get_jwt_identity()
    shops = query_db(
        'SELECT * FROM shops WHERE user_id = %s ORDER BY created_at DESC',
        (user_id,)
    )
    return jsonify({'shops': shops})


@shops_bp.route('', methods=['POST'])
@jwt_required()
def create_shop():
    user_id = get_jwt_identity()
    data = request.get_json()

    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    category = data.get('category', '').strip()
    whatsapp = data.get('whatsapp_number', '').strip()
    instagram = data.get('instagram_url', '').strip()

    if not name:
        return jsonify({'error': 'Store name is required'}), 400

    base_slug = generate_slug(name)
    slug = base_slug
    counter = 1
    while query_db('SELECT id FROM shops WHERE slug = %s', (slug,), one=True):
        slug = f'{base_slug}-{counter}'
        counter += 1

    shop_id = execute_db(
        '''INSERT INTO shops (user_id, name, slug, description, category, whatsapp_number, instagram_url)
           VALUES (%s, %s, %s, %s, %s, %s, %s)''',
        (user_id, name, slug, description, category, whatsapp, instagram),
        return_id=True
    )

    shop = query_db('SELECT * FROM shops WHERE id = %s', (shop_id,), one=True)
    return jsonify({'shop': shop, 'message': 'Store created successfully'}), 201


@shops_bp.route('/<int:shop_id>', methods=['GET'])
@jwt_required()
def get_shop(shop_id):
    user_id = get_jwt_identity()
    shop = query_db('SELECT * FROM shops WHERE id = %s AND user_id = %s', (shop_id, user_id), one=True)
    if not shop:
        return jsonify({'error': 'Shop not found'}), 404
    return jsonify({'shop': shop})


@shops_bp.route('/public/<slug>', methods=['GET'])
def get_public_shop(slug):
    shop = query_db('SELECT * FROM shops WHERE slug = %s AND is_published = 1 AND is_suspended = 0', (slug,), one=True)
    if not shop:
        return jsonify({'error': 'Shop not found'}), 404

    products = query_db(
        'SELECT * FROM products WHERE shop_id = %s AND is_active = 1 ORDER BY is_featured DESC, created_at DESC',
        (shop['id'],)
    )
    categories = query_db('SELECT * FROM categories WHERE shop_id = %s ORDER BY sort_order', (shop['id'],))

    return jsonify({'shop': shop, 'products': products, 'categories': categories})


@shops_bp.route('/<int:shop_id>', methods=['PUT'])
@jwt_required()
def update_shop(shop_id):
    user_id = get_jwt_identity()
    shop = query_db('SELECT id FROM shops WHERE id = %s AND user_id = %s', (shop_id, user_id), one=True)
    if not shop:
        return jsonify({'error': 'Shop not found'}), 404

    data = request.get_json()
    fields = ['name', 'description', 'category', 'whatsapp_number', 'instagram_url',
              'theme_color', 'secondary_color', 'font_family', 'layout_style', 'template_id',
              'logo_url', 'banner_url']

    updates = []
    values = []
    for field in fields:
        if field in data:
            updates.append(f'{field} = %s')
            values.append(data[field])

    if updates:
        values.append(shop_id)
        execute_db(f'UPDATE shops SET {", ".join(updates)} WHERE id = %s', values)

    updated = query_db('SELECT * FROM shops WHERE id = %s', (shop_id,), one=True)
    return jsonify({'shop': updated, 'message': 'Shop updated'})


@shops_bp.route('/<int:shop_id>/publish', methods=['POST'])
@jwt_required()
def publish_shop(shop_id):
    user_id = get_jwt_identity()
    shop = query_db('SELECT * FROM shops WHERE id = %s AND user_id = %s', (shop_id, user_id), one=True)
    if not shop:
        return jsonify({'error': 'Shop not found'}), 404

    execute_db('UPDATE shops SET is_published = 1 WHERE id = %s', (shop_id,))
    return jsonify({'message': 'Shop published successfully', 'url': f'/store/{shop["slug"]}'})


@shops_bp.route('/<int:shop_id>/unpublish', methods=['POST'])
@jwt_required()
def unpublish_shop(shop_id):
    user_id = get_jwt_identity()
    shop = query_db('SELECT id FROM shops WHERE id = %s AND user_id = %s', (shop_id, user_id), one=True)
    if not shop:
        return jsonify({'error': 'Shop not found'}), 404

    execute_db('UPDATE shops SET is_published = 0 WHERE id = %s', (shop_id,))
    return jsonify({'message': 'Shop unpublished'})


@shops_bp.route('/<int:shop_id>', methods=['DELETE'])
@jwt_required()
def delete_shop(shop_id):
    user_id = get_jwt_identity()
    shop = query_db('SELECT id FROM shops WHERE id = %s AND user_id = %s', (shop_id, user_id), one=True)
    if not shop:
        return jsonify({'error': 'Shop not found'}), 404

    execute_db('DELETE FROM shops WHERE id = %s', (shop_id,))
    return jsonify({'message': 'Shop deleted'})
