#!/usr/bin/env python3
"""
Database verification script
Checks if all required columns exist
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app import app, db
from sqlalchemy import text

def verify_database():
    """Verify database schema"""
    with app.app_context():
        print("=" * 70)
        print("🔍 DATABASE SCHEMA VERIFICATION")
        print("=" * 70)
        
        print(f"\n📊 Database: {app.config['SQLALCHEMY_DATABASE_URI'][:50]}...")
        
        # Check records table
        print("\n📋 Checking 'records' table schema...")
        
        try:
            result = db.session.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name='records'
                ORDER BY ordinal_position
            """))
            
            columns = {}
            print("\n  Columns found:")
            for row in result:
                columns[row[0]] = row[1]
                nullable = "NULL" if row[2] == 'YES' else "NOT NULL"
                default = f"DEFAULT {row[3]}" if row[3] else ""
                print(f"    ✓ {row[0]:<25} {row[1]:<15} {nullable:<10} {default}")
            
            # Check required columns
            print("\n🔍 Checking required columns...")
            required_columns = {
                'id': 'integer',
                'caller_id': 'integer',
                'phone_number': 'character varying',
                'name': 'character varying',
                'response': 'text',
                'notes': 'text',
                'visit': 'USER-DEFINED',  # ENUM type
                'visit_by': 'integer',
                'hidden_from_caller': 'boolean',
                'assigned_at': 'timestamp without time zone',
                'updated_at': 'timestamp without time zone'
            }
            
            all_good = True
            for col_name, expected_type in required_columns.items():
                if col_name in columns:
                    actual_type = columns[col_name]
                    if expected_type == 'USER-DEFINED' or expected_type in actual_type or actual_type in expected_type:
                        print(f"    ✅ {col_name:<25} OK")
                    else:
                        print(f"    ⚠️  {col_name:<25} Type mismatch: expected {expected_type}, got {actual_type}")
                else:
                    print(f"    ❌ {col_name:<25} MISSING!")
                    all_good = False
            
            if all_good:
                print("\n" + "=" * 70)
                print("✅ DATABASE SCHEMA IS CORRECT!")
                print("=" * 70)
                return True
            else:
                print("\n" + "=" * 70)
                print("❌ DATABASE SCHEMA HAS ISSUES!")
                print("=" * 70)
                print("\n💡 Run migration: python run_migration.py")
                return False
                
        except Exception as e:
            print(f"\n❌ Error checking database: {e}")
            import traceback
            print(traceback.format_exc())
            return False

if __name__ == '__main__':
    success = verify_database()
    sys.exit(0 if success else 1)
