# Interagency Compliance Group

## Issue
The "Interagency" compliance group may be missing from your database. This is one of the 5 standard compliance groups that should exist.

## What is Interagency?
The **Interagency** compliance group is designed for government agencies and public health organizations that have special legal authority to access patient information WITHOUT requiring individual patient consent. This includes:

- Government health departments
- CDC/FDA
- Public health agencies  
- Emergency response teams
- Law enforcement (in specific circumstances)

**Key Feature**: Organizations in the Interagency group can message about patients WITHOUT needing consent.

## The 5 Standard Compliance Groups

| Group | Consent Required | Organization-Specific | Typical Use |
|-------|-----------------|----------------------|-------------|
| **General Medical** | ✅ Yes | ❌ No | Hospitals, clinics |
| **Interagency** | ❌ **No** | N/A | Government agencies |
| **Legal** | ✅ Yes | ✅ Yes | Law firms, courts |
| **Other** | ✅ Yes | ✅ Yes | Research, special programs |
| **SUD Notes** | ✅ Yes | ✅ Yes | Addiction treatment (42 CFR Part 2) |

## How to Check if Interagency Exists

Run this command to see what compliance groups are in your database:
```bash
npm run check:compliance-groups
```

## How to Add Interagency Group

If the Interagency group is missing, run:
```bash
npm run fix:interagency
```

This will:
1. Add the Interagency compliance group to your database
2. Set it to NOT require consent
3. Allow government agencies to be assigned to this group

## Assigning an Organization to Interagency

1. Go to **Admin → Organizations**
2. Create a new organization (e.g., "Health Department")
3. Select **"Interagency"** as the Compliance Group
4. Save

Now users from that organization can:
- Create conversations about any patient
- No consent checks will be performed
- Immediate access for public health/emergency purposes

## Important Notes

⚠️ **Security Warning**: Only assign truly authorized government agencies to the Interagency group, as it bypasses all consent requirements.

✅ **Automatic Setup**: The Interagency group is now included in the build script and will be created automatically on new deployments.

## Consent Type Clarification

When creating consents, you'll see these options:
- General Medical
- Legal  
- Other
- SUD Notes

**You will NOT see "Interagency"** as a consent type because Interagency organizations don't need consent at all. The consent form correctly excludes this option.
