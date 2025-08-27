#!/usr/bin/env python3
"""Initialize database and create tables"""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app import app, db, User
from werkzeug.security import generate_password_hash

def init_database():
    """Initialize database with tables and default users"""
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Check if admin user exists
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            # Create admin user
            admin = User(
                name='Administrator',
                username='admin',
                password_hash=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin)
            
            # Create caller users
            for i in range(1, 4):
                caller = User(
                    name=f'Caller {i}',
                    username=f'caller{i}',
                    password_hash=generate_password_hash('caller123'),
                    role='caller'
                )
                db.session.add(caller)
            
            db.session.commit()
            print("✅ Database initialized with default users")
        else:
            print("✅ Database already initialized")

if __name__ == '__main__':
    init_database()