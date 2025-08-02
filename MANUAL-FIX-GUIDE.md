# 🚨 Quick Fix for Organization Creation

## The Issue
The database is missing UNIQUE constraints on organization and compliance group names, causing creation to fail.

## Immediate Fix (Do This Now)

### Option 1: Use Render Shell (Recommended)
1. Go to your [Render Dashboard](https://dashboard.render.com)
2. Click on `sendbird-messaging-api` service
3. Click the **"Shell"** tab
4. Run this command:
   ```bash
   npm run quick:fix
   ```
5. You should see:
   ```
   ✅ Database fix complete! Organization creation should work now.
   ```

### Option 2: Manual SQL Fix
If Option 1 doesn't work:
1. Go to your PostgreSQL database on Render
2. Click "Connect" → "PSQL Command"
3. Run these SQL commands:
   ```sql
   -- Add unique constraints
   ALTER TABLE organizations ADD CONSTRAINT organizations_name_unique UNIQUE (name);
   ALTER TABLE compliance_groups ADD CONSTRAINT compliance_groups_name_unique UNIQUE (name);
   
   -- Create default compliance group
   INSERT INTO compliance_groups (name, description)
   VALUES ('Default Group', 'Default compliance group')
   ON CONFLICT (name) DO NOTHING;
   ```

## After the Fix
1. Go back to Admin → Organization Management
2. Try creating "City Hospital" again
3. It should work now! ✅

## What This Does
- Adds UNIQUE constraints to prevent duplicate names
- Creates a default compliance group
- Fixes the "Failed to create organization" error

## Long-term Fix
The code has been updated and will apply these fixes automatically on the next deployment. But the manual fix above will solve it immediately!