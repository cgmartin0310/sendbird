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

echo "Build complete!" 