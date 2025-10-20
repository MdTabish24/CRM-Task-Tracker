# Reminder System - Visual Guide

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     REMINDER SYSTEM WORKFLOW                     │
└─────────────────────────────────────────────────────────────────┘

1. SETTING A REMINDER
   ┌──────────────┐
   │   Caller     │
   │  Dashboard   │
   └──────┬───────┘
          │ Clicks ⏰ button
          ▼
   ┌──────────────┐
   │   Reminder   │
   │    Modal     │
   └──────┬───────┘
          │ Selects date/time
          ▼
   ┌──────────────┐
   │   Database   │
   │  (reminders) │
   └──────────────┘


2. AUTOMATIC CHECKING (Every 30 seconds)
   ┌──────────────┐
   │   Frontend   │
   │   Timer      │
   └──────┬───────┘
          │ Every 30s
          ▼
   ┌──────────────┐
   │ Check API    │
   │ /check-      │
   │  reminders   │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────────────────────┐
   │  Is current time >= trigger?     │
   │                                   │
   │  Trigger 1: scheduled_time - 17h │
   │  Trigger 2: scheduled_time       │
   └──────┬───────────────────────────┘
          │ YES
          ▼
   ┌──────────────┐
   │   Add to     │
   │ Reminder     │
   │   Queue      │
   └──────────────┘


3. ALARM POPUP (When caller is online)
   ┌──────────────┐
   │ Reminder     │
   │   Queue      │
   └──────┬───────┘
          │ Has items?
          ▼
   ┌──────────────────────────────────┐
   │                                   │
   │    🔔 ALARM POPUP APPEARS 🔔     │
   │                                   │
   │  ┌─────────────────────────────┐ │
   │  │ ⏰ Student Visit Reminder!  │ │
   │  ├─────────────────────────────┤ │
   │  │ Name: John Doe              │ │
   │  │ Phone: 1234567890           │ │
   │  │ Response: Interested        │ │
   │  │ Visit Time: Oct 21, 2:30 PM │ │
   │  ├─────────────────────────────┤ │
   │  │   [🛑 STOP ALARM]           │ │
   │  └─────────────────────────────┘ │
   │                                   │
   │  🔊 BEEP... BEEP... BEEP...      │
   │                                   │
   └───────────────────────────────────┘


4. QUEUE SYSTEM (When caller is offline)
   ┌──────────────┐
   │  Trigger     │
   │   Time       │
   │  Reached     │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────┐
   │ Is caller        │
   │ logged in?       │
   └──────┬───────────┘
          │ NO
          ▼
   ┌──────────────┐
   │   Save to    │
   │   Queue      │
   │ (persistent) │
   └──────┬───────┘
          │
          │ Caller logs in later
          ▼
   ┌──────────────┐
   │   Fetch      │
   │   Queue      │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   Show All   │
   │   Pending    │
   │   Alarms     │
   └──────────────┘
```

## User Interface Elements

### 1. Caller Dashboard - Record Row
```
┌────────────────────────────────────────────────────────────────┐
│ Phone Number │ Name      │ Response  │ Notes │ Status │ Actions│
├────────────────────────────────────────────────────────────────┤
│ 1234567890   │ John Doe  │ Will visit│ ...   │ pending│ [Edit] │
│              │           │ tomorrow  │       │        │  [⏰]  │
└────────────────────────────────────────────────────────────────┘
                                                           ↑
                                                    Alarm Button
```

### 2. Reminder Modal
```
┌─────────────────────────────────────────────┐
│              Set Reminder                    │
├─────────────────────────────────────────────┤
│                                              │
│  Record: John Doe                            │
│  Phone: 1234567890                           │
│                                              │
│  When is the student planning to visit?      │
│                                              │
│  Date: [2025-10-21        ▼]                │
│  Time: [14:30             ▼]                │
│                                              │
│  ℹ️ Note: You will receive reminders:       │
│    • 17 hours before the scheduled time     │
│    • At the exact scheduled time            │
│                                              │
│              [Cancel]  [Set Reminder]        │
└─────────────────────────────────────────────┘
```

### 3. Alarm Popup (Full Screen Overlay)
```
┌─────────────────────────────────────────────────────────────┐
│                    DARK OVERLAY (70% opacity)                │
│                                                              │
│    ┌──────────────────────────────────────────────────┐    │
│    │                                                   │    │
│    │  ⏰ Reminder: Student visit scheduled NOW!       │    │
│    │                                                   │    │
│    │  ┌─────────────────────────────────────────────┐ │    │
│    │  │         Student Details                     │ │    │
│    │  ├─────────────────────────────────────────────┤ │    │
│    │  │ Name: John Doe                              │ │    │
│    │  │ Phone Number: 1234567890                    │ │    │
│    │  │ Response: Will visit tomorrow               │ │    │
│    │  │ Notes: Interested in COA course             │ │    │
│    │  │ Visit Status: pending                       │ │    │
│    │  │ Scheduled Visit Time: Oct 21, 2025 2:30 PM  │ │    │
│    │  │ Last Updated: Oct 20, 2025 10:15 AM         │ │    │
│    │  └─────────────────────────────────────────────┘ │    │
│    │                                                   │    │
│    │              [🛑 STOP ALARM]                     │    │
│    │                                                   │    │
│    └──────────────────────────────────────────────────┘    │
│                                                              │
│                  🔊 BEEP... BEEP... BEEP...                 │
└─────────────────────────────────────────────────────────────┘
```

## Timeline Example

### Scenario: Student says they'll visit on Oct 21 at 2:30 PM

```
Oct 20, 9:30 AM  ─┐
                  │  Caller sets reminder
                  │  for Oct 21, 2:30 PM
                  ▼
                [Reminder Created]
                  │
                  │
Oct 20, 9:30 PM  ─┤  ← 17 hours before
                  │    🔔 ALARM 1 TRIGGERS
                  │    "Student visit in 17 hours!"
                  │
                  │
Oct 21, 2:30 PM  ─┤  ← Exact time
                  │    🔔 ALARM 2 TRIGGERS
                  │    "Student visit NOW!"
                  │
                  ▼
              [Reminder Complete]
```

## Database State Flow

### Initial State (Reminder Created)
```
reminders table:
┌────┬───────────┬───────────┬─────────────────────┬──────────┬──────────┬──────────┐
│ id │ record_id │ caller_id │ scheduled_datetime  │ 17h_trig │ exact_tr │ is_active│
├────┼───────────┼───────────┼─────────────────────┼──────────┼──────────┼──────────┤
│ 1  │ 123       │ 5         │ 2025-10-21 14:30:00 │ FALSE    │ FALSE    │ TRUE     │
└────┴───────────┴───────────┴─────────────────────┴──────────┴──────────┴──────────┘

reminder_queue table:
(empty)
```

### After 17h Trigger
```
reminders table:
┌────┬───────────┬───────────┬─────────────────────┬──────────┬──────────┬──────────┐
│ id │ record_id │ caller_id │ scheduled_datetime  │ 17h_trig │ exact_tr │ is_active│
├────┼───────────┼───────────┼─────────────────────┼──────────┼──────────┼──────────┤
│ 1  │ 123       │ 5         │ 2025-10-21 14:30:00 │ TRUE ✓   │ FALSE    │ TRUE     │
└────┴───────────┴───────────┴─────────────────────┴──────────┴──────────┴──────────┘

reminder_queue table:
┌────┬──────────────┬───────────┬──────────────┬─────────────────────┬─────────────┐
│ id │ reminder_id  │ caller_id │ trigger_type │ triggered_at        │ is_dismissed│
├────┼──────────────┼───────────┼──────────────┼─────────────────────┼─────────────┤
│ 1  │ 1            │ 5         │ 17h_before   │ 2025-10-20 21:30:00 │ FALSE       │
└────┴──────────────┴───────────┴──────────────┴─────────────────────┴─────────────┘
```

### After Exact Time Trigger
```
reminders table:
┌────┬───────────┬───────────┬─────────────────────┬──────────┬──────────┬──────────┐
│ id │ record_id │ caller_id │ scheduled_datetime  │ 17h_trig │ exact_tr │ is_active│
├────┼───────────┼───────────┼─────────────────────┼──────────┼──────────┼──────────┤
│ 1  │ 123       │ 5         │ 2025-10-21 14:30:00 │ TRUE ✓   │ TRUE ✓   │ FALSE ✗  │
└────┴───────────┴───────────┴─────────────────────┴──────────┴──────────┴──────────┘

reminder_queue table:
┌────┬──────────────┬───────────┬──────────────┬─────────────────────┬─────────────┐
│ id │ reminder_id  │ caller_id │ trigger_type │ triggered_at        │ is_dismissed│
├────┼──────────────┼───────────┼──────────────┼─────────────────────┼─────────────┤
│ 1  │ 1            │ 5         │ 17h_before   │ 2025-10-20 21:30:00 │ FALSE       │
│ 2  │ 1            │ 5         │ exact_time   │ 2025-10-21 14:30:00 │ FALSE       │
└────┴──────────────┴───────────┴──────────────┴─────────────────────┴─────────────┘
```

### After User Dismisses Alarms
```
reminder_queue table:
┌────┬──────────────┬───────────┬──────────────┬─────────────────────┬─────────────┐
│ id │ reminder_id  │ caller_id │ trigger_type │ triggered_at        │ is_dismissed│
├────┼──────────────┼───────────┼──────────────┼─────────────────────┼─────────────┤
│ 1  │ 1            │ 5         │ 17h_before   │ 2025-10-20 21:30:00 │ TRUE ✓      │
│ 2  │ 1            │ 5         │ exact_time   │ 2025-10-21 14:30:00 │ TRUE ✓      │
└────┴──────────────┴───────────┴──────────────┴─────────────────────┴─────────────┘
```

## Color Coding

### Alarm Popup Colors
- **Border**: Red (#ff5722) - High urgency
- **Background**: White - Clear visibility
- **Header**: Orange (#ff5722) - Attention grabbing
- **Info Box**: Light Orange (#fff3e0) - Warm, informative
- **Stop Button**: Red (#f44336) - Clear action

### Visit Status Colors
- **Confirmed**: Green (#d4edda / #155724)
- **Declined**: Red (#f8d7da / #721c24)
- **Visited**: Blue (#e1f5fe / #01579b)
- **Pending**: Yellow (#fff3cd / #856404)

## Sound Specifications

### Alarm Beep
- **Technology**: Web Audio API
- **Waveform**: Sine wave
- **Frequency**: 800 Hz
- **Duration**: 0.5 seconds per beep
- **Interval**: 1 second between beeps
- **Volume**: 30% (0.3)
- **Pattern**: Continuous until stopped

```
Time:  0s    1s    2s    3s    4s    5s
Sound: BEEP  BEEP  BEEP  BEEP  BEEP  BEEP
       ▄▀▄  ▄▀▄  ▄▀▄  ▄▀▄  ▄▀▄  ▄▀▄
```

## Mobile Responsiveness

The system is designed to work on all devices:
- Desktop: Full-width popup
- Tablet: Responsive popup (90% width)
- Mobile: Full-screen popup with touch-friendly buttons

---

**This visual guide helps understand the complete flow of the reminder system!**
