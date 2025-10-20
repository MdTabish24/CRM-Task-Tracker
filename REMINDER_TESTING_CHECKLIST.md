# Reminder System - Complete Testing Checklist

## Pre-Testing Setup

### ✅ Environment Check
- [ ] Backend server is running
- [ ] Frontend is built and accessible
- [ ] Database connection is working
- [ ] Migration script has been run successfully
- [ ] Browser console is open (F12) for debugging

### ✅ Database Verification
```sql
-- Run these queries to verify tables exist
SELECT * FROM reminders LIMIT 1;
SELECT * FROM reminder_queue LIMIT 1;
```
- [ ] `reminders` table exists
- [ ] `reminder_queue` table exists
- [ ] Foreign keys are properly set

### ✅ User Accounts
- [ ] At least one caller account exists
- [ ] Can login as caller successfully
- [ ] Caller has some records assigned

---

## Test Suite 1: Basic Functionality

### Test 1.1: Set Reminder (Future Time)
**Steps:**
1. Login as caller
2. Navigate to caller dashboard
3. Find any record
4. Click ⏰ button
5. Set date: Tomorrow
6. Set time: 2:00 PM
7. Click "Set Reminder"

**Expected Results:**
- [ ] Modal opens successfully
- [ ] Date picker shows tomorrow's date
- [ ] Time picker is functional
- [ ] Success message appears
- [ ] Modal closes after setting
- [ ] No errors in console

**Database Check:**
```sql
SELECT * FROM reminders WHERE caller_id = [YOUR_CALLER_ID] ORDER BY created_at DESC LIMIT 1;
```
- [ ] New reminder record exists
- [ ] `scheduled_datetime` is correct
- [ ] `is_active` is TRUE
- [ ] Both trigger flags are FALSE

---

### Test 1.2: View Existing Reminder
**Steps:**
1. Click ⏰ button on same record again
2. Check if existing reminder is shown

**Expected Results:**
- [ ] Modal shows existing reminder time
- [ ] Can update the reminder
- [ ] Old reminder is updated, not duplicated

---

### Test 1.3: Delete Reminder
**Steps:**
1. Set a reminder
2. Use API or database to delete it
3. Verify it's removed

**Expected Results:**
- [ ] Reminder is marked as inactive
- [ ] No longer appears in checks

---

## Test Suite 2: Alarm Triggering (Online)

### Test 2.1: Quick Trigger Test (2 Minutes)
**Steps:**
1. Set reminder for 2 minutes from now
2. Stay logged in
3. Wait for 2 minutes
4. Observe

**Expected Results:**
- [ ] After 2 minutes, alarm popup appears
- [ ] Beeping sound plays
- [ ] Student details are displayed correctly
- [ ] "STOP ALARM" button is visible
- [ ] Popup has red border and pulsing animation

**Database Check:**
```sql
SELECT * FROM reminder_queue WHERE caller_id = [YOUR_CALLER_ID] AND is_dismissed = FALSE;
```
- [ ] Queue item exists
- [ ] `trigger_type` is 'exact_time'
- [ ] `triggered_at` timestamp is correct

---

### Test 2.2: Dismiss Alarm
**Steps:**
1. When alarm appears, click "STOP ALARM"

**Expected Results:**
- [ ] Sound stops immediately
- [ ] Popup closes
- [ ] No errors in console

**Database Check:**
```sql
SELECT * FROM reminder_queue WHERE id = [QUEUE_ID];
```
- [ ] `is_dismissed` is TRUE

---

### Test 2.3: Multiple Alarms
**Steps:**
1. Set 3 reminders for past times (using database)
2. Refresh page
3. Observe alarms appearing

**Expected Results:**
- [ ] First alarm appears
- [ ] After dismissing, second alarm appears
- [ ] After dismissing, third alarm appears
- [ ] All alarms show correct information
- [ ] Sound plays for each alarm

---

## Test Suite 3: Queue System (Offline)

### Test 3.1: Offline Trigger
**Steps:**
1. Set reminder for 1 minute from now
2. Immediately logout
3. Wait 2 minutes
4. Login again

**Expected Results:**
- [ ] Alarm appears immediately on login
- [ ] Sound plays
- [ ] All student details are correct
- [ ] Can dismiss successfully

**Database Check (before login):**
```sql
SELECT * FROM reminder_queue WHERE caller_id = [YOUR_CALLER_ID] AND is_dismissed = FALSE;
```
- [ ] Queue item exists even though caller was offline

---

### Test 3.2: Multiple Offline Alarms
**Steps:**
1. Set 3 reminders for past times (using database)
2. Logout
3. Login

**Expected Results:**
- [ ] All 3 alarms appear one by one
- [ ] Must dismiss each individually
- [ ] No alarms are skipped

---

## Test Suite 4: 17-Hour Trigger

### Test 4.1: 17-Hour Warning (Manual Database Test)
**Steps:**
1. Manually insert reminder in database:
```sql
INSERT INTO reminders (record_id, caller_id, scheduled_datetime, is_active)
VALUES ([RECORD_ID], [CALLER_ID], NOW() + INTERVAL '17 hours', TRUE);
```
2. Manually trigger by updating time:
```sql
UPDATE reminders 
SET scheduled_datetime = NOW() + INTERVAL '1 minute'
WHERE id = [REMINDER_ID];
```
3. Wait 1 minute

**Expected Results:**
- [ ] Alarm triggers
- [ ] Message says "17 hours before"
- [ ] `reminder_17h_triggered` becomes TRUE

---

## Test Suite 5: Edge Cases

### Test 5.1: Past Time Reminder
**Steps:**
1. Try to set reminder for yesterday
2. Observe behavior

**Expected Results:**
- [ ] Date picker prevents past dates (min attribute)
- [ ] Or alarm triggers immediately if allowed

---

### Test 5.2: Same Time Multiple Records
**Steps:**
1. Set same time reminder for 3 different records
2. Wait for trigger time

**Expected Results:**
- [ ] All 3 alarms appear
- [ ] Each shows correct record information
- [ ] No mixing of data

---

### Test 5.3: Rapid Dismiss
**Steps:**
1. Set multiple alarms
2. Dismiss them very quickly

**Expected Results:**
- [ ] All dismissals are processed
- [ ] No duplicate alarms
- [ ] No errors

---

### Test 5.4: Browser Refresh During Alarm
**Steps:**
1. Alarm is showing
2. Refresh browser (F5)
3. Observe

**Expected Results:**
- [ ] Alarm appears again after refresh
- [ ] Can still dismiss
- [ ] No data loss

---

### Test 5.5: Network Failure
**Steps:**
1. Disconnect internet
2. Try to set reminder
3. Observe error handling

**Expected Results:**
- [ ] Error message appears
- [ ] No crash
- [ ] Can retry after reconnecting

---

## Test Suite 6: UI/UX Testing

### Test 6.1: Modal Appearance
**Checks:**
- [ ] Modal is centered on screen
- [ ] Date picker is functional
- [ ] Time picker is functional
- [ ] Cancel button works
- [ ] Modal closes on cancel
- [ ] Modal closes on backdrop click (if implemented)

---

### Test 6.2: Alarm Popup Appearance
**Checks:**
- [ ] Popup is centered
- [ ] Has dark overlay behind it
- [ ] Red border is visible
- [ ] Pulsing animation works
- [ ] All text is readable
- [ ] Button is large and clickable
- [ ] Responsive on mobile (if applicable)

---

### Test 6.3: Sound Quality
**Checks:**
- [ ] Sound is audible
- [ ] Not too loud or too quiet
- [ ] Beeps are consistent
- [ ] No distortion
- [ ] Stops immediately on dismiss

---

## Test Suite 7: Performance Testing

### Test 7.1: Many Reminders
**Steps:**
1. Create 50 reminders in database
2. Check system performance

**Expected Results:**
- [ ] Page loads normally
- [ ] No lag in UI
- [ ] Alarms trigger correctly
- [ ] Database queries are fast

---

### Test 7.2: Long Running Session
**Steps:**
1. Keep caller logged in for 1 hour
2. Set reminders during this time
3. Observe

**Expected Results:**
- [ ] 30-second check continues working
- [ ] No memory leaks
- [ ] Alarms still trigger correctly

---

## Test Suite 8: Security Testing

### Test 8.1: Access Control
**Steps:**
1. Try to access another caller's reminders
2. Use API directly with different caller_id

**Expected Results:**
- [ ] Access denied
- [ ] 403 error returned
- [ ] No data leakage

---

### Test 8.2: SQL Injection
**Steps:**
1. Try to inject SQL in date/time fields
2. Try malicious input in API calls

**Expected Results:**
- [ ] Input is sanitized
- [ ] No SQL errors
- [ ] System remains secure

---

## Test Suite 9: Browser Compatibility

### Test 9.1: Chrome
- [ ] All features work
- [ ] Sound plays
- [ ] UI renders correctly

### Test 9.2: Firefox
- [ ] All features work
- [ ] Sound plays
- [ ] UI renders correctly

### Test 9.3: Safari
- [ ] All features work
- [ ] Sound plays (may need user interaction first)
- [ ] UI renders correctly

### Test 9.4: Edge
- [ ] All features work
- [ ] Sound plays
- [ ] UI renders correctly

---

## Test Suite 10: Mobile Testing

### Test 10.1: Mobile Chrome
- [ ] ⏰ button is tappable
- [ ] Modal is responsive
- [ ] Date/time pickers work
- [ ] Alarm popup is readable
- [ ] Sound plays

### Test 10.2: Mobile Safari
- [ ] All features work
- [ ] Touch interactions work
- [ ] Sound plays (after user interaction)

---

## Regression Testing

After any code changes, verify:
- [ ] Existing reminders still work
- [ ] No data loss
- [ ] All APIs still respond correctly
- [ ] UI hasn't broken
- [ ] Sound still plays

---

## Final Verification Checklist

### Functionality
- [ ] Can set reminders
- [ ] Can update reminders
- [ ] Can delete reminders
- [ ] 17-hour trigger works
- [ ] Exact time trigger works
- [ ] Queue system works
- [ ] Offline mode works
- [ ] Sound plays correctly
- [ ] Can dismiss alarms
- [ ] Multiple alarms work

### Database
- [ ] Tables exist
- [ ] Indexes are created
- [ ] Foreign keys work
- [ ] Data is persisted correctly
- [ ] No orphaned records

### Performance
- [ ] Page loads quickly
- [ ] No lag in UI
- [ ] Database queries are optimized
- [ ] No memory leaks
- [ ] 30-second interval doesn't cause issues

### Security
- [ ] Authentication required
- [ ] Authorization enforced
- [ ] No data leakage
- [ ] Input validation works
- [ ] SQL injection prevented

### User Experience
- [ ] UI is intuitive
- [ ] Error messages are clear
- [ ] Success feedback is provided
- [ ] Sound is appropriate
- [ ] Mobile friendly

---

## Bug Report Template

If you find a bug, document it:

```
Bug ID: [Unique ID]
Date: [Date Found]
Tester: [Your Name]
Severity: [Critical/High/Medium/Low]

Description:
[What happened]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Screenshots:
[Attach if applicable]

Console Errors:
[Copy any errors from console]

Environment:
- Browser: [Chrome/Firefox/etc]
- OS: [Windows/Mac/Linux]
- Version: [Version numbers]
```

---

## Sign-Off

Testing completed by: ___________________
Date: ___________________
All critical tests passed: [ ] Yes [ ] No
System ready for production: [ ] Yes [ ] No

Notes:
_________________________________________________
_________________________________________________
_________________________________________________
