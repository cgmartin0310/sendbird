#!/bin/bash

echo "Starting build process..."

# Install all dependencies including devDependencies
echo "Installing dependencies..."
npm install --include=dev

# Build TypeScript
echo "Building TypeScript..."
npm run build

# Run database migrations
echo "Running database migrations..."
npm run db:migrate

echo "Adding unique constraints..."
npm run add:unique-constraints || echo "Constraints update skipped"

echo "Setting up initial compliance data..."
npm run setup:compliance || echo "Compliance setup skipped (may already exist)"

echo "Updating test user to admin role..."
npm run update:test-user-admin || echo "User update skipped"

echo "Setting up compliance groups..."
npm run setup:compliance-groups || echo "Compliance groups setup skipped"

echo "Ensuring Interagency group exists..."
npm run fix:interagency || echo "Interagency group fix skipped"

echo "Implementing General Medical consent system..."
npm run implement:general-consent || echo "General consent implementation skipped"

echo "Adding consent attachment support..."
npm run add:consent-attachments || echo "Consent attachment support skipped"

echo "Adding created_by column to consents table..."
npm run add:created-by-column || echo "Created_by column addition skipped"

echo "Syncing users with Sendbird..."
npm run sync:sendbird-users || echo "Sendbird user sync skipped"

echo "Build complete!" 