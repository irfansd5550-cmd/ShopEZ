"""Orders routes"""

import secrets
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from utils.db import query_db, execute_db
from services.email_service import send_order_confirmation

orders_bp = Blueprint("orders", __name__)


def generate_order_number():
    """Generate unique order number"""
    return "ORD-" + secrets.token_hex(4).upper()


# --------------------------------------------------
# GET ORDERS FOR SHOP
# --------------------------------------------------

@orders_bp.route("/shop/<int:shop_id>", methods=["GET"])
@jwt_required()
def get_orders(shop_id):

    user_id = get_jwt_identity()

    shop = query_db(
        "SELECT id FROM shops WHERE id = %s AND user_id = %s",
        (shop_id, user_id),
        one=True,
    )

    if not shop:
        return jsonify({"error": "Unauthorized"}), 403

    status = request.args.get("status")
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))

    offset = (page - 1) * per_page

    conditions = ["shop_id = %s"]
    params = [shop_id]

    if status:
        conditions.append("status = %s")
        params.append(status)

    where = " AND ".join(conditions)

    orders = query_db(
        f"""
        SELECT * FROM orders
        WHERE {where}
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s
        """,
        params + [per_page, offset],
    )

    total = query_db(
        f"SELECT COUNT(*) AS cnt FROM orders WHERE {where}",
        params,
        one=True,
    )

    return jsonify(
        {
            "orders": orders,
            "total": total["cnt"] if total else 0,
        }
    )


# --------------------------------------------------
# GET SINGLE ORDER
# --------------------------------------------------

@orders_bp.route("/<int:order_id>", methods=["GET"])
@jwt_required()
def get_order(order_id):

    user_id = get_jwt_identity()

    order = query_db(
        """
        SELECT o.*, s.user_id AS shop_owner
        FROM orders o
        JOIN shops s ON o.shop_id = s.id
        WHERE o.id = %s
        """,
        (order_id,),
        one=True,
    )

    if not order:
        return jsonify({"error": "Order not found"}), 404

    if str(order["shop_owner"]) != str(user_id) and str(order.get("user_id", "")) != str(user_id):
        return jsonify({"error": "Unauthorized"}), 403

    items = query_db(
        "SELECT * FROM order_items WHERE order_id = %s",
        (order_id,),
    )

    return jsonify({"order": order, "items": items})


# --------------------------------------------------
# CREATE ORDER
# --------------------------------------------------

@orders_bp.route("", methods=["POST"])
def create_order():

    data = request.get_json()

    shop_id = data.get("shop_id")
    items = data.get("items", [])

    if not shop_id or not items:
        return jsonify({"error": "Shop ID and items are required"}), 400

    shop = query_db(
        "SELECT id FROM shops WHERE id = %s AND is_published = 1",
        (shop_id,),
        one=True,
    )

    if not shop:
        return jsonify({"error": "Shop not found"}), 404

    # detect logged user
    user_id = None

    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except Exception:
        pass

    order_number = generate_order_number()

    subtotal = 0
    validated_items = []

    # validate products
    for item in items:

        product = query_db(
            "SELECT * FROM products WHERE id = %s AND is_active = 1",
            (item["product_id"],),
            one=True,
        )

        if not product:
            continue

        quantity = int(item.get("quantity", 1))

        item_total = float(product["price"]) * quantity

        subtotal += item_total

        validated_items.append(
            {
                "product_id": product["id"],
                "product_name": product["name"],
                "product_price": product["price"],
                "quantity": quantity,
                "subtotal": item_total,
            }
        )

    shipping_fee = float(data.get("shipping_fee", 0))

    total = subtotal + shipping_fee

    # create order
    order_id = execute_db(
        """
        INSERT INTO orders
        (shop_id, user_id, order_number, customer_name, customer_email,
         customer_phone, shipping_address, city, state, postal_code, country,
         subtotal, shipping_fee, total_amount, payment_method)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """,
        (
            shop_id,
            user_id,
            order_number,
            data.get("customer_name"),
            data.get("customer_email"),
            data.get("customer_phone"),
            data.get("shipping_address"),
            data.get("city"),
            data.get("state"),
            data.get("postal_code"),
            data.get("country", "India"),
            subtotal,
            shipping_fee,
            total,
            data.get("payment_method", "COD"),
        ),
        return_id=True,
    )

    # insert order items
    for item in validated_items:

        execute_db(
            """
            INSERT INTO order_items
            (order_id, product_id, product_name, product_price, quantity, subtotal)
            VALUES (%s,%s,%s,%s,%s,%s)
            """,
            (
                order_id,
                item["product_id"],
                item["product_name"],
                item["product_price"],
                item["quantity"],
                item["subtotal"],
            ),
        )

        execute_db(
            "UPDATE products SET sales_count = sales_count + %s WHERE id = %s",
            (item["quantity"], item["product_id"]),
        )

    # clear cart
    if user_id:
        execute_db(
            "DELETE FROM cart WHERE user_id = %s AND shop_id = %s",
            (user_id, shop_id),
        )

    # send confirmation email
    try:
        send_order_confirmation(
            email=data.get("customer_email"),
            name=data.get("customer_name", ""),
            order_number=order_number,
            items=validated_items,
            total=total,
            store_name="Your Store",
        )
    except Exception:
        pass

    return jsonify(
        {
            "order_id": order_id,
            "order_number": order_number,
            "total": total,
        }
    ), 201


# --------------------------------------------------
# UPDATE ORDER STATUS
# --------------------------------------------------

@orders_bp.route("/<int:order_id>/status", methods=["PUT"])
@jwt_required()
def update_order_status(order_id):

    user_id = get_jwt_identity()

    order = query_db(
        """
        SELECT o.*, s.user_id AS shop_owner
        FROM orders o
        JOIN shops s ON o.shop_id = s.id
        WHERE o.id = %s
        """,
        (order_id,),
        one=True,
    )

    if not order or str(order["shop_owner"]) != str(user_id):
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()

    status = data.get("status")

    valid_statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]

    if status not in valid_statuses:
        return jsonify({"error": "Invalid status"}), 400

    execute_db(
        "UPDATE orders SET status = %s WHERE id = %s",
        (status, order_id),
    )

    return jsonify({"message": "Order status updated"})