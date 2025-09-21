from app import app, db
from sqlalchemy import text

app.app_context().push()

try:
    with db.engine.connect() as conn:
        # Add columns one by one with error handling
        columns = [
            "ALTER TABLE other_admissions ADD COLUMN fees_paid INTEGER",
            "ALTER TABLE other_admissions ADD COLUMN course_total_fees INTEGER", 
            "ALTER TABLE other_admissions ADD COLUMN course_start_date TIMESTAMP",
            "ALTER TABLE other_admissions ADD COLUMN course_end_date TIMESTAMP",
            "ALTER TABLE other_admissions ADD COLUMN payment_mode VARCHAR(100)"
        ]
        
        for sql in columns:
            try:
                conn.execute(text(sql))
                print(f"✓ Added: {sql.split('ADD COLUMN ')[1]}")
            except Exception as e:
                if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                    print(f"✓ Already exists: {sql.split('ADD COLUMN ')[1]}")
                else:
                    print(f"✗ Error: {e}")
        
        conn.commit()
        print("\n✅ Database migration completed!")
        
except Exception as e:
    print(f"❌ Migration failed: {e}")