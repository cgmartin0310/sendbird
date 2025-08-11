# General Medical Consent Implementation

## Overview

The consent system has been enhanced to support **General Medical consent** that applies to ALL organizations with the General Medical compliance group, rather than requiring individual organization-specific consent.

## How It Works

### **Database Changes**
- `organization_id` is now **nullable** in the `consents` table
- **Constraint added**: Only General Medical consents can have `NULL` organization_id
- **Existing General Medical consents** are automatically updated to have `NULL` organization_id

### **Frontend Changes**
- **Organization dropdown is greyed out** when "General Medical" consent type is selected
- **Clear messaging**: "This consent will apply to all General Medical organizations"
- **Form validation**: Organization is not required for General Medical consent

### **Backend Changes**
- **Compliance service updated** to check for both specific and general consent
- **Consent creation** handles General Medical consent without organization
- **Compliance check logic**:
  ```sql
  -- Check for either:
  -- 1. Specific organization consent
  -- 2. General Medical consent + user's org is General Medical
  ```

## User Experience

### **Creating General Medical Consent**
1. Select **Patient**: John Doe
2. Select **Consent Type**: "General Medical"
3. **Organization dropdown becomes disabled** and shows:
   - Greyed out appearance
   - Message: "(Not required for General Medical)"
   - Helper text: "✓ This consent will apply to all General Medical organizations"
4. Set consent date and optional expiry
5. Submit

### **Compliance Check**
- **Any user** from **any General Medical organization** can access the patient
- **No need** to create separate consents for each General Medical organization
- **Audit trail** shows "Valid general consent on file: General Medical"

## Benefits

✅ **Simplified consent management** - one consent covers all General Medical orgs
✅ **Reduced workload** - no need to create multiple consents
✅ **Logical consistency** - General Medical consent applies generally
✅ **Maintains security** - other compliance groups still require specific consent
✅ **HIPAA compliant** - proper audit trail and patient control

## Technical Implementation

### **Database Schema**
```sql
-- organization_id can be NULL for General Medical
ALTER TABLE consents ALTER COLUMN organization_id DROP NOT NULL;

-- Constraint: only General Medical can have NULL organization_id
ALTER TABLE consents ADD CONSTRAINT check_org_required 
CHECK (
  (consent_type = 'General Medical' AND organization_id IS NULL) OR
  (consent_type != 'General Medical' AND organization_id IS NOT NULL)
);
```

### **Compliance Check Query**
```sql
SELECT * FROM consents 
WHERE patient_id = $1 
AND is_active = true
AND (
  -- Specific organization consent
  organization_id = $2
  OR
  -- General Medical consent (applies to all General Medical organizations)
  (consent_type = 'General Medical' AND organization_id IS NULL 
   AND EXISTS (
     SELECT 1 FROM organizations o 
     JOIN compliance_groups cg ON o.compliance_group_id = cg.id
     WHERE o.id = $2 AND cg.name = 'General Medical'
   ))
)
```

### **Consent Creation Logic**
```typescript
// For General Medical consent
if (consentType === 'General Medical') {
  // organization_id = NULL
  // specific_organization_id = NULL
}

// For other consent types
// organization_id = required
// specific_organization_id = optional (for org-specific groups)
```

## Migration

### **Automatic Migration**
The system automatically:
1. **Makes organization_id nullable**
2. **Adds constraint** to ensure only General Medical can be NULL
3. **Updates existing General Medical consents** to have NULL organization_id
4. **Tests the new system** with sample data

### **Manual Migration (if needed)**
```bash
npm run implement:general-consent
```

## Testing

### **Test Scenarios**
1. **Create General Medical consent** - should not require organization
2. **Create Legal consent** - should require organization
3. **Compliance check** - General Medical org should pass with general consent
4. **Compliance check** - Legal org should fail without specific consent

### **Expected Results**
- ✅ General Medical consent creation works without organization
- ✅ Other consent types still require organization
- ✅ General Medical organizations can access patients with general consent
- ✅ Non-General Medical organizations still need specific consent

## Rollback Plan

If issues arise, the system can be rolled back by:
1. **Removing the constraint**
2. **Updating General Medical consents** to have organization_id
3. **Making organization_id NOT NULL again**

However, this would require manual intervention and data cleanup.

## Future Enhancements

Potential improvements:
- **Bulk consent management** for multiple patients
- **Consent templates** for common scenarios
- **Consent expiration notifications**
- **Consent analytics** and reporting
