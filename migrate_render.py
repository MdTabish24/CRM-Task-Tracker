#!/usr/bin/env python3
"""
Simple migration script for Render/Production
Adds hidden_from_caller column to records table
"""
import os
import sys

# Set path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

print("=" * 70)
print("🚀 RENDER MIGRATION: Adding hidden_from_caller column")
print("=" * 70)

# Get database URL
database_url = os.getenv('DATABASE_URL') or os.getenv('SQLALCHEMY_DATABASE_URI')

if not database_url:
    print("❌ ERROR: DATABASE_URL not found!")
    sys.exit(1)

print(f"\n📊 Database: {database_url[:50]}...")

# Import after setting path
from app import app, db
from sqlalchemy import text

def run_migration():
    """Add hidden_from_caller column"""
    with app.app_context():
        try:
            print("\n🔍 Checking if column exists...")
            
            # Check if column exists
            result = db.session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='records' AND column_name='hidden_from_caller'
            """))
            
            if result.fetchone():
                print("✅ Column 'hidden_from_caller' already exists!")
                print("✅ No migration needed")
                return True
            
            print("\n📝 Adding 'hidden_from_caller' column...")
            
            # Add column
            db.session.execute(text("""
                ALTER TABLE records 
                ADD COLUMN hidden_from_caller BOOLEAN DEFAULT FALSE NOT NULL
            """))
            
            db.session.commit()
            
            print("✅ Column added successfully!")
            
            # Verify
            result = db.session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='records' AND column_name='hidden_from_caller'
            """))
            
            if result.fetchone():
                print("✅ Verified: Column exists in database")
                return True
            else:
                print("❌ ERROR: Column not found after adding!")
                return False
                
        except Exception as e:
            print(f"\n❌ Migration failed: {e}")
            print(f"❌ Error type: {type(e).__name__}")
            db.session.rollback()
            
            # Try to get more details
            import traceback
            print(f"\n❌ Full error:\n{traceback.format_exc()}")
            return False

if __name__ == '__main__':
    print("\n" + "=" * 70)
    success = run_migration()
    print("=" * 70)
    
    if success:
        print("\n✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("🔄 Server will restart automatically")
        sys.exit(0)
    else:
        print("\n❌ MIGRATION FAILED!")
        print("Please check the error messages above")
        sys.exit(1)
