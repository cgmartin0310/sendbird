# Fix: Care Team Members Not Showing in Conversations

## The Problem
When you add care team members to a conversation, they don't appear in the chat because they lack **consent records** for the patient.

## Why This Happens
The system enforces HIPAA compliance by requiring consent before any user can access patient data:
- Each user must have their organization's consent for a patient
- Without consent, they're marked "non-compliant" and excluded from conversations
- Only compliant members are added to the Sendbird channel

## Quick Fix Steps

### 1. First, Create Patients (if needed)
In Render Backend Shell:
```bash
cd src
npm run create:test-patients
```

This creates 4 test patients:
- John Doe
- Jane Smith  
- Robert Johnson
- Maria Garcia

### 2. Check Current Consent Status
```bash
npm run check:consent
```

This shows which care team members have consent for which patients.

### 3. Auto-Create Consents
```bash
npm run create:consent
```

This automatically creates consent records for:
- All care team members
- All patients
- Using their organization's compliance group

### 4. Manual Consent Creation (Alternative)
1. Go to Admin → Consents in the UI
2. Click "Create New Consent"
3. Select patient and organization
4. Submit the form

## Understanding the Flow

1. **User Selection**: You select care team members when creating a conversation
2. **Compliance Check**: System checks if each user has consent for the patient
3. **Channel Creation**: Only compliant users are added to Sendbird channel
4. **Result**: Non-compliant users are tracked but can't participate

## Verification

After creating consents:
1. Create a new conversation
2. Add care team members
3. They should now appear in the chat!

## Common Issues

### "No patients in dropdown"
Run: `npm run create:test-patients`

### "Care team member not showing in chat"
Run: `npm run create:consent`

### "No organizations available"
Ensure care team members are assigned to organizations

## Technical Details

The compliance check queries:
```sql
SELECT * FROM consents 
WHERE patient_id = ? 
  AND organization_id = ?
  AND is_active = true
  AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
```

Without a matching record, the user is excluded from the conversation.