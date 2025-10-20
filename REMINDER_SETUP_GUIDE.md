# Reminder System - Quick Setup Guide

## Step-by-Step Installation

### Step 1: Database Migration
Run the migration script to add new tables:

```bash
cd backend
python add_reminder_tables.py
```

Expected output:
```
✅ Reminder tables created successfully!
```

### Step 2: Verify Backend Changes
The following files have been updated:
- `backend/app.py` - Added Reminder and ReminderQueue models + API endpoints

### Step 3: Verify Frontend Changes
New files created:
- `frontend/src/components/ReminderModal.js` - Modal for setting reminders
- `frontend/src/components/ReminderAlarmPopup.js` - Alarm popup with sound

Updated files:
- `frontend/src/components/CallerDashboard.js` - Integrated reminder system

### Step 4: Restart Backend Server
```bash
cd backend
python run_server.py
```

### Step 5: Rebuild Frontend (if needed)
```bash
cd frontend
npm run build
```

### Step 6: Test the System

#### Test 1: Set a Reminder
1. Login as a caller (e.g., caller1/caller123)
2. Go to caller dashboard
3. Find any record
4. Click the ⏰ button
5. Set a date/time (try 2 minutes from now for testing)
6. Click "Set Reminder"
7. Should see success message

#### Test 2: Check Alarm Trigger
1. Wait for the scheduled time
2. Alarm popup should appear automatically
3. Beeping sound should play
4. Click "STOP ALARM" to dismiss

#### Test 3: Test Queue System
1. Set a reminder for a past time (e.g., yesterday)
2. Logout
3. Login again
4. Alarm should appear immediately

## Quick Verification Checklist

- [ ] Database tables created (reminders, reminder_queue)
- [ ] Backend server running without errors
- [ ] Frontend built successfully
- [ ] Can see ⏰ button on caller dashboard
- [ ] Can open reminder modal
- [ ] Can set a reminder
- [ ] Alarm triggers at correct time
- [ ] Sound plays when alarm triggers
- [ ] Can dismiss alarm
- [ ] Queue works when offline

## Common Issues

### Issue: Tables not created
**Solution**: Check database connection in `.env` file

### Issue: ⏰ button not showing
**Solution**: Clear browser cache and rebuild frontend

### Issue: Alarm not triggering
**Solution**: Check browser console for errors, verify system time

### Issue: No sound playing
**Solution**: Check browser audio permissions, interact with page first

## Configuration

### Change Reminder Check Frequency
Edit `frontend/src/components/CallerDashboard.js`:
```javascript
// Line ~25
const reminderInterval = setInterval(() => {
  checkReminders();
}, 30000); // 30 seconds (change this)
```

### Change Alarm Sound
Edit `frontend/src/components/ReminderAlarmPopup.js`:
```javascript
// Line ~20
oscillator.frequency.value = 800; // Frequency in Hz
gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Volume
```

## API Endpoints Reference

All endpoints require JWT authentication (Bearer token).

### Create/Update Reminder
```
POST /api/caller/reminders
Body: {
  "record_id": 123,
  "scheduled_datetime": "2025-10-21T14:30:00"
}
```

### Get Reminder for Record
```
GET /api/caller/reminders/:record_id
```

### Delete Reminder
```
DELETE /api/caller/reminders/:reminder_id
```

### Check for Triggered Reminders
```
GET /api/caller/check-reminders
```

### Get Reminder Queue
```
GET /api/caller/reminder-queue
```

### Dismiss Alarm
```
POST /api/caller/reminder-queue/:queue_id/dismiss
```

## Database Schema

### reminders table
```sql
CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES records(id),
    caller_id INTEGER REFERENCES users(id),
    scheduled_datetime TIMESTAMP NOT NULL,
    reminder_17h_triggered BOOLEAN DEFAULT FALSE,
    reminder_exact_triggered BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### reminder_queue table
```sql
CREATE TABLE reminder_queue (
    id SERIAL PRIMARY KEY,
    reminder_id INTEGER REFERENCES reminders(id),
    caller_id INTEGER REFERENCES users(id),
    trigger_type VARCHAR(20) CHECK (trigger_type IN ('17h_before', 'exact_time')),
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_dismissed BOOLEAN DEFAULT FALSE
);
```

## Support

If you encounter any issues:
1. Check the logs: `backend/logs/` (if logging is enabled)
2. Check browser console (F12)
3. Verify database connection
4. Ensure all dependencies are installed

## Next Steps

After successful setup:
1. Train callers on how to use the reminder system
2. Monitor system performance
3. Adjust reminder check interval if needed
4. Consider adding email/SMS notifications (future enhancement)

---

**System is now ready to use! 🎉**
