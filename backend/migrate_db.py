#!/usr/bin/env python3
"""
Database migration script to add new fields to other_admissions table
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    # Get database URL
    database_url = os.getenv('DATABASE_URL') or os.getenv('SQLALCHEMY_DATABASE_URI')
    if not database_url:
        print("Error: DATABASE_URL environment variable is required")
        sys.exit(1)
    
    # Fix postgres:// to postgresql:// for SQLAlchemy
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    try:
        # Create engine
        engine = create_engine(database_url)
        
        # Read migration SQL
        with open('add_admission_fields.sql', 'r') as f:
            migration_sql = f.read()
        
        # Execute migration
        with engine.connect() as conn:
            # Check if columns already exist
            check_sql = """
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'other_admissions' 
            AND column_name IN ('fees_paid', 'course_total_fees', 'course_start_date', 'course_end_date', 'payment_mode')
            """
            
            result = conn.execute(text(check_sql))
            existing_columns = [row[0] for row in result]
            
            if len(existing_columns) > 0:
                print(f"Migration already applied. Found existing columns: {existing_columns}")
                return
            
            # Run migration
            conn.execute(text(migration_sql))
            conn.commit()
            print("Migration completed successfully!")
            print("Added new fields to other_admissions table:")
            print("- fees_paid (INTEGER)")
            print("- course_total_fees (INTEGER)")
            print("- course_start_date (TIMESTAMP)")
            print("- course_end_date (TIMESTAMP)")
            print("- payment_mode (VARCHAR(100))")
            
    except Exception as e:
        print(f"Migration failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()