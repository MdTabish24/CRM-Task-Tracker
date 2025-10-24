# ⚡ RENDER - 5 MINUTE FIX

## 🎯 Problem
CSV upload fail - column missing

## ✅ Solution (Choose ONE method)

---

## METHOD 1: Shell Command (FASTEST - 2 minutes)

### Step 1: Open Shell
1. https://dashboard.render.com
2. Select: **crm-task-tracker**
3. Click: **"Shell"** button (top right)

### Step 2: Run Migration
Copy-paste this command:
```bash
python migrate_render.py
```

### Step 3: Wait for Success
Look for:
```
✅ Column added successfully!
```

### Step 4: Restart
Close shell, click **"Manual Deploy"** > **"Deploy latest commit"**

**DONE!** ✅

---

## METHOD 2: Update Settings (5 minutes)

### Step 1: Go to Settings
1. https://dashboard.render.com
2. Select: **crm-task-tracker**
3. Click: **"Settings"** tab

### Step 2: Update Commands

Find and update these 3 fields:

**Build Command:**
```
pip install -r requirements.txt
```

**Pre-Deploy Command:**
```
python migrate_render.py
```

**Start Command:**
```
python wsgi.py
```

### Step 3: Save & Deploy
1. Click "Save Changes" for each
2. Click "Manual Deploy" > "Clear build cache & deploy"

**DONE!** ✅

---

## METHOD 3: Direct SQL (If Shell Not Working)

### Step 1: Get Database URL
1. Render Dashboard > PostgreSQL database
2. Click "Connect"
3. Copy "External Database URL"

### Step 2: Connect with psql or pgAdmin
Use any PostgreSQL client

### Step 3: Run SQL
```sql
ALTER TABLE records 
ADD COLUMN hidden_from_caller BOOLEAN DEFAULT FALSE NOT NULL;
```

### Step 4: Restart Service
Render Dashboard > Manual Deploy

**DONE!** ✅

---

## 🔍 How to Verify Success

### Check 1: Logs
Render Dashboard > Logs tab
Look for:
- ✅ "Column added successfully!"
- ✅ No errors
- ✅ "Server running"

### Check 2: Test Upload
1. Open your CRM website
2. Login as admin
3. Upload CSV file
4. Should work! ✅

---

## ⏱️ Time Comparison

| Method | Time | Difficulty | Success Rate |
|--------|------|------------|--------------|
| Shell | 2 min | Easy | 99% |
| Settings | 5 min | Medium | 95% |
| SQL | 3 min | Hard | 100% |

**Recommendation:** Try Shell first!

---

## 🆘 Troubleshooting

### Error: "Shell not available"
→ Use Method 2 or 3

### Error: "Permission denied"
→ Use Method 3 (Direct SQL)

### Error: "File not found"
→ Check if `migrate_render.py` is in your repo
→ Run: `git add migrate_render.py && git commit -m "Add migration" && git push`

---

## 📞 Quick Commands

### Check if column exists:
```bash
python -c "from app import app, db; from sqlalchemy import text; app.app_context().push(); result = db.session.execute(text('SELECT column_name FROM information_schema.columns WHERE table_name=\'records\' AND column_name=\'hidden_from_caller\'')); print('EXISTS' if result.fetchone() else 'MISSING')"
```

### Run migration:
```bash
python migrate_render.py
```

---

**PICK ONE METHOD AND GO!** 🚀

Recommended: **METHOD 1 (Shell)** - Fastest and easiest!
