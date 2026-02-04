"""
Request handlers for user management endpoints.
Handles user creation, retrieval, usage tracking, and password reset.
"""
import logging
import uuid
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, date, timedelta
from typing import Dict, Any
import azure.functions as func
from src.models import User, ValidationError, NotFoundError
from src.repositories.database import db_service
from src.core.auth.auth_service import AuthService
from src.config.settings import Config
from ..utils.helpers import (
    create_json_response,
    create_error_response,
    validate_json_request,
    validate_required_fields,
    error_handler,
    log_request
)

class UserHandler:
    """Handler for user management requests"""
    
    def __init__(self):
        self.auth_service = AuthService()
        self.settings = Config
    
    @staticmethod
    @error_handler
    @log_request
    def get_user(req: func.HttpRequest) -> func.HttpResponse:
        """Get user by ID"""
        user_id = req.route_params.get('userId')
        if not user_id:
            raise ValidationError("User ID required")
        
        user = db_service.get_user_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        return create_json_response(user.to_dict())
    
    @staticmethod
    @error_handler
    @log_request
    def create_user(req: func.HttpRequest) -> func.HttpResponse:
        """Create a new user"""
        req_body = validate_json_request(req)
        
        # Validate required fields
        validate_required_fields(req_body, ['name', 'deviceId'])
        
        # Generate new user ID
        user_id = str(uuid.uuid4())
        
        # Prepare user data
        user_data = {
            "id": user_id,
            "name": req_body['name'],
            "deviceId": req_body['deviceId'],
            "createdAt": req_body.get('createdAt', datetime.utcnow().isoformat()),
            "dailyUsageCount": 0,
            "lastUsageDate": req_body.get('lastUsageDate', date.today().isoformat())
        }
        
        # Create user in database
        new_user = db_service.create_user(user_data)
        
        return create_json_response(new_user.to_dict(), 201)
    
    @staticmethod
    @error_handler
    @log_request
    def update_user_usage(req: func.HttpRequest) -> func.HttpResponse:
        """Update user usage count"""
        user_id = req.route_params.get('userId')
        if not user_id:
            raise ValidationError("User ID required")
        
        req_body = validate_json_request(req)
        
        # Validate required fields
        validate_required_fields(req_body, ['dailyUsageCount', 'lastUsageDate'])
        
        daily_usage_count = req_body['dailyUsageCount']
        last_usage_date = req_body['lastUsageDate']
        
        # Update user usage in database
        updated_user = db_service.update_user_usage(user_id, daily_usage_count, last_usage_date)
        
        return create_json_response(updated_user.to_dict())
    
    @staticmethod
    @error_handler
    @log_request
    def reset_daily_usage(req: func.HttpRequest) -> func.HttpResponse:
        """Manually reset daily usage for all users (admin endpoint)"""
        rows_affected = db_service.reset_daily_usage()
        
        logging.info(f"Manual daily usage reset completed successfully. {rows_affected} users affected.")
        
        return create_json_response({
            "message": "Daily usage reset completed",
            "success": True,
            "usersAffected": rows_affected
        })

    @staticmethod
    @error_handler
    @log_request
    def request_password_reset(req: func.HttpRequest) -> func.HttpResponse:
        """Handle password reset request"""
        req_body = validate_json_request(req)
        
        # Validate required fields
        validate_required_fields(req_body, ['email'])
        
        email = req_body['email'].strip().lower()
        
        # Check if user exists
        user = db_service.get_user_by_email(email)
        if not user:
            # Don't reveal if email exists for security
            return create_json_response({
                "message": "If the email exists, a reset link has been sent"
            })
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
        
        # Store reset token in database
        db_service.store_password_reset_token(user.id, reset_token, expires_at)
        
        # Send reset email (create instance to access settings)
        handler_instance = UserHandler()
        handler_instance._send_reset_email(email, user.name, reset_token)
        
        return create_json_response({
            "message": "If the email exists, a reset link has been sent"
        })

    @staticmethod
    @error_handler
    @log_request
    def reset_password(req: func.HttpRequest) -> func.HttpResponse:
        """Handle password reset with token"""
        req_body = validate_json_request(req)
        
        # Validate required fields
        validate_required_fields(req_body, ['token', 'new_password'])
        
        token = req_body['token']
        new_password = req_body['new_password']
        
        # Validate password strength
        if len(new_password) < 8:
            raise ValidationError("Password must be at least 8 characters long")
        
        # Verify reset token
        user_id = db_service.verify_password_reset_token(token)
        if not user_id:
            raise ValidationError("Invalid or expired reset token")
        
        # Hash new password (create instance to access auth_service)
        handler_instance = UserHandler()
        hashed_password = handler_instance.auth_service.hash_password(new_password)
        
        # Update password
        db_service.update_user_password(user_id, hashed_password)
        
        # Delete used reset token
        db_service.delete_password_reset_token(token)
        
        return create_json_response({
            "message": "Password reset successfully"
        })

    @staticmethod
    @error_handler
    @log_request
    def validate_reset_token(req: func.HttpRequest) -> func.HttpResponse:
        """Validate password reset token"""
        req_body = validate_json_request(req)
        
        # Validate required fields
        validate_required_fields(req_body, ['token'])
        
        token = req_body['token']
        
        # Verify token
        user_id = db_service.verify_password_reset_token(token)
        if not user_id:
            raise ValidationError("Invalid or expired reset token")
        
        return create_json_response({
            "message": "Token is valid",
            "user_id": user_id
        })

    def _send_reset_email(self, email: str, name: str, reset_token: str):
        """Send password reset email"""
        try:
            # Email configuration
            smtp_server = self.settings.SMTP_SERVER
            smtp_port = self.settings.SMTP_PORT
            smtp_username = self.settings.SMTP_USERNAME
            smtp_password = self.settings.SMTP_PASSWORD
            frontend_url = self.settings.FRONTEND_URL

            if not all([smtp_server, smtp_port, smtp_username, smtp_password]):
                logging.warning("SMTP settings not configured, email not sent")
                return

            # Create reset link
            reset_link = f"{frontend_url}/auth?mode=reset&token={reset_token}"

            # Create message
            msg = MIMEMultipart()
            msg['From'] = smtp_username
            msg['To'] = email
            msg['Subject'] = "Reset Your Scripto Password"

            # Email body
            body = f"""
Hi {name},

You recently requested to reset your password for your Scripto account.

Click the link below to reset your password:
{reset_link}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email.

Best regards,
The Scripto Team
"""

            msg.attach(MIMEText(body, 'plain'))

            # Send email
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(smtp_username, smtp_password)
            text = msg.as_string()
            server.sendmail(smtp_username, email, text)
            server.quit()

            logging.info(f"Password reset email sent to {email}")

        except Exception as e:
            logging.error(f"Failed to send reset email: {str(e)}")
            # Don't raise exception - we don't want to fail the request if email fails
