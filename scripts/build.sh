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

echo "Setting up initial compliance data..."
npm run setup:compliance || echo "Compliance setup skipped (may already exist)"

echo "Updating test user to admin role..."
npm run update:test-user-admin || echo "User update skipped"

echo "Build complete!" 