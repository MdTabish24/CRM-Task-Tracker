# 🔧 RENDER: Add source_of_reach Column

## ❌ Error:
```
column "source_of_reach" of relation "other_admissions" does not exist
```

## ✅ Solution: Run SQL Query on Render Database

---

## 📝 OPTION 1: Direct SQL (EASIEST)

### Step 1: Get Database Connection
1. Render Dashboard → PostgreSQL database
2. Click "Connect" → "External Connection"
3. Copy connection details

### Step 2: Run This SQL Query

```sql
-- Add source_of_reach column
ALTER TABLE other_admissions 
ADD COLUMN source_of_reach VARCHAR(200);

-- Verify it was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='other_admissions' 
ORDER BY ordinal_position;
```

### Step 3: Restart Web Service
Render Dashboard → crm-task-tracker → Manual Deploy

---

## 📝 OPTION 2: Using psql Command Line

If you have psql installed:

```bash
# Get connection string from Render dashboard
# Then run:
psql "your_database_url_here"

# In psql:
ALTER TABLE other_admissions ADD COLUMN source_of_reach VARCHAR(200);
\d other_admissions
\q
```

---

## 📝 OPTION 3: Using Online SQL Tool

1. Go to: https://www.db-fiddle.com/ or https://sqliteonline.com/
2. Select PostgreSQL
3. Enter Render database connection details
4. Run the ALTER TABLE query above

---

## ✅ Verification

After running the query, test:
1. Go to Visit Management
2. Click "New Visited (Walk-in Student)"
3. Fill form with Source of Reach
4. Submit
5. Should work! ✅

---

## 🎯 Quick SQL Command

Copy-paste this:
```sql
ALTER TABLE other_admissions ADD COLUMN source_of_reach VARCHAR(200);
```

---

**Run this SQL on Render PostgreSQL database!** 🚀
