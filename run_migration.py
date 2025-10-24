#!/usr/bin/env python3
"""
Main migration runner script
Runs all pending migrations in order
"""
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

def main():
    print("=" * 70)
    print("🚀 CRM DATABASE MIGRATION RUNNER")
    print("=" * 70)
    
    # Check if DATABASE_URL is set
    database_url = os.getenv('DATABASE_URL') or os.getenv('SQLALCHEMY_DATABASE_URI')
    if not database_url:
        print("\n❌ ERROR: No database URL found!")
        print("Please set DATABASE_URL or SQLALCHEMY_DATABASE_URI environment variable")
        print("\nFor local development, you can run:")
        print("  export DATABASE_URL='your_database_url'")
        print("  python run_migration.py")
        sys.exit(1)
    
    print(f"\n📊 Database: {database_url[:50]}...")
    
    # List of migration scripts to run
    migrations = [
        'backend/add_hidden_from_caller_field.py'
    ]
    
    print(f"\n📋 Found {len(migrations)} migration(s) to run\n")
    
    for i, migration_file in enumerate(migrations, 1):
        print(f"\n{'=' * 70}")
        print(f"Running migration {i}/{len(migrations)}: {migration_file}")
        print('=' * 70)
        
        if not os.path.exists(migration_file):
            print(f"❌ Migration file not found: {migration_file}")
            continue
        
        try:
            # Run the migration
            with open(migration_file, encoding='utf-8') as f:
                code = compile(f.read(), migration_file, 'exec')
                exec(code)
            print(f"\n✅ Migration {i} completed successfully")
        except Exception as e:
            print(f"\n❌ Migration {i} failed: {e}")
            import traceback
            print(traceback.format_exc())
            print("\n⚠️  Stopping migration process due to error")
            sys.exit(1)
    
    print("\n" + "=" * 70)
    print("✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY!")
    print("=" * 70)
    print("\n🔄 Please restart your application server now")
    print("=" * 70)

if __name__ == '__main__':
    main()
