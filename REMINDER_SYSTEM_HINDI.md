# रिमाइंडर/अलार्म सिस्टम - हिंदी गाइड

## सिस्टम का उद्देश्य

यह सिस्टम callers को उन students का track रखने में मदद करता है जो 2-3-4 दिन बाद आने वाले हैं। अब callers को याद रखने की जरूरत नहीं - सिस्टम automatically alarm बजाएगा!

## मुख्य Features

### 1. अलार्म सेट करना (⏰ बटन)
- हर record के सामने एक ⏰ (alarm) बटन है
- इस पर click करें
- Date और Time select करें (जब student आने वाला है)
- "Set Reminder" पर click करें
- बस! अलार्म सेट हो गया

### 2. दो बार अलार्म बजेगा

#### पहला अलार्म: 17 घंटे पहले
- अगर student 21 Oct को 2:30 PM आने वाला है
- तो 20 Oct को 9:30 PM को पहला alarm बजेगा
- यह advance warning है

#### दूसरा अलार्म: Exact समय पर
- 21 Oct को 2:30 PM को दूसरा alarm बजेगा
- यह final reminder है कि student अब आने वाला है

### 3. Queue System (अगर आप offline हैं)

**समस्या**: अगर alarm बजने का time हो गया लेकिन caller login नहीं है?

**समाधान**: 
- Alarm एक queue में save हो जाता है
- जैसे ही caller login करेगा
- सभी pending alarms एक-एक करके popup में दिखेंगे
- हर alarm को dismiss करना होगा

### 4. अलार्म Popup में क्या दिखेगा?

जब alarm बजेगा, एक बड़ा popup खुलेगा जिसमें:
- ✅ Student का नाम
- ✅ Phone number
- ✅ Response (क्या बोला था)
- ✅ Notes (अगर कोई है)
- ✅ Visit status
- ✅ Scheduled visit time
- ✅ Last updated time
- ✅ बड़ा लाल "STOP ALARM" बटन

### 5. आवाज़ (Sound)
- Continuous beeping sound बजेगी
- हर 1 second में एक beep
- जब तक "STOP ALARM" नहीं दबाएंगे, बजती रहेगी
- ध्यान खींचने के लिए loud sound

## कैसे Use करें?

### Step 1: Reminder Set करना
```
1. Caller dashboard खोलें
2. जिस student को track करना है, उसका record ढूंढें
3. उस record के सामने ⏰ बटन पर click करें
4. Date select करें (कब आने वाला है)
5. Time select करें (किस समय आने वाला है)
6. "Set Reminder" पर click करें
7. Success message दिखेगा
```

### Step 2: Alarm आने पर
```
1. Alarm automatically popup में खुलेगा
2. BEEP... BEEP... BEEP... sound बजेगी
3. Student की पूरी जानकारी दिखेगी
4. "🛑 STOP ALARM" बटन पर click करें
5. Alarm बंद हो जाएगा
6. अगर और alarms हैं, वो भी एक-एक करके दिखेंगे
```

## उदाहरण (Example)

### Scenario:
- आज 20 October है, सुबह 10 बजे
- Student ने कहा: "मैं कल 2:30 PM को आऊंगा"
- Caller ने reminder set किया: 21 Oct, 2:30 PM

### क्या होगा:

**20 October, 9:30 PM (रात को)**
```
🔔 ALARM 1 बजेगा!
"⏰ Reminder: Student visit scheduled in 17 hours!"

Student Details:
Name: Rahul Kumar
Phone: 9876543210
Response: Will visit tomorrow
Scheduled: Oct 21, 2:30 PM

[🛑 STOP ALARM]
```

**21 October, 2:30 PM (दोपहर को)**
```
🔔 ALARM 2 बजेगा!
"🔔 ALERT: Student visit scheduled NOW!"

Student Details:
Name: Rahul Kumar
Phone: 9876543210
Response: Will visit tomorrow
Scheduled: Oct 21, 2:30 PM

[🛑 STOP ALARM]
```

## अगर Caller Offline है?

### Situation:
- Alarm बजने का time: 20 Oct, 9:30 PM
- लेकिन caller 9:30 PM को login नहीं है
- Caller अगले दिन सुबह 10 AM को login करता है

### क्या होगा:
```
1. Caller login करते ही
2. तुरंत alarm popup खुलेगा
3. सभी pending alarms दिखेंगे
4. एक-एक करके dismiss करने होंगे
```

## Important Points

### ✅ फायदे
1. **कभी नहीं भूलेंगे**: System automatically याद दिलाएगा
2. **Advance Warning**: 17 घंटे पहले warning मिलेगी
3. **Exact Time Alert**: सही समय पर भी alert मिलेगा
4. **Offline Protection**: Offline होने पर भी alarm save रहेगा
5. **Complete Info**: Student की पूरी जानकारी एक साथ मिलेगी

### ⚠️ ध्यान दें
1. हर alarm को dismiss करना जरूरी है
2. Sound के लिए browser permission चाहिए
3. System time सही होना चाहिए
4. हर 30 seconds में system check करता है

## Technical Details (Admin के लिए)

### Database में क्या Add हुआ?
- `reminders` table - सभी reminders store होते हैं
- `reminder_queue` table - pending alarms store होते हैं

### API Endpoints
- POST `/api/caller/reminders` - Reminder set करने के लिए
- GET `/api/caller/check-reminders` - Reminders check करने के लिए
- GET `/api/caller/reminder-queue` - Queue देखने के लिए
- POST `/api/caller/reminder-queue/:id/dismiss` - Alarm dismiss करने के लिए

### Frontend Changes
- `CallerDashboard.js` - ⏰ बटन add हुआ
- `ReminderModal.js` - Reminder set करने का modal
- `ReminderAlarmPopup.js` - Alarm popup component

## Setup करने के लिए

### Step 1: Database Migration
```bash
cd backend
python add_reminder_tables.py
```

### Step 2: Server Restart
```bash
cd backend
python run_server.py
```

### Step 3: Frontend Build (अगर जरूरत हो)
```bash
cd frontend
npm run build
```

## Testing

### Test 1: Quick Test
1. Login करें as caller
2. किसी record पर ⏰ click करें
3. 2 minutes बाद का time set करें
4. Wait करें
5. 2 minutes बाद alarm बजना चाहिए

### Test 2: Queue Test
1. Past time का reminder set करें (जैसे कल का)
2. Logout करें
3. फिर login करें
4. Alarm तुरंत दिखना चाहिए

## Troubleshooting

### Problem: Sound नहीं बज रही
**Solution**: 
- Browser audio permission check करें
- Page पर कहीं भी click करें पहले
- Volume check करें

### Problem: Alarm नहीं आ रहा
**Solution**:
- Browser console check करें (F12)
- System time check करें
- Internet connection check करें

### Problem: ⏰ बटन नहीं दिख रहा
**Solution**:
- Browser cache clear करें
- Page refresh करें (Ctrl+F5)
- Frontend rebuild करें

## Support

अगर कोई problem हो:
1. Browser console check करें (F12 दबाएं)
2. Database connection check करें
3. Server logs देखें
4. Admin से contact करें

---

**अब callers कभी नहीं भूलेंगे कि कौन सा student कब आने वाला है! 🎉**

## Summary (संक्षेप में)

यह system एक smart reminder है जो:
- ⏰ हर record के साथ alarm button देता है
- 📅 Date/time set करने की सुविधा देता है
- 🔔 दो बार alarm बजाता है (17 घंटे पहले + exact time पर)
- 💾 Offline होने पर भी alarm save रखता है
- 📱 Login करते ही सभी pending alarms दिखाता है
- 🔊 Loud beeping sound के साथ popup दिखाता है
- 📋 Student की complete information दिखाता है
- 🛑 Easy dismiss button देता है

**Result**: Callers अब efficiently students को track कर सकते हैं और कोई भी follow-up miss नहीं होगा!
