"""
JWT authentication utilities for user authentication.
Provides token generation, validation, and password hashing functionality.
"""
import jwt
import bcrypt
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from src.config.settings import Config
from src.models import ValidationError


class AuthService:
    """Service for handling authentication operations"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    @staticmethod
    def generate_tokens(user_id: str, email: str) -> Dict[str, Any]:
        """Generate access and refresh tokens for a user"""
        now = datetime.now(timezone.utc)
        
        # Access token (expires in 1 hour)
        access_payload = {
            'user_id': user_id,
            'email': email,
            'exp': now + timedelta(hours=1),
            'iat': now,
            'type': 'access'
        }
        
        # Refresh token (expires in 7 days)
        refresh_payload = {
            'user_id': user_id,
            'email': email,
            'exp': now + timedelta(days=7),
            'iat': now,
            'type': 'refresh'
        }
        
        access_token = jwt.encode(access_payload, Config.JWT_SECRET, algorithm='HS256')
        refresh_token = jwt.encode(refresh_payload, Config.JWT_SECRET, algorithm='HS256')
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'expires_in': 3600  # 1 hour in seconds
        }
    
    @staticmethod
    def verify_token(token: str, token_type: str = 'access') -> Dict[str, Any]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
            
            # Check token type
            if payload.get('type') != token_type:
                raise ValidationError(f"Invalid token type. Expected {token_type}")
            
            # Check expiration
            exp = payload.get('exp')
            if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
                raise ValidationError("Token has expired")
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise ValidationError("Token has expired")
        except jwt.InvalidTokenError:
            raise ValidationError("Invalid token")
    
    @staticmethod
    def generate_password_reset_token(email: str) -> str:
        """Generate a password reset token"""
        now = datetime.now(timezone.utc)
        payload = {
            'email': email,
            'exp': now + timedelta(hours=1),  # Reset token expires in 1 hour
            'iat': now,
            'type': 'password_reset'
        }
        return jwt.encode(payload, Config.JWT_SECRET, algorithm='HS256')
    
    @staticmethod
    def verify_password_reset_token(token: str) -> str:
        """Verify password reset token and return email"""
        payload = AuthService.verify_token(token, 'password_reset')
        return payload.get('email')
    
    @staticmethod
    def generate_verification_token(email: str) -> str:
        """Generate an email verification token"""
        now = datetime.now(timezone.utc)
        payload = {
            'email': email,
            'exp': now + timedelta(days=1),  # Verification token expires in 24 hours
            'iat': now,
            'type': 'email_verification'
        }
        return jwt.encode(payload, Config.JWT_SECRET, algorithm='HS256')
    
    @staticmethod
    def verify_email_verification_token(token: str) -> str:
        """Verify email verification token and return email"""
        payload = AuthService.verify_token(token, 'email_verification')
        return payload.get('email')


def extract_token_from_header(authorization_header: Optional[str]) -> Optional[str]:
    """Extract JWT token from Authorization header"""
    if not authorization_header:
        return None
    
    parts = authorization_header.split(' ')
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None
    
    return parts[1]


def require_auth(func):
    """Decorator to require authentication for an endpoint"""
    def wrapper(*args, **kwargs):
        from azure.functions import HttpRequest
        req = args[0] if args and isinstance(args[0], HttpRequest) else None
        
        if not req:
            raise ValidationError("Invalid request object")
        
        # Extract token from Authorization header
        auth_header = req.headers.get('Authorization')
        token = extract_token_from_header(auth_header)
        
        if not token:
            raise ValidationError("Authorization token required")
        
        # Verify token
        try:
            payload = AuthService.verify_token(token, 'access')
            # Add user info to request for use in handler
            req.user_id = payload.get('user_id')
            req.user_email = payload.get('email')
        except ValidationError as e:
            raise ValidationError(str(e))
        
        return func(*args, **kwargs)
    
    return wrapper
