"""
Migration script to add reminder and reminder_queue tables
"""
from app import app, db
from sqlalchemy import text

def add_reminder_tables():
    with app.app_context():
        try:
            # Create reminders table
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS reminders (
                    id SERIAL PRIMARY KEY,
                    record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
                    caller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    scheduled_datetime TIMESTAMP NOT NULL,
                    reminder_17h_triggered BOOLEAN DEFAULT FALSE,
                    reminder_exact_triggered BOOLEAN DEFAULT FALSE,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Create reminder_queue table
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS reminder_queue (
                    id SERIAL PRIMARY KEY,
                    reminder_id INTEGER NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
                    caller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    trigger_type VARCHAR(20) NOT NULL CHECK (trigger_type IN ('17h_before', 'exact_time')),
                    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_dismissed BOOLEAN DEFAULT FALSE
                )
            """))
            
            # Create indexes for better performance
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_reminders_caller_id ON reminders(caller_id)
            """))
            
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_datetime ON reminders(scheduled_datetime)
            """))
            
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_reminder_queue_caller_id ON reminder_queue(caller_id)
            """))
            
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_reminder_queue_is_dismissed ON reminder_queue(is_dismissed)
            """))
            
            db.session.commit()
            print("✅ Reminder tables created successfully!")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating reminder tables: {str(e)}")
            raise

if __name__ == '__main__':
    add_reminder_tables()
