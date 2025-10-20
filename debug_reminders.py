#!/usr/bin/env python3
"""
Debug script to check reminders in database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.app import app, db, Reminder, ReminderQueue, User
from datetime import datetime

def debug_reminders():
    with app.app_context():
        print("🔍 DEBUGGING REMINDERS")
        print("=" * 50)
        
        # Check all reminders
        all_reminders = Reminder.query.all()
        print(f"📋 Total reminders in database: {len(all_reminders)}")
        
        for reminder in all_reminders:
            user = User.query.get(reminder.caller_id)
            print(f"\n⏰ Reminder ID: {reminder.id}")
            print(f"   Caller: {user.name if user else 'Unknown'} (ID: {reminder.caller_id})")
            print(f"   Scheduled: {reminder.scheduled_datetime}")
            print(f"   Created: {reminder.created_at}")
            print(f"   Active: {reminder.is_active}")
            print(f"   17h Triggered: {reminder.reminder_17h_triggered}")
            print(f"   Exact Triggered: {reminder.reminder_exact_triggered}")
            
            # Check time difference
            now = datetime.utcnow()
            time_diff = reminder.scheduled_datetime - now
            print(f"   Time until visit: {time_diff}")
            print(f"   Should trigger now? {now >= reminder.scheduled_datetime}")
        
        # Check queue
        queue_items = ReminderQueue.query.all()
        print(f"\n📋 Queue items: {len(queue_items)}")
        
        for item in queue_items:
            print(f"   Queue ID: {item.id}, Reminder: {item.reminder_id}, Type: {item.trigger_type}, Dismissed: {item.is_dismissed}")
        
        print("\n" + "=" * 50)

if __name__ == '__main__':
    debug_reminders()