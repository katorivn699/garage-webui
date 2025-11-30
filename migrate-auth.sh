#!/bin/bash

# Migration script for Auth & Authorization upgrade
# This script helps migrate from old AUTH_USER_PASS to new user system

echo "==================================="
echo "Garage WebUI - Auth Upgrade Helper"
echo "==================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    touch .env
fi

# Prompt for admin password
read -sp "Enter password for admin account (default: admin): " ADMIN_PASS
echo ""

if [ -z "$ADMIN_PASS" ]; then
    ADMIN_PASS="admin"
fi

# Check if ADMIN_PASSWORD already exists in .env
if grep -q "ADMIN_PASSWORD=" .env; then
    echo "Updating ADMIN_PASSWORD in .env..."
    sed -i "s/^ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$ADMIN_PASS/" .env
else
    echo "Adding ADMIN_PASSWORD to .env..."
    echo "ADMIN_PASSWORD=$ADMIN_PASS" >> .env
fi

# Remove old AUTH_USER_PASS if exists
if grep -q "AUTH_USER_PASS=" .env; then
    echo "Removing deprecated AUTH_USER_PASS from .env..."
    sed -i '/^AUTH_USER_PASS=/d' .env
fi

echo ""
echo "✓ Environment configured successfully!"
echo ""
echo "Next steps:"
echo "1. Build and start the application"
echo "2. Login with username: admin and your password"
echo "3. Navigate to Users page to create additional users"
echo "4. Assign bucket permissions to users as needed"
echo ""
echo "Important: Keep your admin password secure!"
echo ""
