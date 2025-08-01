# Healthcare Messaging Microservice

A secure messaging microservice for healthcare teams managing at-risk patients, built with TypeScript, Express, PostgreSQL, and Sendbird.

## Features

- **Secure Messaging**: Real-time messaging through Sendbird platform
- **Compliance Management**: Consent-based access control for HIPAA compliance
- **Multi-Channel Support**: Internal messaging and SMS for external users
- **Care Team Coordination**: Organize care teams around patients
- **Role-Based Access**: Different permissions for peer support specialists, care team members, and admins

## Architecture

This microservice handles:
- User authentication and authorization
- Patient and care team management
- Conversation creation with compliance checking
- Integration with Sendbird for messaging
- SMS messaging for external users (via Sendbird SMS)

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+
- Sendbird account with SMS capabilities enabled
- Render account for deployment

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd sendbird
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit `.env` with your values:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/messaging_db

# JWT Configuration
JWT_SECRET=your-secure-secret-key-here
JWT_EXPIRES_IN=7d

# Sendbird Configuration
SENDBIRD_APP_ID=your-sendbird-app-id
SENDBIRD_API_TOKEN=your-sendbird-api-token

# Logging
LOG_LEVEL=info
```

### 4. Set Up Database

Create a PostgreSQL database:

```bash
createdb messaging_db
```

Run migrations:

```bash
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile

### Conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations` - List user's conversations
- `GET /api/conversations/:id` - Get conversation details
- `POST /api/conversations/send-message` - Send message

### Patients
- `POST /api/patients` - Create patient
- `GET /api/patients` - List patients
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient

### Organizations & Compliance
- `POST /api/organizations` - Create organization
- `GET /api/organizations` - List organizations
- `POST /api/compliance-groups` - Create compliance group
- `POST /api/consents` - Create consent record
- `GET /api/patients/:patientId/consents` - Get patient consents

### Care Teams
- `POST /api/care-teams` - Create care team
- `GET /api/patients/:patientId/care-team` - Get patient's care team
- `POST /api/care-teams/:id/members` - Add care team member

## Deployment to Render

### 1. Prepare for Deployment

1. Push your code to GitHub
2. Create a PostgreSQL database on Render

### 2. Configure Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure build and start commands:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

### 3. Set Environment Variables

Add all environment variables from your `.env` file to Render's environment variables section.

### 4. Configure Sendbird

1. Enable SMS in your Sendbird dashboard
2. Configure SMS settings for external user messaging
3. Set up webhooks for incoming SMS (optional)

## Usage Example

### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "peer.support@example.com",
    "password": "secure123",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "peer_support"
  }'
```

### 2. Create a Patient

```bash
curl -X POST http://localhost:3000/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Smith",
    "riskLevel": "high"
  }'
```

### 3. Create a Conversation

```bash
curl -X POST http://localhost:3000/api/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "John Smith Care Coordination",
    "patientId": 1,
    "memberIds": [2, 3],
    "externalMembers": [{
      "phoneNumber": "+1234567890",
      "name": "Dr. External"
    }]
  }'
```

## Security Considerations

- All API endpoints except auth routes require JWT authentication
- Compliance checks ensure only authorized organizations can access patient conversations
- External SMS users have limited access through Sendbird's SMS bridge
- Passwords are hashed using bcrypt
- Environment variables should be kept secure

## Testing

Run the development server and use tools like Postman or curl to test the API endpoints.

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

[Your License Here] 