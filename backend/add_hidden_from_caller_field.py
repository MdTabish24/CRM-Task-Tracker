"""
Migration script to add hidden_from_caller field to records table
"""
import os
import sys

# Add parent directory to path to import app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from sqlalchemy import text

def add_hidden_from_caller_field():
    """Add hidden_from_caller column to records table"""
    with app.app_context():
        try:
            # Check if column already exists
            result = db.session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='records' AND column_name='hidden_from_caller'
            """))
            
            if result.fetchone():
                print("✅ Column 'hidden_from_caller' already exists")
                return
            
            # Add the column
            print("📝 Adding 'hidden_from_caller' column to records table...")
            db.session.execute(text("""
                ALTER TABLE records 
                ADD COLUMN hidden_from_caller BOOLEAN DEFAULT FALSE
            """))
            
            db.session.commit()
            print("✅ Successfully added 'hidden_from_caller' column")
            
        except Exception as e:
            print(f"❌ Error adding column: {e}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    print("🚀 Starting migration to add hidden_from_caller field...")
    add_hidden_from_caller_field()
    print("✅ Migration completed!")
