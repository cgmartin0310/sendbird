# Compliance Groups Guide

## Overview

The healthcare messaging system now supports 5 distinct compliance groups that determine how patient information can be shared between organizations. Each organization is assigned to one compliance group, which defines the consent requirements for that organization.

## The 5 Compliance Groups

### 1. General Medical
- **Description**: Standard HIPAA compliance for general medical records
- **Consent Required**: Yes
- **Organization-Specific**: No
- **Use Case**: Regular healthcare providers, clinics, hospitals

### 2. Interagency
- **Description**: For government and interagency communications
- **Consent Required**: No
- **Organization-Specific**: N/A
- **Use Case**: Government agencies, public health departments

### 3. Legal
- **Description**: For legal and court-ordered disclosures
- **Consent Required**: Yes
- **Organization-Specific**: Yes (consent needed for each specific organization)
- **Use Case**: Law firms, courts, legal departments

### 4. Other
- **Description**: For special circumstances
- **Consent Required**: Yes
- **Organization-Specific**: Yes (consent needed for each specific organization)
- **Use Case**: Research organizations, special programs

### 5. SUD Notes
- **Description**: Substance Use Disorder records (42 CFR Part 2)
- **Consent Required**: Yes
- **Organization-Specific**: Yes (consent needed for each specific organization)
- **Use Case**: Addiction treatment centers, substance abuse programs

## How It Works

### Organization Setup
1. When creating an organization, select the appropriate compliance group
2. The compliance group determines what consent requirements apply

### Consent Creation
1. Select a patient and their organization
2. The system automatically determines the compliance requirements based on the organization's compliance group
3. For groups requiring organization-specific consent (Legal, Other, SUD Notes):
   - You must specify which organization the patient is consenting to share data with
4. Upload scanned consent documents as attachments

### Conversation Access
- **Interagency**: No consent needed, automatic access
- **General Medical**: One general consent covers all communications
- **Legal/Other/SUD Notes**: Specific consent needed for each organization

## Setup Instructions

### Initial Setup (Run Once)
```bash
# Set up the 5 compliance groups
npm run setup:compliance-groups

# Add consent attachment support
npm run add:consent-attachments
```

### Creating Organizations
1. Go to Admin → Organization Management
2. Click "New Organization"
3. Enter organization name
4. Select the appropriate compliance group
5. Click "Create"

### Creating Consents
1. Go to Admin → Consent Management
2. Click "New Consent"
3. Select patient and their organization
4. The compliance group will be displayed automatically
5. If required, select the specific organization to share with
6. Upload consent document (optional but recommended)
7. Click "Create Consent"

## Important Notes

- Interagency organizations can communicate without patient consent
- Legal, Other, and SUD Notes require individual consent for EACH organization
- General Medical requires only one consent that covers the compliance group
- Always upload scanned consent documents for audit trail
- Consents can be revoked at any time

## File Upload Requirements

- Accepted formats: PDF, JPG, PNG, GIF, DOC, DOCX
- Maximum file size: 10MB
- Files are stored securely on the server
- Only authorized users can download consent attachments