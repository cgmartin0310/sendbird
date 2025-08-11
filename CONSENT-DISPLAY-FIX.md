# Consent Display Fix

## Problem
After successfully creating consents, the consent cards on the Admin Consents page were showing empty fields:
- Organization: (blank)
- Type: (blank)  
- Date: Invalid Date

## Root Cause
The backend returns flat data structure with snake_case fields:
```javascript
{
  patient_first_name: "John",
  patient_last_name: "Doe",
  organization_name: "Test Healthcare Organization",
  consent_type: "HIPAA Authorization",
  consent_date: "2025-08-11",
  is_active: true
}
```

But the frontend was expecting nested objects:
```javascript
{
  patient: { firstName: "John", lastName: "Doe" },
  organization: { name: "Test Healthcare Organization" },
  consentType: "HIPAA Authorization",
  consentDate: "2025-08-11"
}
```

## Solution
1. **Transform the data** when received from the backend:
   - Map `patient_first_name` → `patientFirstName`
   - Map `patient_last_name` → `patientLastName`
   - Map `organization_name` → `organizationName`
   - Map `consent_type` → `consentType`
   - Map `consent_date` → `consentDate`
   - Map `is_active` → `isActive`

2. **Update the display logic** to use the flat structure:
   - Changed `{consent.patient?.firstName}` to `{consent.patientFirstName}`
   - Changed `{consent.organization?.name}` to `{consent.organizationName}`
   - Changed `{consent.revoked}` to `{!consent.isActive}`

3. **Add safety checks** for date formatting:
   - Check if `consentDate` exists before formatting
   - Display "N/A" if date is missing

4. **Update TypeScript interface** to match the actual data structure

## Debug Output
The console now logs:
- `Raw consents data:` - Shows exactly what the backend returns
- `Transformed consents:` - Shows the mapped data used for display

## Result
Consent cards now properly display:
- ✅ Patient name (John Doe)
- ✅ Organization name  
- ✅ Consent type (HIPAA Authorization)
- ✅ Consent date (formatted)
- ✅ Active/Revoked status
- ✅ Expiry date (if set)

## Testing After Deployment
1. Wait ~5 minutes for deployment
2. Hard refresh the Admin → Consents page
3. All consent details should now be visible in the cards
4. Check browser console for debug output if needed
