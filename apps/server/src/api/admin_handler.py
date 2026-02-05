"""
Admin handlers for managing users and stories.
Requires admin privileges for all endpoints.
"""
import logging
from typing import Dict, Any
import azure.functions as func
from src.models import ValidationError, NotFoundError
from src.repositories.database import db_service
from src.core.auth.auth_service import require_admin
from src.utils.helpers import (
    create_json_response,
    create_error_response,
    validate_json_request,
    validate_required_fields,
    error_handler,
    log_request
)


class AdminHandler:
    """Handler for admin-only management requests"""
    
    # ==================== USER MANAGEMENT ====================
    
    @staticmethod
    @error_handler
    @log_request
    @require_admin
    def get_all_users(req: func.HttpRequest) -> func.HttpResponse:
        """Get all users with pagination (admin only)"""
        try:
            limit = int(req.params.get('limit', 50))
            offset = int(req.params.get('offset', 0))
        except ValueError:
            raise ValidationError("Invalid pagination parameters")
        
        # Ensure reasonable limits
        limit = min(max(limit, 1), 100)
        offset = max(offset, 0)
        
        users = db_service.get_all_users(limit, offset)
        total_count = db_service.get_users_count()
        
        users_data = [user.to_dict() for user in users]
        
        return create_json_response({
            "users": users_data,
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "hasMore": offset + len(users_data) < total_count
        })
    
    @staticmethod
    @error_handler
    @log_request
    @require_admin
    def get_user_details(req: func.HttpRequest) -> func.HttpResponse:
        """Get detailed user information including all their stories (admin only)"""
        user_id = req.route_params.get('userId')
        if not user_id:
            raise ValidationError("User ID required")
        
        user = db_service.get_user_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        # Get user's stories
        user_stories = db_service.get_user_stories(user_id)
        
        return create_json_response({
            "user": user.to_dict(),
            "stories": [story.to_dict() for story in user_stories],
            "totalStories": len(user_stories)
        })
    
    @staticmethod
    @error_handler
    @log_request
    @require_admin
    def delete_user(req: func.HttpRequest) -> func.HttpResponse:
        """Delete a user and all their content (admin only)"""
        user_id = req.route_params.get('userId')
        if not user_id:
            raise ValidationError("User ID required")
        
        # Prevent admin from deleting themselves
        if user_id == getattr(req, 'user_id', None):
            raise ValidationError("Cannot delete your own admin account")
        
        user = db_service.get_user_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        # Prevent deleting other admins (only superadmin can)
        if user.is_admin and getattr(req, 'role', 'admin') != 'superadmin':
            raise ValidationError("Only superadmin can delete other admin accounts")
        
        success = db_service.delete_user(user_id)
        if not success:
            raise ValidationError("Failed to delete user")
        
        return create_json_response({
            "success": True,
            "message": f"User {user.email} deleted successfully"
        })
    
    @staticmethod
    @error_handler
    @log_request
    @require_admin
    def update_user_role(req: func.HttpRequest) -> func.HttpResponse:
        """Update user admin status and role (admin only)"""
        user_id = req.route_params.get('userId')
        if not user_id:
            raise ValidationError("User ID required")
        
        req_body = validate_json_request(req)
        
        is_admin = req_body.get('isAdmin', False)
        role = req_body.get('role', 'user')
        
        # Validate role
        valid_roles = ['user', 'admin', 'superadmin']
        if role not in valid_roles:
            raise ValidationError(f"Invalid role. Must be one of: {', '.join(valid_roles)}")
        
        # Only superadmin can promote to admin/superadmin
        if role in ['admin', 'superadmin'] and getattr(req, 'role', 'admin') != 'superadmin':
            raise ValidationError("Only superadmin can promote users to admin")
        
        user = db_service.update_user_admin_status(user_id, is_admin, role)
        if not user:
            raise NotFoundError("User not found")
        
        return create_json_response({
            "success": True,
            "user": user.to_dict()
        })
    
    # ==================== STORY MANAGEMENT ====================
    
    @staticmethod
    @error_handler
    @log_request
    @require_admin
    def get_all_stories(req: func.HttpRequest) -> func.HttpResponse:
        """Get all stories including private ones (admin only)"""
        try:
            limit = int(req.params.get('limit', 50))
            offset = int(req.params.get('offset', 0))
            include_private = req.params.get('includePrivate', 'true').lower() == 'true'
        except ValueError:
            raise ValidationError("Invalid pagination parameters")
        
        # Ensure reasonable limits
        limit = min(max(limit, 1), 100)
        offset = max(offset, 0)
        
        stories = db_service.get_all_stories(limit, offset, include_private)
        total_count = db_service.get_stories_count(include_private)
        
        stories_data = [story.to_dict() for story in stories]
        
        return create_json_response({
            "stories": stories_data,
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "hasMore": offset + len(stories_data) < total_count
        })
    
    @staticmethod
    @error_handler
    @log_request
    @require_admin
    def delete_story(req: func.HttpRequest) -> func.HttpResponse:
        """Delete a story from gallery (admin only)"""
        story_id = req.route_params.get('storyId')
        if not story_id:
            raise ValidationError("Story ID required")
        
        story = db_service.get_story_by_id(story_id)
        if not story:
            raise NotFoundError("Story not found")
        
        success = db_service.delete_story(story_id)
        if not success:
            raise ValidationError("Failed to delete story")
        
        return create_json_response({
            "success": True,
            "message": f"Story '{story.title}' deleted successfully"
        })
    
    @staticmethod
    @error_handler
    @log_request
    @require_admin
    def update_story_visibility(req: func.HttpRequest) -> func.HttpResponse:
        """Add or remove a story from the public gallery (admin only)"""
        story_id = req.route_params.get('storyId')
        if not story_id:
            raise ValidationError("Story ID required")
        
        req_body = validate_json_request(req)
        is_public = req_body.get('isPublic', True)
        
        story = db_service.update_story_visibility(story_id, is_public)
        if not story:
            raise NotFoundError("Story not found")
        
        action = "added to" if is_public else "removed from"
        return create_json_response({
            "success": True,
            "message": f"Story '{story.title}' {action} public gallery",
            "story": story.to_dict()
        })
    
    @staticmethod
    @error_handler
    @log_request
    @require_admin
    def add_story_to_gallery(req: func.HttpRequest) -> func.HttpResponse:
        """Add a story to gallery for any user (admin only)"""
        req_body = validate_json_request(req)
        
        # Validate required fields
        required_fields = ['title', 'description', 'frames', 'userName', 'userId']
        validate_required_fields(req_body, required_fields)
        
        # Prepare story data
        story_data = {
            'title': req_body['title'],
            'description': req_body['description'],
            'frames': req_body['frames'],
            'user_id': req_body['userId'],
            'user_name': req_body['userName'],
            'genre': req_body.get('genre', ''),
            'style': req_body.get('style', ''),
            'is_public': req_body.get('isPublic', True)
        }
        
        new_story = db_service.add_story_to_gallery(story_data)
        if not new_story:
            raise ValidationError("Failed to add story to gallery")
        
        return create_json_response({
            "success": True,
            "message": "Story added to gallery",
            "story": new_story.to_dict()
        }, 201)
    
    # ==================== ADMIN STATISTICS ====================
    
    @staticmethod
    @error_handler
    @log_request
    @require_admin
    def get_admin_stats(req: func.HttpRequest) -> func.HttpResponse:
        """Get admin dashboard statistics"""
        total_users = db_service.get_users_count()
        total_stories = db_service.get_stories_count(include_private=True)
        public_stories = db_service.get_stories_count(include_private=False)
        
        return create_json_response({
            "totalUsers": total_users,
            "totalStories": total_stories,
            "publicStories": public_stories,
            "privateStories": total_stories - public_stories
        })
