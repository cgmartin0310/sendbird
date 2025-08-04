# Debug: Patients Not Showing in Consent Dropdown

## Quick Debug Steps

### 1. Check if Patients Exist in Database
In Render Backend Shell:
```bash
cd src
psql $DATABASE_URL -c "SELECT id, first_name, last_name, email FROM patients;"
```

### 2. Run Debug Script
```bash
npm run debug:patients
```

This will show:
- All patients in database
- Specific search for John Doe
- Any existing consents
- Test the exact API query

### 3. Check Browser Console
When on the Admin → Consents page, open browser console (F12) and look for:
```
Patients response: {...}
```

### 4. Manual API Test
In browser console while on the site:
```javascript
fetch('/api/patients', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  }
}).then(r => r.json()).then(console.log)
```

## Common Issues

### Patients exist but not showing:
1. **API endpoint issue** - The frontend might be calling wrong endpoint
2. **Response format** - API might return data in unexpected format
3. **Timing issue** - Data might not be loaded when form renders

### Quick Fix Attempt:
1. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
2. Log out and back in
3. Check browser Network tab for `/api/patients` call

## If John Doe exists in DB but not dropdown:

This could mean:
- Frontend caching issue
- API response format mismatch
- Network/CORS issue

Try:
1. Clear browser cache
2. Check Network tab for errors
3. Look for console errors

## Manual Database Check
```sql
-- Check all patients
SELECT * FROM patients;

-- Check John Doe specifically
SELECT * FROM patients WHERE first_name = 'John' AND last_name = 'Doe';

-- Check if patients table has any issues
SELECT COUNT(*) FROM patients;
```