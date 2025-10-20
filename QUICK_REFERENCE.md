# Reminder System - Quick Reference Card

## 🚀 Quick Start (5 Minutes)

### Setup
```bash
# 1. Run migration
cd backend
python add_reminder_tables.py

# 2. Restart server
python run_server.py

# 3. Test (login as caller)
# Click ⏰ → Set time → Wait → Alarm!
```

---

## 🎯 For Callers (Users)

### How to Set Reminder
1. Find student record
2. Click ⏰ button
3. Select date and time
4. Click "Set Reminder"
5. Done! ✅

### When Alarm Rings
1. Popup appears automatically
2. Sound plays: BEEP... BEEP...
3. See all student info
4. Click "🛑 STOP ALARM"
5. Next alarm (if any) appears

### Important
- Set time = when student will visit
- Get 2 alarms: 17h before + exact time
- If offline, alarms wait in queue
- Must dismiss each alarm

---

## 💻 For Developers

### API Endpoints
```javascript
// Set reminder
POST /api/caller/reminders
{ record_id: 123, scheduled_datetime: "2025-10-21T14:30:00" }

// Check reminders (auto-called every 30s)
GET /api/caller/check-reminders

// Get queue
GET /api/caller/reminder-queue

// Dismiss alarm
POST /api/caller/reminder-queue/:id/dismiss
```

### Database Tables
```sql
-- Main reminders
reminders (id, record_id, caller_id, scheduled_datetime, ...)

-- Alarm queue
reminder_queue (id, reminder_id, caller_id, trigger_type, is_dismissed)
```

### Key Files
```
Backend:
- app.py (models + endpoints)
- add_reminder_tables.py (migration)

Frontend:
- CallerDashboard.js (main integration)
- ReminderModal.js (set reminder)
- ReminderAlarmPopup.js (alarm display)
```

---

## 🔧 Configuration

### Change Check Interval
`CallerDashboard.js` line ~25:
```javascript
setInterval(() => checkReminders(), 30000); // 30 seconds
```

### Change Alarm Sound
`ReminderAlarmPopup.js` line ~20:
```javascript
oscillator.frequency.value = 800; // Hz
gainNode.gain.setValueAtTime(0.3, ...); // Volume
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| No sound | Check browser audio permissions |
| No alarm | Check console (F12), verify time |
| No ⏰ button | Clear cache, rebuild frontend |
| DB error | Run migration script |

---

## 📊 System Logic

```
Set Reminder → Database
     ↓
Every 30s: Check time
     ↓
Time reached? → Add to Queue
     ↓
Show Popup + Play Sound
     ↓
User clicks Stop → Dismiss
```

---

## ⏰ Trigger Times

```
Student visit: Oct 21, 2:30 PM

Alarm 1: Oct 20, 9:30 PM (17h before)
Alarm 2: Oct 21, 2:30 PM (exact time)
```

---

## 🎨 UI Elements

### ⏰ Button
- Location: Each record row
- Action: Opens reminder modal

### Reminder Modal
- Date picker
- Time picker
- Set/Cancel buttons

### Alarm Popup
- Full screen overlay
- Red border, pulsing
- Student details
- Stop button
- Beeping sound

---

## 🔒 Security

- ✅ JWT authentication required
- ✅ Callers see only their reminders
- ✅ Can't access other's data
- ✅ SQL injection protected

---

## 📱 Browser Support

- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

---

## 📚 Full Documentation

- `REMINDER_SYSTEM_DOCUMENTATION.md` - Complete guide
- `REMINDER_SETUP_GUIDE.md` - Setup steps
- `REMINDER_TESTING_CHECKLIST.md` - Testing
- `REMINDER_SYSTEM_HINDI.md` - Hindi guide
- `REMINDER_SYSTEM_VISUAL_GUIDE.md` - Diagrams
- `REMINDER_SYSTEM_SUMMARY.md` - Overview

---

## ✅ Quick Test

```bash
# 1. Login as caller
# 2. Click ⏰ on any record
# 3. Set time: 2 minutes from now
# 4. Wait 2 minutes
# 5. Alarm should appear!
```

---

## 🎯 Key Features

✅ Set reminders with date/time
✅ 17-hour advance warning
✅ Exact time alert
✅ Offline queue system
✅ Audible alarm
✅ Complete student info
✅ Easy dismiss
✅ Multiple alarm support

---

## 📞 Need Help?

1. Check browser console (F12)
2. Review documentation files
3. Verify database migration
4. Check server logs
5. Test with simple 2-minute reminder

---

**Remember**: The system checks every 30 seconds, so alarms may trigger up to 30 seconds after the exact time. This is normal and expected behavior.

---

*Keep this card handy for quick reference!* 📌
