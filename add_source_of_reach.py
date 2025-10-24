#!/usr/bin/env python3
"""
Add source_of_reach column to other_admissions table
"""
import os
import sys

# Load environment
sys.path.insert(0, 'backend')
from dotenv import load_dotenv
load_dotenv('backend/.env')

from app import app, db
from sqlalchemy import text

print("=" * 70)
print("🔧 ADDING source_of_reach COLUMN")
print("=" * 70)

with app.app_context():
    try:
        db_url = app.config['SQLALCHEMY_DATABASE_URI']
        print(f"\n📊 Database: {db_url[:50]}...")
        
        # Check if column exists
        print("\n🔍 Checking if column exists...")
        
        if 'mysql' in db_url.lower():
            # MySQL
            result = db.session.execute(text("DESCRIBE other_admissions"))
            columns = [row[0] for row in result]
            
            if 'source_of_reach' in columns:
                print("✅ Column 'source_of_reach' already exists!")
            else:
                print("\n📝 Adding 'source_of_reach' column to MySQL...")
                db.session.execute(text("""
                    ALTER TABLE other_admissions 
                    ADD COLUMN source_of_reach VARCHAR(200)
                """))
                db.session.commit()
                print("✅ Column added successfully!")
        else:
            # PostgreSQL
            result = db.session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='other_admissions'
            """))
            columns = [row[0] for row in result]
            
            if 'source_of_reach' in columns:
                print("✅ Column 'source_of_reach' already exists!")
            else:
                print("\n📝 Adding 'source_of_reach' column to PostgreSQL...")
                db.session.execute(text("""
                    ALTER TABLE other_admissions 
                    ADD COLUMN source_of_reach VARCHAR(200)
                """))
                db.session.commit()
                print("✅ Column added successfully!")
        
        # Verify
        print("\n🔍 Verifying...")
        if 'mysql' in db_url.lower():
            result = db.session.execute(text("DESCRIBE other_admissions"))
            columns = [row[0] for row in result]
        else:
            result = db.session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='other_admissions'
            """))
            columns = [row[0] for row in result]
        
        if 'source_of_reach' in columns:
            print("✅ VERIFIED: Column exists!")
            print("\n" + "=" * 70)
            print("✅ MIGRATION SUCCESSFUL!")
            print("=" * 70)
        else:
            print("❌ ERROR: Column not found after adding!")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        print(traceback.format_exc())
        db.session.rollback()
