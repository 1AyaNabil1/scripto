"""
Custom JWT-based authentication provider implementation.
This wraps the existing AuthService to conform to the AuthProvider interface.
"""
from typing import Optional, Dict, Any, Tuple
from .base import AuthProvider
from .auth_service import AuthService
from src.repositories.database import db_service


class CustomAuthProvider(AuthProvider):
    """Custom JWT authentication provider using MySQL database."""
    
    def __init__(self):
        self.auth_service = AuthService
        self.db = db_service
    
    async def register(self, email: str, password: str, name: str, device_id: Optional[str] = None) -> Tuple[Dict[str, Any], Dict[str, str]]:
        """Register a new user."""
        # Hash password
        hashed_password = self.auth_service.hash_password(password)
        
        # Create user in database
        user_id = await self.db.create_user(email, hashed_password, name, device_id)
        
        # Generate tokens
        tokens = self.auth_service.generate_tokens(user_id, email)
        
        # Get user data
        user_data = await self.db.get_user_by_id(user_id)
        
        return user_data, tokens
    
    async def login(self, email: str, password: str) -> Tuple[Dict[str, Any], Dict[str, str]]:
        """Authenticate a user."""
        # Get user from database
        user = await self.db.get_user_by_email(email)
        if not user:
            raise ValueError("Invalid credentials")
        
        # Verify password
        if not self.auth_service.verify_password(password, user['password']):
            raise ValueError("Invalid credentials")
        
        # Generate tokens
        tokens = self.auth_service.generate_tokens(user['id'], email)
        
        # Remove password from user data
        user_data = {k: v for k, v in user.items() if k != 'password'}
        
        return user_data, tokens
    
    async def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode an access token."""
        try:
            payload = self.auth_service.verify_token(token, 'access')
            return payload
        except Exception:
            return None
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, str]:
        """Generate new access token from refresh token."""
        # Verify refresh token
        payload = self.auth_service.verify_token(refresh_token, 'refresh')
        
        # Generate new tokens
        tokens = self.auth_service.generate_tokens(payload['user_id'], payload['email'])
        
        return tokens
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user data by user ID."""
        user = await self.db.get_user_by_id(user_id)
        if user:
            # Remove password from user data
            return {k: v for k, v in user.items() if k != 'password'}
        return None
    
    async def update_user(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile."""
        # Don't allow password updates through this method
        if 'password' in updates:
            del updates['password']
        
        await self.db.update_user(user_id, updates)
        return await self.get_user_by_id(user_id)
    
    async def request_password_reset(self, email: str) -> str:
        """Generate password reset token."""
        # Verify user exists
        user = await self.db.get_user_by_email(email)
        if not user:
            raise ValueError("User not found")
        
        # Generate reset token
        token = self.auth_service.generate_password_reset_token(email)
        
        # Store token in database
        await self.db.create_password_reset_token(user['id'], token)
        
        return token
    
    async def reset_password(self, token: str, new_password: str) -> bool:
        """Reset user password using token."""
        try:
            # Verify token and get email
            email = self.auth_service.verify_password_reset_token(token)
            
            # Get user
            user = await self.db.get_user_by_email(email)
            if not user:
                return False
            
            # Hash new password
            hashed_password = self.auth_service.hash_password(new_password)
            
            # Update password
            await self.db.update_user(user['id'], {'password': hashed_password})
            
            # Invalidate reset token
            await self.db.delete_password_reset_token(token)
            
            return True
        except Exception:
            return False
