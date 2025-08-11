# Simplified Consent Types System

## Overview

The consent types now directly mirror the compliance groups for clarity and consistency. This makes it easier to understand which consent type to use for each organization.

## Consent Types (Matching Compliance Groups)

### 1. **General Medical**
- **Purpose**: Standard HIPAA compliance for general medical records
- **When to use**: For regular healthcare providers, clinics, hospitals
- **Scope**: Once given, applies to all staff in the organization
- **Example**: Patient gives "General Medical" consent to City Hospital

### 2. **Legal**
- **Purpose**: Court-ordered or legal disclosures
- **When to use**: For law firms, courts, legal departments
- **Scope**: Organization-specific - must specify which legal entity can access
- **Example**: Patient gives "Legal" consent specifically for Law Firm ABC

### 3. **Other**
- **Purpose**: Special circumstances and research
- **When to use**: For research organizations, special programs
- **Scope**: Organization-specific - must specify which organization can access
- **Example**: Patient gives "Other" consent specifically for University Research Lab

### 4. **SUD Notes**
- **Purpose**: Substance Use Disorder records (42 CFR Part 2 protected)
- **When to use**: For addiction treatment centers, substance abuse programs
- **Scope**: Organization-specific - must specify which organization can access
- **Example**: Patient gives "SUD Notes" consent specifically for partnering Hospital B

## How It Works

1. **Organization's Compliance Group determines the rules**:
   - General Medical: Needs consent, applies org-wide
   - Interagency: No consent needed
   - Legal/Other/SUD Notes: Needs org-specific consent

2. **Consent Type matches the Compliance Group**:
   - This creates a clear 1:1 mapping
   - Reduces confusion about which consent type to select
   - The consent type now directly indicates the regulatory framework

## Benefits of This Approach

✅ **Clarity**: Consent type immediately tells you the compliance context
✅ **Consistency**: No confusion between arbitrary consent types and compliance requirements  
✅ **Audit Trail**: Clear documentation of which regulatory framework applies
✅ **Simplicity**: Staff only need to remember one set of categories

## Examples

### Scenario 1: General Hospital
- **Organization Compliance Group**: General Medical
- **Consent Type Used**: General Medical
- **Result**: All hospital staff can communicate about this patient

### Scenario 2: Addiction Treatment Center  
- **Organization Compliance Group**: SUD Notes
- **Consent Type Used**: SUD Notes (specific to requesting organization)
- **Result**: Only the specified organization can access these protected records

### Scenario 3: Law Firm
- **Organization Compliance Group**: Legal
- **Consent Type Used**: Legal (specific to this law firm)
- **Result**: Only this specific law firm can access patient information

## Database Storage

The consent is stored with:
- `patient_id`: The patient giving consent
- `organization_id`: The patient's primary organization
- `consent_type`: Now matches the compliance group name
- `specific_organization_id`: For Legal/Other/SUD Notes, the org being granted access

## Creating Consents

1. Navigate to **Admin → Consents**
2. Select the **patient** and their **organization**
3. The **consent type** now directly corresponds to the compliance group
4. For org-specific types (Legal, Other, SUD Notes), select the specific organization
5. Set consent date and optional expiry
6. Optionally attach supporting documentation

## Migration Note

Existing consents with old types (HIPAA Authorization, Treatment Consent, etc.) will continue to work. New consents should use the simplified types that match compliance groups.
