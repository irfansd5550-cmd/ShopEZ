"""Database connection utility for ShopEZ"""

import pymysql
import os
from flask import current_app, g


def get_db():
    """Get database connection, creating one if needed."""
    if 'db' not in g:
        g.db = pymysql.connect(
            host=current_app.config['DB_HOST'],
            port=current_app.config['DB_PORT'],
            user=current_app.config['DB_USER'],
            password=current_app.config['DB_PASSWORD'],
            database=current_app.config['DB_NAME'],
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False
        )
    return g.db


def close_db(e=None):
    """Close database connection."""
    db = g.pop('db', None)
    if db is not None:
        db.close()


def query_db(query, args=(), one=False, commit=False):
    """Execute a database query and return results."""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute(query, args)
            if commit:
                db.commit()
                return cursor.lastrowid
            rv = cursor.fetchall()
            return (rv[0] if rv else None) if one else rv
    except Exception as e:
        if commit:
            db.rollback()
        raise e


def execute_db(query, args=(), return_id=False):
    """Execute a write query."""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute(query, args)
            db.commit()
            if return_id:
                return cursor.lastrowid
            return cursor.rowcount
    except Exception as e:
        db.rollback()
        raise e
