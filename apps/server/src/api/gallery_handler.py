"""
Request handlers for gallery management endpoints.
Handles gallery stories, likes, and sharing functionality.
"""
import logging
from typing import Dict, Any
import azure.functions as func
from src.models import GalleryStory, ValidationError, NotFoundError
from src.repositories.database import db_service
from ..utils.helpers import (
    create_json_response,
    create_error_response,
    validate_json_request,
    validate_required_fields,
    error_handler,
    log_request
)

class GalleryHandler:
    """Handler for gallery management requests"""
    
    @staticmethod
    @error_handler
    @log_request
    def get_gallery_stories(req: func.HttpRequest) -> func.HttpResponse:
        """Get all public gallery stories with pagination"""
        # Parse query parameters for pagination
        try:
            limit = int(req.params.get('limit', 100))
            offset = int(req.params.get('offset', 0))
        except ValueError:
            raise ValidationError("Invalid pagination parameters")
        
        # Ensure reasonable limits
        limit = min(max(limit, 1), 100)  # Between 1 and 100
        offset = max(offset, 0)  # Non-negative
        
        gallery_stories = db_service.get_gallery_stories(limit, offset)
        
        # Convert to dictionaries for JSON response
        stories_data = [story.to_dict() for story in gallery_stories]
        
        return create_json_response(stories_data)
    
    @staticmethod
    @error_handler
    @log_request
    def add_story_to_gallery(req: func.HttpRequest) -> func.HttpResponse:
        """Add a story to the gallery"""
        req_body = validate_json_request(req)
        
        # Validate required fields
        required_fields = ['title', 'description', 'frames', 'userName', 'userId']
        validate_required_fields(req_body, required_fields)
        
        # Prepare story data for database
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
        
        # Add story to gallery database
        new_story = db_service.add_story_to_gallery(story_data)
        
        if not new_story:
            raise ValidationError("Failed to add story to gallery")
        
        return create_json_response(new_story.to_dict(), 201)
    
    @staticmethod
    @error_handler
    @log_request
    def like_gallery_story(req: func.HttpRequest) -> func.HttpResponse:
        """Like or unlike a gallery story"""
        story_id = req.route_params.get('storyId')
        if not story_id:
            raise ValidationError("Story ID required")
        
        req_body = validate_json_request(req)
        
        # Validate required fields
        validate_required_fields(req_body, ['userId'])
        
        user_id = req_body['userId']
        
        # Check if story exists
        story = db_service.get_story_by_id(story_id)
        if not story:
            raise NotFoundError("Story not found")
        
        # Toggle like for story in database
        success = db_service.toggle_story_like(story_id, user_id)
        
        if not success:
            raise ValidationError("Failed to update like")
        
        return create_json_response({
            "success": True,
            "message": "Like toggled successfully"
        })
    
    @staticmethod
    @error_handler
    @log_request
    def get_story_by_id(req: func.HttpRequest) -> func.HttpResponse:
        """Get a specific story by ID"""
        story_id = req.route_params.get('storyId')
        if not story_id:
            raise ValidationError("Story ID required")
        
        story = db_service.get_story_by_id(story_id)
        if not story:
            raise NotFoundError("Story not found")
        
        return create_json_response(story.to_dict())
    
    @staticmethod
    @error_handler
    @log_request
    def get_user_stories(req: func.HttpRequest) -> func.HttpResponse:
        """Get all stories by a specific user"""
        user_id = req.route_params.get('userId')
        if not user_id:
            raise ValidationError("User ID required")
        
        stories = db_service.get_user_stories(user_id)
        
        # Convert to dictionaries for JSON response
        stories_data = [story.to_dict() for story in stories]
        
        return create_json_response(stories_data)
