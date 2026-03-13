"""
ShopEZ Flask Application Factory
"""

import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

load_dotenv()

mail = Mail()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address)


def create_app():
    app = Flask(__name__)

    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'shopez-secret-key-2024')
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'shopez-jwt-secret-2024')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 86400))

    # Database
    app.config['DB_HOST'] = os.environ.get('DB_HOST', 'localhost')
    app.config['DB_PORT'] = int(os.environ.get('DB_PORT', 3306))
    app.config['DB_USER'] = os.environ.get('DB_USER', 'root')
    app.config['DB_PASSWORD'] = os.environ.get('DB_PASSWORD', '')
    app.config['DB_NAME'] = os.environ.get('DB_NAME', 'shopez')

    # Mail
    app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', '')
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', '')
    app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', 'ShopEZ <noreply@shopez.com>')

    # File uploads
    app.config['MAX_CONTENT_LENGTH'] = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Frontend URL
    app.config['FRONTEND_URL'] = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

    # Initialize extensions
    CORS(app, origins=[app.config['FRONTEND_URL'], 'http://localhost:5173', 'http://localhost:3000'],
         supports_credentials=True)
    jwt.init_app(app)
    mail.init_app(app)
    limiter.init_app(app)

    # Register blueprints
    from routes.auth import auth_bp
    from routes.shops import shops_bp
    from routes.products import products_bp
    from routes.categories import categories_bp
    from routes.cart import cart_bp
    from routes.orders import orders_bp
    from routes.analytics import analytics_bp
    from routes.admin import admin_bp
    from routes.ai import ai_bp
    from routes.builder import builder_bp
    from routes.upload import upload_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(shops_bp, url_prefix='/api/shops')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(categories_bp, url_prefix='/api/categories')
    app.register_blueprint(cart_bp, url_prefix='/api/cart')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(builder_bp, url_prefix='/api/builder')
    app.register_blueprint(upload_bp, url_prefix='/api/upload')

    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'message': 'ShopEZ API running'}

    return app
