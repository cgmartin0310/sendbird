# API Documentation

Base URL: `http://localhost:3000/api`

## Authentication

Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "role": "peer_support", // or "care_team_member", "admin"
  "organizationId": 1 // optional
}

Response: 201 Created
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "peer_support",
    "organizationId": 1
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response: 200 OK
{
  "token": "jwt_token_here",
  "user": { ... }
}
```

## Conversations

### Create Conversation
```http
POST /conversations
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "Patient Care Coordination",
  "patientId": 1,
  "memberIds": [2, 3, 4],
  "externalMembers": [
    {
      "phoneNumber": "+1234567890",
      "name": "Dr. Smith"
    }
  ]
}

Response: 201 Created
{
  "conversationId": 1,
  "sendbirdChannelUrl": "sendbird_channel_12345",
  "compliantMembers": [
    {
      "userId": 2,
      "reason": "Valid consent on file"
    }
  ],
  "nonCompliantMembers": [
    {
      "userId": 4,
      "reason": "No active consent found for organization"
    }
  ],
  "externalMembers": [
    {
      "userId": 5,
      "phoneNumber": "+1234567890",
      "name": "Dr. Smith"
    }
  ]
}
```

### List Conversations
```http
GET /conversations
Authorization: Bearer YOUR_TOKEN

Response: 200 OK
{
  "conversations": [
    {
      "id": 1,
      "sendbird_channel_url": "sendbird_channel_12345",
      "title": "Patient Care Coordination",
      "created_at": "2024-01-15T10:00:00Z",
      "patient_id": 1,
      "patient_first_name": "John",
      "patient_last_name": "Doe",
      "is_compliant": true,
      "compliance_notes": "Valid consent on file"
    }
  ]
}
```

### Send Message
```http
POST /conversations/send-message
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "channelUrl": "sendbird_channel_12345",
  "message": "Hello team, patient update..."
}

Response: 200 OK
{
  "message": {
    "message_id": 123456,
    "message": "Hello team, patient update...",
    "created_at": 1642251600000
  }
}
```

## Patients

### Create Patient
```http
POST /patients
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1980-01-15",
  "medicalRecordNumber": "MRN123456",
  "riskLevel": "high" // "low", "medium", "high", "critical"
}

Response: 201 Created
{
  "patient": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1980-01-15",
    "medical_record_number": "MRN123456",
    "risk_level": "high",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

### List Patients
```http
GET /patients?limit=10&offset=0&search=john
Authorization: Bearer YOUR_TOKEN

Response: 200 OK
{
  "patients": [
    {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "risk_level": "high",
      "care_team_size": 3,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

## Organizations & Compliance

### Create Organization
```http
POST /organizations
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "City Hospital",
  "complianceGroupId": 1
}

Response: 201 Created
{
  "organization": {
    "id": 1,
    "name": "City Hospital",
    "compliance_group_id": 1,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

### Create Compliance Group
```http
POST /compliance-groups
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "HIPAA Compliant",
  "description": "Organizations requiring HIPAA compliance"
}

Response: 201 Created
{
  "complianceGroup": {
    "id": 1,
    "name": "HIPAA Compliant",
    "description": "Organizations requiring HIPAA compliance",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

### Create Consent
```http
POST /consents
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "patientId": 1,
  "organizationId": 1,
  "consentType": "treatment",
  "consentDate": "2024-01-15",
  "expiryDate": "2025-01-15" // optional
}

Response: 201 Created
{
  "consent": {
    "id": 1,
    "patient_id": 1,
    "organization_id": 1,
    "consent_type": "treatment",
    "consent_date": "2024-01-15",
    "expiry_date": "2025-01-15",
    "is_active": true,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

## Care Teams

### Create Care Team
```http
POST /care-teams
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "patientId": 1,
  "name": "Primary Care Team"
}

Response: 201 Created
{
  "careTeam": {
    "id": 1,
    "patient_id": 1,
    "name": "Primary Care Team",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

### Add Care Team Member
```http
POST /care-teams/1/members
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "userId": 2,
  "role": "Primary Physician"
}

Response: 201 Created
{
  "member": {
    "id": 1,
    "care_team_id": 1,
    "user_id": 2,
    "role": "Primary Physician",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message here"
}
```

Or for validation errors:
```json
{
  "errors": [
    {
      "msg": "First name is required",
      "param": "firstName",
      "location": "body"
    }
  ]
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error 