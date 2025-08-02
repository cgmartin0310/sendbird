#!/bin/bash

# API Testing Script for Sendbird Healthcare Messaging

API_URL="https://sendbird-messaging-api.onrender.com/api"
TOKEN=""

echo "🏥 Sendbird Healthcare Messaging API Test Script"
echo "================================================"

# Function to pretty print JSON
pretty_json() {
    python3 -m json.tool 2>/dev/null || cat
}

# 1. Register a test user
echo -e "\n1️⃣  Registering a test user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@healthcare.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "peer_support"
  }')

echo "$REGISTER_RESPONSE" | pretty_json

# Extract token from response
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to register user. Check if user already exists."
    echo "Trying to login instead..."
    
    # Try logging in
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test.user@healthcare.com",
        "password": "SecurePass123!"
      }')
    
    echo "$LOGIN_RESPONSE" | pretty_json
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
fi

if [ -n "$TOKEN" ]; then
    echo -e "\n✅ Authentication successful!"
    echo "Token: ${TOKEN:0:20}..."
else
    echo "❌ Authentication failed. Exiting."
    exit 1
fi

# 2. Get user profile
echo -e "\n2️⃣  Getting user profile..."
curl -s -X GET "$API_URL/auth/profile" \
  -H "Authorization: Bearer $TOKEN" | pretty_json

# 3. Create an organization (if admin)
echo -e "\n3️⃣  Creating a test organization..."
ORG_RESPONSE=$(curl -s -X POST "$API_URL/organizations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Healthcare Center"
  }')

echo "$ORG_RESPONSE" | pretty_json

# 4. Create a patient
echo -e "\n4️⃣  Creating a test patient..."
PATIENT_RESPONSE=$(curl -s -X POST "$API_URL/patients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1980-01-15",
    "medicalRecordNumber": "MRN123456",
    "riskLevel": "high"
  }')

echo "$PATIENT_RESPONSE" | pretty_json

# 5. List patients
echo -e "\n5️⃣  Listing patients..."
curl -s -X GET "$API_URL/patients" \
  -H "Authorization: Bearer $TOKEN" | pretty_json

# 6. Create another user for conversation
echo -e "\n6️⃣  Creating a care team member..."
curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "care.team@healthcare.com",
    "password": "SecurePass123!",
    "firstName": "Care",
    "lastName": "TeamMember",
    "role": "care_team_member"
  }' | pretty_json

echo -e "\n✨ Basic setup complete!"
echo -e "\nNext steps:"
echo "1. Create consents for organizations"
echo "2. Create conversations with team members"
echo "3. Test messaging through Sendbird"
echo -e "\nSaved authentication token for future use."
echo "TOKEN=$TOKEN" > .test-token

echo -e "\n📚 Check API.md for full endpoint documentation" 