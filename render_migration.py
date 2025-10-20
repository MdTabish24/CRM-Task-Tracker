#!/usr/bin/env python3
"""
Render deployment migration script
Run this on render to create reminder tables
"""
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app import app, db
from sqlalchemy import text

def migrate_on_render():
    """Create reminder tables on render"""
    with app.app_context():
        try:
            print("🚀 Starting Render migration...")
            
            # Create reminders table
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS reminders (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    record_id INT NOT NULL,
                    caller_id INT NOT NULL,
                    scheduled_datetime DATETIME NOT NULL,
                    reminder_17h_triggered BOOLEAN DEFAULT FALSE,
                    reminder_exact_triggered BOOLEAN DEFAULT FALSE,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
                    FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """))
            
            # Create reminder_queue table
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS reminder_queue (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    reminder_id INT NOT NULL,
                    caller_id INT NOT NULL,
                    trigger_type ENUM('17h_before', 'exact_time') NOT NULL,
                    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_dismissed BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE,
                    FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """))
            
            # Create indexes
            try:
                db.session.execute(text("CREATE INDEX idx_reminders_caller_id ON reminders(caller_id)"))
            except:
                pass
            
            try:
                db.session.execute(text("CREATE INDEX idx_reminders_scheduled_datetime ON reminders(scheduled_datetime)"))
            except:
                pass
            
            try:
                db.session.execute(text("CREATE INDEX idx_reminder_queue_caller_id ON reminder_queue(caller_id)"))
            except:
                pass
            
            try:
                db.session.execute(text("CREATE INDEX idx_reminder_queue_is_dismissed ON reminder_queue(is_dismissed)"))
            except:
                pass
            
            db.session.commit()
            print("✅ Render migration completed successfully!")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Render migration failed: {str(e)}")
            raise

if __name__ == '__main__':
    migrate_on_render()