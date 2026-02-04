#!/bin/bash

# Scripto - Quick Setup Script for Local Development
# This script helps you set up the backend quickly without Azure resources

set -e

echo "🚀 Scripto Backend Quick Setup"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if MySQL is installed
echo "📦 Checking dependencies..."
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}MySQL not found. Installing via Homebrew...${NC}"
    brew install mysql
    brew services start mysql
else
    echo -e "${GREEN}✓ MySQL found${NC}"
fi

# Check if local.settings.json exists
if [ ! -f "apps/server/local.settings.json" ]; then
    echo -e "${YELLOW}⚠ local.settings.json not found. Creating from template...${NC}"
    cp apps/server/local.settings.json.example apps/server/local.settings.json
    echo -e "${GREEN}✓ Created local.settings.json${NC}"
    echo -e "${YELLOW}⚠ Please edit apps/server/local.settings.json with your values${NC}"
fi

# Create database
echo ""
echo "🗄️  Setting up database..."
read -p "Enter MySQL root password (press Enter if no password): " -s MYSQL_PASSWORD
echo ""

if [ -z "$MYSQL_PASSWORD" ]; then
    mysql -u root -e "CREATE DATABASE IF NOT EXISTS scripto;" 2>/dev/null || {
        echo -e "${RED}✗ Failed to create database. Please create it manually.${NC}"
        exit 1
    }
    mysql -u root scripto < apps/server/db/database_schema.sql 2>/dev/null || {
        echo -e "${RED}✗ Failed to import schema${NC}"
        exit 1
    }
else
    mysql -u root -p"$MYSQL_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS scripto;" 2>/dev/null || {
        echo -e "${RED}✗ Failed to create database. Please create it manually.${NC}"
        exit 1
    }
    mysql -u root -p"$MYSQL_PASSWORD" scripto < apps/server/db/database_schema.sql 2>/dev/null || {
        echo -e "${RED}✗ Failed to import schema${NC}"
        exit 1
    }
fi

echo -e "${GREEN}✓ Database created and schema imported${NC}"

# Generate JWT secret
echo ""
echo "🔐 Generating JWT secret..."
JWT_SECRET=$(openssl rand -base64 48)
echo -e "${GREEN}✓ Generated JWT secret${NC}"

# Update local.settings.json with JWT secret
if command -v jq &> /dev/null; then
    jq --arg jwt "$JWT_SECRET" '.Values.JWT_SECRET = $jwt' apps/server/local.settings.json > apps/server/local.settings.json.tmp
    mv apps/server/local.settings.json.tmp apps/server/local.settings.json
    echo -e "${GREEN}✓ Updated JWT secret in local.settings.json${NC}"
else
    echo -e "${YELLOW}⚠ jq not found. Please manually update JWT_SECRET in local.settings.json to:${NC}"
    echo "$JWT_SECRET"
fi

# Setup Python venv
echo ""
echo "🐍 Setting up Python virtual environment..."
cd apps/server
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo -e "${GREEN}✓ Created virtual environment${NC}"
fi

source .venv/bin/activate
pip install -q -r requirements.txt
echo -e "${GREEN}✓ Installed Python dependencies${NC}"

cd ../..

# Frontend setup
echo ""
echo "📦 Setting up frontend..."
cd apps/web
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Installed frontend dependencies${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi
cd ../..

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Edit apps/server/local.settings.json with your API keys"
echo "2. Update MySQL password if not using root without password"
echo ""
echo "🚀 To start the project:"
echo "   Terminal 1: cd apps/web && npm run dev"
echo "   Terminal 2: cd apps/server && source .venv/bin/activate && func start"
echo ""
echo "Or run: npm run dev:web (in one terminal) and npm run dev:server (in another)"
echo ""
