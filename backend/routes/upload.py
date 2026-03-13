"""File upload routes"""

import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
from utils.helpers import allowed_file

upload_bp = Blueprint('upload', __name__)


@upload_bp.route('/image', methods=['POST'])
@jwt_required()
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed. Use: PNG, JPG, JPEG, GIF, WEBP'}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f'{uuid.uuid4().hex}.{ext}'
    upload_dir = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    # Return URL
    base_url = request.host_url.rstrip('/')
    url = f'{base_url}/api/upload/files/{filename}'

    return jsonify({'url': url, 'filename': filename})


@upload_bp.route('/files/<filename>', methods=['GET'])
def get_file(filename):
    upload_dir = current_app.config['UPLOAD_FOLDER']
    return send_from_directory(upload_dir, secure_filename(filename))
