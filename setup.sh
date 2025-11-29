#!/bin/bash

echo "======================================"
echo "Mardeys Dashboard - Quick Setup Script"
echo "======================================"
echo ""

# Check for required commands
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Please install Node.js 18+"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual credentials before continuing!"
    echo ""
    read -p "Press Enter after you've configured .env file..."
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Copy frontend .env if needed
if [ ! -f .env ]; then
    echo "📝 Creating frontend .env file..."
    cp .env.example .env
fi

cd ..

echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Make sure MongoDB is running (local or cloud)"
echo "2. Update .env with your API credentials"
echo "3. Create an admin user (see README.md)"
echo ""
echo "To start development:"
echo "  npm run dev"
echo ""
echo "To start in production:"
echo "  npm run server    # Start backend"
echo "  npm run client    # Start frontend (in another terminal)"
echo ""
echo "Or use Docker:"
echo "  docker-compose up -d"
echo ""
echo "📖 Read README.md for complete documentation"
echo "======================================"
