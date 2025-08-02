#!/bin/bash

# Conversation Testing Script

API_URL="https://sendbird-messaging-api.onrender.com/api"

# Load token from previous test
if [ -f .test-token ]; then
    source .test-token
else
    echo "❌ No token found. Run ./test-api.sh first"
    exit 1
fi

echo "🏥 Testing Conversations & Messaging"
echo "==================================="

# Function to pretty print JSON
pretty_json() {
    python3 -m json.tool 2>/dev/null || cat
}

# 1. Create a compliance group
echo -e "\n1️⃣  Creating compliance group..."
COMPLIANCE_GROUP=$(curl -s -X POST "$API_URL/compliance-groups" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HIPAA Compliant Group",
    "description": "Organizations requiring HIPAA compliance"
  }')

echo "$COMPLIANCE_GROUP" | pretty_json

# 2. Create organization with compliance group
echo -e "\n2️⃣  Creating organization with compliance..."
ORG_RESPONSE=$(curl -s -X POST "$API_URL/organizations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "City General Hospital",
    "complianceGroupId": 1
  }')

echo "$ORG_RESPONSE" | pretty_json

# 3. Create consent for patient
echo -e "\n3️⃣  Creating patient consent..."
CONSENT_RESPONSE=$(curl -s -X POST "$API_URL/consents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "organizationId": 1,
    "consentType": "treatment",
    "consentDate": "'$(date -u +%Y-%m-%d)'"
  }')

echo "$CONSENT_RESPONSE" | pretty_json

# 4. Create a conversation
echo -e "\n4️⃣  Creating a conversation..."
CONVERSATION_RESPONSE=$(curl -s -X POST "$API_URL/conversations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "John Doe - Care Coordination",
    "patientId": 1,
    "memberIds": [1, 2],
    "externalMembers": [
      {
        "phoneNumber": "+1234567890",
        "name": "Dr. External Smith"
      }
    ]
  }')

echo "$CONVERSATION_RESPONSE" | pretty_json

# Extract channel URL
CHANNEL_URL=$(echo "$CONVERSATION_RESPONSE" | grep -o '"sendbirdChannelUrl":"[^"]*' | grep -o '[^"]*$')

if [ -n "$CHANNEL_URL" ]; then
    echo -e "\n✅ Conversation created successfully!"
    echo "Channel URL: $CHANNEL_URL"
    
    # 5. Send a test message
    echo -e "\n5️⃣  Sending a test message..."
    MESSAGE_RESPONSE=$(curl -s -X POST "$API_URL/conversations/send-message" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "channelUrl": "'$CHANNEL_URL'",
        "message": "Hello team! This is a test message for patient John Doe."
      }')
    
    echo "$MESSAGE_RESPONSE" | pretty_json
fi

# 6. List conversations
echo -e "\n6️⃣  Listing all conversations..."
curl -s -X GET "$API_URL/conversations" \
  -H "Authorization: Bearer $TOKEN" | pretty_json

echo -e "\n✨ Conversation testing complete!"
echo -e "\n📱 Next steps:"
echo "1. Check your Sendbird dashboard to see the created channel"
echo "2. Use Sendbird UIKit or SDK to build a frontend"
echo "3. Test SMS functionality with real phone numbers"
echo "4. Monitor logs in Render dashboard" 