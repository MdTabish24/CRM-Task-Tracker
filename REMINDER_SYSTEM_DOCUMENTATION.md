# Reminder/Alarm System Documentation

## Overview
The Reminder/Alarm System allows callers to set reminders for students who plan to visit at a later date. The system automatically triggers alarms at specific times to ensure callers don't forget to follow up.

## Features

### 1. Set Reminder
- **Location**: Caller Dashboard - Each record has an alarm button (⏰)
- **Functionality**: 
  - Click the alarm button next to any record
  - Select the date and time when the student plans to visit
  - System saves the reminder

### 2. Automatic Alarm Triggers
The system triggers alarms at two specific times:

#### a) 17 Hours Before Visit
- Triggers 17 hours before the scheduled visit time
- Gives caller advance notice to prepare

#### b) Exact Visit Time
- Triggers at the exact scheduled visit time
- Final reminder that the student should be visiting now

### 3. Alarm Queue System
- **Offline Protection**: If caller is not logged in when alarm should trigger, it's added to a queue
- **On Login**: All queued alarms are shown immediately
- **Persistent**: Alarms stay in queue until dismissed

### 4. Alarm Popup
When an alarm triggers, a popup appears with:
- **Visual Alert**: Large, attention-grabbing popup with pulsing animation
- **Audio Alert**: Continuous beeping sound (800Hz sine wave, repeats every second)
- **Student Information**:
  - Name
  - Phone Number
  - Response/Notes
  - Visit Status
  - Scheduled Visit Time
  - Last Updated Time
- **Stop Button**: Large red button to dismiss the alarm

### 5. Multiple Alarms
- If multiple alarms are queued, they show one at a time
- After dismissing one, the next alarm appears automatically
- Counter shows how many alarms are pending

## Technical Implementation

### Backend (Python/Flask)

#### New Database Tables

**reminders**
```sql
- id: Primary key
- record_id: Foreign key to records table
- caller_id: Foreign key to users table
- scheduled_datetime: When student plans to visit
- reminder_17h_triggered: Boolean flag
- reminder_exact_triggered: Boolean flag
- is_active: Boolean (false after both triggers)
- created_at: Timestamp
```

**reminder_queue**
```sql
- id: Primary key
- reminder_id: Foreign key to reminders table
- caller_id: Foreign key to users table
- trigger_type: '17h_before' or 'exact_time'
- triggered_at: When alarm was triggered
- is_dismissed: Boolean (true after user dismisses)
```

#### New API Endpoints

1. **POST /api/caller/reminders**
   - Create or update a reminder
   - Body: `{ record_id, scheduled_datetime }`

2. **GET /api/caller/reminders/:record_id**
   - Get reminder for specific record
   - Returns reminder details if exists

3. **DELETE /api/caller/reminders/:reminder_id**
   - Delete/deactivate a reminder

4. **GET /api/caller/check-reminders**
   - Check for reminders that need to be triggered
   - Adds triggered reminders to queue
   - Called automatically every 30 seconds

5. **GET /api/caller/reminder-queue**
   - Get all pending alarms for caller
   - Returns full record details for each alarm

6. **POST /api/caller/reminder-queue/:queue_id/dismiss**
   - Dismiss an alarm from queue
   - Marks as dismissed in database

### Frontend (React)

#### New Components

1. **ReminderModal.js**
   - Modal dialog for setting reminder
   - Date and time picker
   - Shows reminder schedule info

2. **ReminderAlarmPopup.js**
   - Full-screen alarm popup
   - Web Audio API for beep sound
   - Displays all record information
   - Stop alarm button

#### Updated Components

**CallerDashboard.js**
- Added alarm button (⏰) to each record
- Automatic reminder checking every 30 seconds
- Shows alarm popup when reminders trigger
- Manages reminder queue state

## User Workflow

### Setting a Reminder
1. Caller logs into dashboard
2. Finds record of student who said they'll visit later
3. Clicks alarm button (⏰) next to the record
4. Selects date and time of planned visit
5. Clicks "Set Reminder"
6. System confirms reminder is set

### Receiving Alarms

#### Scenario 1: Caller is Online
1. System checks reminders every 30 seconds
2. When trigger time is reached, alarm immediately pops up
3. Beeping sound plays continuously
4. Caller sees full student information
5. Caller clicks "STOP ALARM" to dismiss
6. If more alarms are queued, next one appears

#### Scenario 2: Caller is Offline
1. System detects trigger time has passed
2. Alarm is added to queue
3. When caller logs in:
   - System immediately checks queue
   - All pending alarms pop up one by one
   - Caller must dismiss each alarm

## Database Migration

To add the new tables to your database:

```bash
cd backend
python add_reminder_tables.py
```

This creates:
- `reminders` table
- `reminder_queue` table
- Necessary indexes for performance

## Configuration

### Reminder Check Interval
Default: 30 seconds (30000ms)

To change, edit `CallerDashboard.js`:
```javascript
const reminderInterval = setInterval(() => {
  checkReminders();
}, 30000); // Change this value
```

### Alarm Sound
- Frequency: 800 Hz
- Type: Sine wave
- Duration: 0.5 seconds
- Repeat: Every 1 second
- Volume: 30%

To customize, edit `ReminderAlarmPopup.js`:
```javascript
oscillator.frequency.value = 800; // Change frequency
gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Change volume
```

## Testing

### Test Reminder System
1. Create a test reminder for 2 minutes in the future
2. Wait for 17 hours before trigger (won't trigger for short times)
3. Wait for exact time trigger
4. Verify alarm popup appears
5. Verify sound plays
6. Click stop alarm
7. Verify alarm is dismissed

### Test Queue System
1. Set a reminder for past time
2. Logout
3. Login again
4. Verify alarm popup appears immediately

## Troubleshooting

### Alarm Sound Not Playing
- Check browser audio permissions
- Some browsers block autoplay audio
- User may need to interact with page first

### Alarms Not Triggering
- Check system time is correct
- Verify reminder check interval is running
- Check browser console for errors
- Verify database connection

### Multiple Alarms Showing
- This is expected behavior
- Each alarm must be dismissed individually
- Ensures caller sees all pending reminders

## Future Enhancements

Possible improvements:
1. Snooze functionality
2. Custom alarm sounds
3. Email/SMS notifications
4. Reminder history/logs
5. Bulk reminder management
6. Reminder templates
7. Recurring reminders
8. Reminder statistics

## Security Considerations

- Callers can only set reminders for their own records
- Callers can only see their own reminder queue
- All endpoints require JWT authentication
- Database foreign keys ensure data integrity

## Performance

- Indexes on caller_id and scheduled_datetime for fast queries
- Queue system prevents duplicate alarms
- Automatic cleanup of dismissed alarms
- Efficient 30-second polling interval

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database tables exist
3. Check API endpoint responses
4. Review server logs
