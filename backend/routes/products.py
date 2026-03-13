"""Products routes"""

import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import query_db, execute_db

products_bp = Blueprint('products', __name__)


def check_shop_owner(shop_id, user_id):
    return query_db(
        'SELECT id FROM shops WHERE id = %s AND user_id = %s',
        (shop_id, user_id),
        one=True
    )


@products_bp.route('/shop/<int:shop_id>', methods=['GET'])
def get_products(shop_id):

    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    category_id = request.args.get('category_id')
    search = request.args.get('search', '').strip()

    offset = (page - 1) * per_page

    conditions = ['p.shop_id = %s', 'p.is_active = 1']
    params = [shop_id]

    if category_id:
        conditions.append('p.category_id = %s')
        params.append(category_id)

    if search:
        conditions.append('(p.name LIKE %s OR p.description LIKE %s)')
        params.extend([f'%{search}%', f'%{search}%'])

    where = ' AND '.join(conditions)

    products = query_db(
        f'''SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE {where}
            ORDER BY p.is_featured DESC, p.created_at DESC
            LIMIT %s OFFSET %s''',
        params + [per_page, offset]
    )

    total = query_db(
        f'SELECT COUNT(*) as cnt FROM products p WHERE {where}',
        params,
        one=True
    )

    return jsonify({
        'products': products,
        'total': total['cnt'] if total else 0,
        'page': page,
        'per_page': per_page
    })


@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):

    product = query_db(
        'SELECT * FROM products WHERE id = %s AND is_active = 1',
        (product_id,),
        one=True
    )

    if not product:
        return jsonify({'error': 'Product not found'}), 404

    execute_db(
        'UPDATE products SET views_count = views_count + 1 WHERE id = %s',
        (product_id,)
    )

    return jsonify({'product': product})


@products_bp.route('', methods=['POST'])
@jwt_required()
def create_product():

    user_id = get_jwt_identity()
    data = request.get_json()

    shop_id = data.get('shop_id')

    if not check_shop_owner(shop_id, user_id):
        return jsonify({'error': 'Unauthorized'}), 403

    name = data.get('name', '').strip()

    if not name:
        return jsonify({'error': 'Product name is required'}), 400

    # -------------------------------
    # FIX CATEGORY FOREIGN KEY ERROR
    # -------------------------------

    category_id = data.get('category_id')

    if not category_id:
        category_id = None
    else:
        # check if category exists
        category = query_db(
            'SELECT id FROM categories WHERE id = %s',
            (category_id,),
            one=True
        )

        if not category:
            category_id = None

    images = json.dumps(data.get('images', []))

    product_id = execute_db(
        '''INSERT INTO products
        (shop_id, category_id, name, description, price, compare_price,
         sku, stock_quantity, images, is_featured)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
        (
            shop_id,
            category_id,
            name,
            data.get('description', ''),
            data.get('price', 0),
            data.get('compare_price'),
            data.get('sku', ''),
            data.get('stock_quantity', 0),
            images,
            int(data.get('is_featured', False))
        ),
        return_id=True
    )

    product = query_db(
        'SELECT * FROM products WHERE id = %s',
        (product_id,),
        one=True
    )

    return jsonify({
        'product': product,
        'message': 'Product created'
    }), 201


@products_bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):

    user_id = get_jwt_identity()

    product = query_db(
        '''SELECT p.*, s.user_id
           FROM products p
           JOIN shops s ON p.shop_id = s.id
           WHERE p.id = %s''',
        (product_id,),
        one=True
    )

    if not product or str(product['user_id']) != str(user_id):
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    fields_map = {
        'name': '%s',
        'description': '%s',
        'price': '%s',
        'compare_price': '%s',
        'sku': '%s',
        'stock_quantity': '%s',
        'category_id': '%s',
        'is_active': '%s',
        'is_featured': '%s'
    }

    updates = []
    values = []

    for field in fields_map:

        if field in data:

            if field == "category_id" and not data[field]:
                updates.append('category_id = NULL')
            else:
                updates.append(f'{field} = %s')
                values.append(data[field])

    if 'images' in data:
        updates.append('images = %s')
        values.append(json.dumps(data['images']))

    if updates:
        values.append(product_id)

        execute_db(
            f'UPDATE products SET {", ".join(updates)} WHERE id = %s',
            values
        )

    updated = query_db(
        'SELECT * FROM products WHERE id = %s',
        (product_id,),
        one=True
    )

    return jsonify({'product': updated})


@products_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):

    user_id = get_jwt_identity()

    product = query_db(
        '''SELECT p.*, s.user_id
           FROM products p
           JOIN shops s ON p.shop_id = s.id
           WHERE p.id = %s''',
        (product_id,),
        one=True
    )

    if not product or str(product['user_id']) != str(user_id):
        return jsonify({'error': 'Unauthorized'}), 403

    execute_db(
        'DELETE FROM products WHERE id = %s',
        (product_id,)
    )

    return jsonify({'message': 'Product deleted'})