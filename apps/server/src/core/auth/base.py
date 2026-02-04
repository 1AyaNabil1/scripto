"""
Base authentication provider interface for easy provider switching.
This abstraction allows switching between different auth providers (custom JWT, Auth0, Supabase, etc.)
with minimal code changes.
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, Tuple


class AuthProvider(ABC):
    """Abstract base class for authentication providers."""
    
    @abstractmethod
    async def register(self, email: str, password: str, name: str, device_id: Optional[str] = None) -> Tuple[Dict[str, Any], Dict[str, str]]:
        """
        Register a new user.
        
        Args:
            email: User's email address
            password: User's password
            name: User's display name
            device_id: Optional device identifier
            
        Returns:
            Tuple of (user_data, tokens) where tokens contain access_token and refresh_token
        """
        pass
    
    @abstractmethod
    async def login(self, email: str, password: str) -> Tuple[Dict[str, Any], Dict[str, str]]:
        """
        Authenticate a user.
        
        Args:
            email: User's email address
            password: User's password
            
        Returns:
            Tuple of (user_data, tokens) where tokens contain access_token and refresh_token
        """
        pass
    
    @abstractmethod
    async def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify and decode an access token.
        
        Args:
            token: JWT access token
            
        Returns:
            Decoded token payload if valid, None otherwise
        """
        pass
    
    @abstractmethod
    async def refresh_token(self, refresh_token: str) -> Dict[str, str]:
        """
        Generate new access token from refresh token.
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            New tokens dict with access_token and refresh_token
        """
        pass
    
    @abstractmethod
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user data by user ID.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            User data dict if found, None otherwise
        """
        pass
    
    @abstractmethod
    async def update_user(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update user profile.
        
        Args:
            user_id: Unique user identifier
            updates: Dictionary of fields to update
            
        Returns:
            Updated user data
        """
        pass
    
    @abstractmethod
    async def request_password_reset(self, email: str) -> str:
        """
        Generate password reset token.
        
        Args:
            email: User's email address
            
        Returns:
            Password reset token
        """
        pass
    
    @abstractmethod
    async def reset_password(self, token: str, new_password: str) -> bool:
        """
        Reset user password using token.
        
        Args:
            token: Password reset token
            new_password: New password
            
        Returns:
            True if successful, False otherwise
        """
        pass
