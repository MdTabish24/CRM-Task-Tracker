# Render Production Fix - Step by Step

## Step 1: Run SQL Migration on Render Database

1. Go to https://dashboard.render.com
2. Click on your PostgreSQL database (not the web service)
3. Click "Connect" → "External Connection"
4. Copy the "PSQL Command" 
5. Open your terminal and paste the command
6. Once connected, run these commands:

```sql
ALTER TABLE other_admissions ADD COLUMN IF NOT EXISTS source_of_reach VARCHAR(200);
ALTER TABLE other_admissions ALTER COLUMN record_id DROP NOT NULL;
ALTER TABLE other_admissions ALTER COLUMN caller_name DROP NOT NULL;
```

7. Type `\q` to exit

## Step 2: Deploy Updated Code to Render

1. Commit and push your changes:

```bash
git add .
git commit -m "Fix outsider admission feature"
git push origin main
```

2. Render will automatically deploy the new code

## Step 3: Verify

1. Wait for deployment to complete
2. Open your app URL
3. Login as admin
4. Go to Visit Management
5. Click "New Visited (Walk-in Student)"
6. Fill the form and submit
7. Should work without errors!

## Done! ✅
