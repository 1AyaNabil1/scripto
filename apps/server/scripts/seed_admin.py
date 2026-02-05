#!/usr/bin/env python3
"""
Admin user seed script for Scripto.
Creates the initial admin account with full privileges.

Usage:
    cd apps/server
    source .venv/bin/activate
    python scripts/seed_admin.py
"""
import sys
import os
import uuid
import json
from datetime import datetime, date, timezone

# Add the parent directory to the path so we can import from src
server_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, server_dir)

# Load environment variables from local.settings.json
local_settings_path = os.path.join(server_dir, 'local.settings.json')
if os.path.exists(local_settings_path):
    with open(local_settings_path, 'r') as f:
        settings = json.load(f)
        for key, value in settings.get('Values', {}).items():
            os.environ[key] = str(value)
    print(f"✅ Loaded settings from {local_settings_path}")
else:
    print(f"⚠️  Warning: {local_settings_path} not found, using environment variables")

from src.core.auth.auth_service import AuthService
from src.repositories.database import db_service

# Admin account credentials
ADMIN_EMAIL = "admin@scripto.com"
ADMIN_PASSWORD = "admin123!"
ADMIN_NAME = "Admin"


def create_admin_user():
    """Create the admin user if it doesn't exist"""
    print(f"🔐 Checking for existing admin user: {ADMIN_EMAIL}")
    
    # Check if admin already exists
    existing_user = db_service.get_user_by_email(ADMIN_EMAIL)
    
    if existing_user:
        if existing_user.is_admin:
            print(f"✅ Admin user already exists: {ADMIN_EMAIL}")
            print(f"   User ID: {existing_user.id}")
            print(f"   Role: {existing_user.role}")
            return existing_user
        else:
            # Update existing user to admin
            print(f"📝 Updating existing user to admin: {ADMIN_EMAIL}")
            updated_user = db_service.update_user_admin_status(
                existing_user.id, 
                is_admin=True, 
                role='superadmin'
            )
            print("✅ User upgraded to superadmin!")
            return updated_user
    
    # Create new admin user
    print(f"🆕 Creating new admin user: {ADMIN_EMAIL}")
    
    # Hash password
    hashed_password = AuthService.hash_password(ADMIN_PASSWORD)
    
    # Generate user ID
    user_id = str(uuid.uuid4())
    
    # Prepare admin user data
    admin_data = {
        "id": user_id,
        "name": ADMIN_NAME,
        "email": ADMIN_EMAIL,
        "password": hashed_password,
        "createdAt": datetime.now(timezone.utc),
        "dailyUsageCount": 0,
        "lastUsageDate": date.today(),
        "isEmailVerified": True,  # Admin is pre-verified
        "isAdmin": True,
        "role": "superadmin"  # Highest privilege level
    }
    
    # Create admin user in database
    new_admin = db_service.create_admin_user(admin_data)
    
    print("✅ Admin user created successfully!")
    print(f"   Email: {ADMIN_EMAIL}")
    print(f"   Password: {ADMIN_PASSWORD}")
    print(f"   User ID: {new_admin.id}")
    print(f"   Role: {new_admin.role}")
    print("\n🔑 Admin Privileges:")
    print("   ✓ Unlimited storyboard creation")
    print("   ✓ View all users and their stories")
    print("   ✓ Delete/add stories to gallery")
    print("   ✓ Manage user accounts")
    print("   ✓ Access admin dashboard")
    
    return new_admin


def main():
    print("=" * 50)
    print("🎬 Scripto Admin User Setup")
    print("=" * 50)
    print()
    
    try:
        create_admin_user()
        print()
        print("=" * 50)
        print("✅ Setup complete!")
        print("=" * 50)
        print()
        print("You can now login with:")
        print(f"   Email: {ADMIN_EMAIL}")
        print(f"   Password: {ADMIN_PASSWORD}")
        print()
        print("⚠️  IMPORTANT: Change the admin password after first login!")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
