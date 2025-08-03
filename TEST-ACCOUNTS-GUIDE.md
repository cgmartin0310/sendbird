# Test Accounts Guide

## Available Test Accounts

All test accounts use the password: `SecurePass123!`

### 1. Admin Account
- **Email**: `admin@healthcare.com`
- **Role**: Admin
- **Permissions**: 
  - Manage users, organizations, consents
  - Create conversations (after latest update)
  - Access admin dashboard
  - View all data

### 2. Care Team Member (Doctor)
- **Email**: `doctor@healthcare.com`
- **Role**: Care Team Member
- **Permissions**:
  - Create and participate in conversations
  - View patient data
  - Send messages
  - Full clinical access

### 3. Care Team Member (Nurse)
- **Email**: `nurse@healthcare.com`
- **Role**: Care Team Member
- **Permissions**:
  - Create and participate in conversations
  - View patient data
  - Send messages
  - Full clinical access

### 4. Peer Support
- **Email**: `peer@healthcare.com`
- **Role**: Peer Support
- **Permissions**:
  - Create and participate in conversations
  - Limited patient data access
  - Create patients
  - Support role access

### 5. Original Test User
- **Email**: `test.user@healthcare.com`
- **Role**: Admin (upgraded from peer_support)
- **Permissions**: Same as admin account

## Usage Recommendations

### For Testing Conversations:
- Use **doctor@healthcare.com** or **nurse@healthcare.com** for full healthcare provider experience
- Use **peer@healthcare.com** for testing peer support scenarios

### For Admin Tasks:
- Use **admin@healthcare.com** for admin panel access
- Can now also create conversations after recent update

### For Testing Compliance:
- Different organizations have different compliance groups
- Interagency: No consent needed
- General Medical: Standard consent
- Legal/Other/SUD: Organization-specific consent required

## Quick Login Links

After deployment, you can access:
- Login: `https://sendbird-diqt.onrender.com/login`
- Admin Panel: `https://sendbird-diqt.onrender.com/admin` (admin accounts only)

## Notes
- All accounts are associated with "Test Healthcare Organization"
- Patients can be created by peer_support or admin roles
- Conversations require at least one patient to be selected