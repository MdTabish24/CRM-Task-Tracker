#!/usr/bin/env python3
"""
Database initialization script for CRM system
"""

from app import app, db, User
from werkzeug.security import generate_password_hash
import sys

def init_database():
    """Initialize database with tables and seed data"""
    try:
        with app.app_context():
            print("🗄️ Creating database tables...")
            db.create_all()
            
            # Check if admin already exists
            if User.query.filter_by(username='admin').first():
                print("✅ Database already initialized!")
                return True
            
            print("👤 Creating default users...")
            
            # Create admin user
            admin = User(
                name='System Administrator',
                username='admin',
                password_hash=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin)
            
            # Create caller users
            callers = [
                {'name': 'John Caller', 'username': 'caller1'},
                {'name': 'Jane Caller', 'username': 'caller2'},
                {'name': 'Bob Caller', 'username': 'caller3'}
            ]
            
            for caller_data in callers:
                caller = User(
                    name=caller_data['name'],
                    username=caller_data['username'],
                    password_hash=generate_password_hash('caller123'),
                    role='caller'
                )
                db.session.add(caller)
            
            db.session.commit()
            
            print("✅ Database initialized successfully!")
            print("📋 Default accounts created:")
            print("   Admin: username='admin', password='admin123'")
            print("   Callers: username='caller1/caller2/caller3', password='caller123'")
            return True
            
    except Exception as e:
        print(f"❌ Error initializing database: {str(e)}")
        return False

def test_connection():
    """Test database connection"""
    try:
        with app.app_context():
            # Try to execute a simple query
            from sqlalchemy import text
            result = db.session.execute(text('SELECT 1'))
            result.close()
            print("✅ Database connection successful!")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        print("💡 Make sure MySQL is running and credentials are correct")
        return False

if __name__ == '__main__':
    print("🚀 CRM Database Initialization")
    print("=" * 40)
    
    # Test connection first
    if not test_connection():
        sys.exit(1)
    
    # Initialize database
    if init_database():
        print("\n🎉 Setup complete! You can now start the Flask app.")
    else:
        sys.exit(1)