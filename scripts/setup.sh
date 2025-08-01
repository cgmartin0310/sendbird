#!/bin/bash

echo "Setting up Healthcare Messaging Microservice..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "Warning: PostgreSQL command line tools not found. Make sure PostgreSQL is installed."
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp env.example .env
    echo "Please edit .env with your configuration values"
fi

# Build TypeScript
echo "Building TypeScript..."
npm run build

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your configuration"
echo "2. Create a PostgreSQL database"
echo "3. Run 'npm run db:migrate' to set up the database"
echo "4. Run 'npm run dev' to start the development server" 