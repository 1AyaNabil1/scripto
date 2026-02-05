"""
Authentication handlers for login, registration, and token management.
"""
import logging
import uuid
import re
from datetime import datetime, date
from typing import Dict, Any
import azure.functions as func
from src.models import User, ValidationError, NotFoundError
from src.repositories.database import db_service
from src.utils.helpers import (
    create_json_response,
    create_error_response,
    validate_json_request,
    validate_required_fields,
    error_handler,
    log_request
)
from .auth_service import AuthService, require_auth


class AuthHandler:
    """Handler for authentication requests"""
    
    @staticmethod
    def _validate_email(email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def _validate_password(password: str) -> bool:
        """Validate password strength"""
        # At least 8 characters, one uppercase, one lowercase, one digit
        if len(password) < 8:
            return False
        if not re.search(r'[A-Z]', password):
            return False
        if not re.search(r'[a-z]', password):
            return False
        if not re.search(r'\d', password):
            return False
        return True
    
    @staticmethod
    @error_handler
    @log_request
    def register(req: func.HttpRequest) -> func.HttpResponse:
        """Register a new user with email and password"""
        req_body = validate_json_request(req)
        
        # Validate required fields
        validate_required_fields(req_body, ['name', 'email', 'password'])
        
        name = req_body['name'].strip()
        email = req_body['email'].strip().lower()
        password = req_body['password']
        
        # Validate input
        if not name or len(name) < 2:
            raise ValidationError("Name must be at least 2 characters long")
        
        if not AuthHandler._validate_email(email):
            raise ValidationError("Invalid email format")
        
        if not AuthHandler._validate_password(password):
            raise ValidationError(
                "Password must be at least 8 characters long and contain "
                "at least one uppercase letter, one lowercase letter, and one digit"
            )
        
        # Check if user already exists
        existing_user = db_service.get_user_by_email(email)
        if existing_user:
            raise ValidationError("User with this email already exists")
        
        # Hash password
        hashed_password = AuthService.hash_password(password)
        
        # Generate user ID
        user_id = str(uuid.uuid4())
        
        # Prepare user data
        user_data = {
            "id": user_id,
            "name": name,
            "email": email,
            "password": hashed_password,
            "createdAt": datetime.utcnow().isoformat(),
            "dailyUsageCount": 0,
            "lastUsageDate": date.today().isoformat(),
            "isEmailVerified": False
        }
        
        # Create user in database
        new_user = db_service.create_user_with_auth(user_data)
        
        # Generate tokens (new users are not admin by default)
        tokens = AuthService.generate_tokens(user_id, email, is_admin=False, role='user')
        
        # Generate email verification token (optional)
        verification_token = AuthService.generate_verification_token(email)
        
        response_data = {
            **new_user.to_dict(),
            **tokens,
            'verification_token': verification_token
        }
        
        return create_json_response(response_data, 201)
    
    @staticmethod
    @error_handler
    @log_request
    def login(req: func.HttpRequest) -> func.HttpResponse:
        """Login user with email and password"""
        req_body = validate_json_request(req)
        
        # Validate required fields
        validate_required_fields(req_body, ['email', 'password'])
        
        email = req_body['email'].strip().lower()
        password = req_body['password']
        
        # Get user by email
        user = db_service.get_user_by_email(email)
        if not user:
            raise ValidationError("Invalid email or password")
        
        # Verify password
        if not AuthService.verify_password(password, user.password):
            raise ValidationError("Invalid email or password")
        
        # Generate tokens with admin status
        tokens = AuthService.generate_tokens(user.id, email, is_admin=user.is_admin, role=user.role)
        
        response_data = {
            **user.to_dict(),
            **tokens
        }
        
        return create_json_response(response_data)
    
    @staticmethod
    @error_handler
    @log_request
    def refresh_token(req: func.HttpRequest) -> func.HttpResponse:
        """Refresh access token using refresh token"""
        req_body = validate_json_request(req)
        
        # Validate required fields
        validate_required_fields(req_body, ['refresh_token'])
        
        refresh_token = req_body['refresh_token']
        
        # Verify refresh token
        try:
            payload = AuthService.verify_token(refresh_token, 'refresh')
            user_id = payload.get('user_id')
            email = payload.get('email')
            
            # Check if user still exists
            user = db_service.get_user_by_id(user_id)
            if not user:
                raise ValidationError("User not found")
            
            # Generate new tokens with admin status
            tokens = AuthService.generate_tokens(user_id, email, is_admin=user.is_admin, role=user.role)
            
            return create_json_response(tokens)
            
        except ValidationError as e:
            raise ValidationError("Invalid refresh token")
    
    @staticmethod
    @error_handler
    @log_request
    @require_auth
    def get_profile(req: func.HttpRequest) -> func.HttpResponse:
        """Get user profile (requires authentication)"""
        user_id = getattr(req, 'user_id', None)
        
        if not user_id:
            raise ValidationError("User ID not found in token")
        
        user = db_service.get_user_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        return create_json_response(user.to_dict())
    
    @staticmethod
    @error_handler
    @log_request
    @require_auth
    def update_profile(req: func.HttpRequest) -> func.HttpResponse:
        """Update user profile (requires authentication)"""
        user_id = getattr(req, 'user_id', None)
        
        if not user_id:
            raise ValidationError("User ID not found in token")
        
        req_body = validate_json_request(req)
        
        # Get current user
        user = db_service.get_user_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        # Update allowed fields
        update_data = {}
        if 'name' in req_body:
            name = req_body['name'].strip()
            if not name or len(name) < 2:
                raise ValidationError("Name must be at least 2 characters long")
            update_data['name'] = name
        
        # Update user in database
        updated_user = db_service.update_user_profile(user_id, update_data)
        
        return create_json_response(updated_user.to_dict())
    
    @staticmethod
    @error_handler
    @log_request
    def forgot_password(req: func.HttpRequest) -> func.HttpResponse:
        """Send password reset email"""
        req_body = validate_json_request(req)
        
        # Validate required fields
        validate_required_fields(req_body, ['email'])
        
        email = req_body['email'].strip().lower()
        
        # Check if user exists
        user = db_service.get_user_by_email(email)
        if not user:
            # Don't reveal whether email exists or not for security
            return create_json_response({
                "message": "If an account with this email exists, you will receive a password reset link."
            })
        
        # Generate password reset token
        reset_token = AuthService.generate_password_reset_token(email)
        
        # In a real application, you would send an email here
        # For now, we'll return the token for testing
        return create_json_response({
            "message": "Password reset token generated",
            "reset_token": reset_token  # Remove this in production
        })
    
    @staticmethod
    @error_handler
    @log_request
    def reset_password(req: func.HttpRequest) -> func.HttpResponse:
        """Reset password using reset token"""
        req_body = validate_json_request(req)
        
        # Validate required fields
        validate_required_fields(req_body, ['token', 'new_password'])
        
        token = req_body['token']
        new_password = req_body['new_password']
        
        # Validate new password
        if not AuthHandler._validate_password(new_password):
            raise ValidationError(
                "Password must be at least 8 characters long and contain "
                "at least one uppercase letter, one lowercase letter, and one digit"
            )
        
        # Verify reset token
        try:
            email = AuthService.verify_password_reset_token(token)
        except ValidationError:
            raise ValidationError("Invalid or expired reset token")
        
        # Get user by email
        user = db_service.get_user_by_email(email)
        if not user:
            raise NotFoundError("User not found")
        
        # Hash new password
        hashed_password = AuthService.hash_password(new_password)
        
        # Update password in database
        db_service.update_user_password(user.id, hashed_password)
        
        return create_json_response({
            "message": "Password reset successfully"
        })
    
    @staticmethod
    @error_handler
    @log_request
    def verify_email(req: func.HttpRequest) -> func.HttpResponse:
        """Verify email using verification token"""
        req_body = validate_json_request(req)
        
        # Validate required fields
        validate_required_fields(req_body, ['token'])
        
        token = req_body['token']
        
        # Verify token
        try:
            email = AuthService.verify_email_verification_token(token)
        except ValidationError:
            raise ValidationError("Invalid or expired verification token")
        
        # Get user by email
        user = db_service.get_user_by_email(email)
        if not user:
            raise NotFoundError("User not found")
        
        # Update email verification status
        db_service.update_email_verification(user.id, True)
        
        return create_json_response({
            "message": "Email verified successfully"
        })
