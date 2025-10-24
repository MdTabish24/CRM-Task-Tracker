# Database Migration Guide

## Problem: CSV Upload Not Working

**Error:** `column records.hidden_from_caller does not exist`

**Root Cause:** Database schema me `hidden_from_caller` column missing hai.

---

## Solution: Run Migration

### Step 1: Verify Current Database State

```bash
python verify_database.py
```

Ye script check karega ki database me kya columns hai aur kya missing hai.

### Step 2: Run Migration

```bash
python run_migration.py
```

Ye script automatically `hidden_from_caller` column add kar dega.

### Step 3: Verify Migration Success

```bash
python verify_database.py
```

Agar sab kuch sahi hai to "✅ DATABASE SCHEMA IS CORRECT!" dikhega.

### Step 4: Restart Server

Server ko restart karo taaki updated schema load ho:

```bash
# Stop current server (Ctrl+C)
# Then restart:
python start.py
```

---

## For Production (Railway/Render)

### Option 1: Using Railway CLI

```bash
railway run python run_migration.py
```

### Option 2: Using Web Console

1. Railway/Render dashboard me jao
2. "Console" ya "Shell" open karo
3. Run karo:
   ```bash
   python run_migration.py
   ```

### Option 3: Add to Deployment

`Procfile` me add karo:

```
release: python run_migration.py
web: gunicorn wsgi:app
```

Ye automatically har deployment pe migration run karega.

---

## Manual Migration (If Scripts Don't Work)

Agar scripts kaam nahi kar rahe, to directly database me run karo:

### PostgreSQL:

```sql
ALTER TABLE records 
ADD COLUMN hidden_from_caller BOOLEAN DEFAULT FALSE NOT NULL;
```

### MySQL:

```sql
ALTER TABLE records 
ADD COLUMN hidden_from_caller TINYINT(1) DEFAULT 0 NOT NULL;
```

---

## Troubleshooting

### Error: "DATABASE_URL not found"

Set environment variable:

```bash
# Linux/Mac
export DATABASE_URL="your_database_url"

# Windows CMD
set DATABASE_URL=your_database_url

# Windows PowerShell
$env:DATABASE_URL="your_database_url"
```

### Error: "Permission denied"

Make scripts executable:

```bash
chmod +x run_migration.py verify_database.py
```

### Error: "Module not found"

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## After Migration

1. ✅ Verify database schema: `python verify_database.py`
2. ✅ Restart server
3. ✅ Test CSV upload
4. ✅ Check logs for any errors

---

## Need Help?

Check server logs for detailed error messages:
- Look for lines starting with ❌ or ⚠️
- Full traceback will be printed
- Error type and message will be shown
