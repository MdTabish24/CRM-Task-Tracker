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
            print("🔍 Checking database connection...")
            print(f"📊 Database URL: {app.config['SQLALCHEMY_DATABASE_URI'][:50]}...")
            
            # First, list all columns in records table
            print("\n📋 Current columns in 'records' table:")
            result = db.session.execute(text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name='records'
                ORDER BY ordinal_position
            """))
            
            columns = []
            for row in result:
                columns.append(row[0])
                print(f"  - {row[0]}: {row[1]} (nullable: {row[2]})")
            
            # Check if column already exists
            if 'hidden_from_caller' in columns:
                print("\n✅ Column 'hidden_from_caller' already exists!")
                return
            
            # Add the column
            print("\n📝 Adding 'hidden_from_caller' column to records table...")
            db.session.execute(text("""
                ALTER TABLE records 
                ADD COLUMN hidden_from_caller BOOLEAN DEFAULT FALSE NOT NULL
            """))
            
            db.session.commit()
            print("✅ Successfully added 'hidden_from_caller' column")
            
            # Verify the column was added
            print("\n🔍 Verifying column was added...")
            result = db.session.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name='records' AND column_name='hidden_from_caller'
            """))
            
            row = result.fetchone()
            if row:
                print(f"✅ Verified: {row[0]} ({row[1]}) exists in database")
            else:
                print("❌ Warning: Column not found after adding!")
            
        except Exception as e:
            print(f"\n❌ Error during migration: {e}")
            print(f"❌ Error type: {type(e).__name__}")
            import traceback
            print(f"❌ Full traceback:\n{traceback.format_exc()}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 MIGRATION: Add hidden_from_caller field to records table")
    print("=" * 60)
    add_hidden_from_caller_field()
    print("\n" + "=" * 60)
    print("✅ Migration completed successfully!")
    print("=" * 60)
