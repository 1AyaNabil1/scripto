"""
Request handlers for storyboard generation endpoints.
Contains the main business logic for storyboard creation.
"""
import logging
from datetime import date
from typing import Dict, Any
import azure.functions as func
from src.models import StoryboardRequest, StoryFrame, ValidationError, RateLimitError
from src.core.ai.ai_services import deepseek_service, dalle_service
from src.repositories.database import db_service
from src.utils.helpers import (
    create_json_response, 
    create_error_response,
    validate_json_request,
    error_handler,
    log_request
)
from src.config.settings import Config

class StoryboardHandler:
    """Handler for storyboard generation requests"""
    
    @staticmethod
    @error_handler
    @log_request
    def generate_storyboard(req: func.HttpRequest) -> func.HttpResponse:
        """Generate a complete storyboard with images"""
        # Parse and validate request
        req_body = validate_json_request(req)
        storyboard_request = StoryboardRequest.from_dict(req_body)
        
        # Validate request data
        validation_errors = storyboard_request.validate()
        if validation_errors:
            raise ValidationError(f"Validation failed: {'; '.join(validation_errors)}")
        
        # Check user usage limits
        if storyboard_request.user_id:
            StoryboardHandler._check_user_limits(storyboard_request.user_id)
        
        # Generate storyboard data using DeepSeek
        storyboard_response = deepseek_service.generate_storyboard_data(
            storyboard_request.prompt,
            storyboard_request.genre,
            storyboard_request.visual_style,
            storyboard_request.mood,
            storyboard_request.frame_count,
            storyboard_request.camera_angles
        )
        
        if not storyboard_response.frames:
            logging.warning('No frames generated, returning empty storyboard.')
            return create_json_response({
                "title": storyboard_response.title,
                "frames": []
            })
        
        # Generate images for each frame
        generated_frames = StoryboardHandler._generate_frame_images(
            storyboard_response,
            storyboard_request
        )
        
        # Update user usage if user ID provided
        if storyboard_request.user_id:
            try:
                user = db_service.get_user_by_id(storyboard_request.user_id)
                if user:
                    today = date.today().isoformat()
                    if user.last_usage_date.isoformat() != today:
                        # Reset usage count for new day
                        db_service.update_user_usage(storyboard_request.user_id, 1, today)
                    else:
                        # Increment usage count
                        db_service.update_user_usage(storyboard_request.user_id, user.daily_usage_count + 1, today)
            except Exception as e:
                logging.error(f"Error updating user usage: {str(e)}")
                # Continue without blocking if database error occurs
        
        return create_json_response({
            "title": storyboard_response.title,
            "frames": generated_frames
        })
    
    @staticmethod
    def _check_user_limits(user_id: str) -> None:
        """Check if user has exceeded daily usage limits"""
        try:
            user = db_service.get_user_by_id(user_id)
            if user:
                today = date.today().isoformat()
                last_usage_date = user.last_usage_date.isoformat() if user.last_usage_date else None
                
                # Check if it's a new day
                if last_usage_date != today:
                    # Usage will be reset, so user can proceed
                    return
                elif user.daily_usage_count >= Config.DAILY_USAGE_LIMIT:
                    # User has exceeded daily limit
                    raise RateLimitError(
                        f"Daily usage limit exceeded. You can create {Config.DAILY_USAGE_LIMIT} storyboards per day."
                    )
        except Exception as e:
            logging.error(f"Error checking user usage: {str(e)}")
            # Continue without blocking if database error occurs
    
    @staticmethod
    def _generate_frame_images(storyboard_response, storyboard_request) -> list:
        """Generate images for all frames in the storyboard"""
        frames_with_images = []
        total_frames = len(storyboard_response.frames)
        
        # Generate a unique story ID for blob naming
        import uuid
        story_id = str(uuid.uuid4())[:8]  # Use first 8 characters for shorter names
        
        # Build character reference from first frame for consistency
        main_character_reference = ""
        if storyboard_response.frames and storyboard_response.frames[0].character_details:
            main_character_reference = storyboard_response.frames[0].character_details
        
        for i, frame in enumerate(storyboard_response.frames, 1):
            try:
                # Enhance character details with reference to first frame for consistency
                enhanced_character_details = frame.character_details
                if i > 1 and main_character_reference:
                    enhanced_character_details = f"MAINTAIN SAME CHARACTERS AS FRAME 1: {main_character_reference}. Current frame details: {enhanced_character_details}"
                
                # Build enhanced image prompt
                image_prompt = dalle_service.build_image_prompt(
                    frame.detailed_description or frame.description,
                    storyboard_request.visual_style,
                    storyboard_request.mood,
                    i,
                    total_frames,
                    f"{storyboard_response.title}: {storyboard_request.prompt[:50]}",
                    enhanced_character_details,
                    frame.environment_details
                )
                
                logging.info(f"Frame {i} image prompt length: {len(image_prompt)} characters")
                
                # Generate image with story and frame information for blob naming
                image_url = dalle_service.generate_image(image_prompt, story_id, i)
                
                # Build frame response
                frame_data = {
                    "description": frame.description,
                    "imageUrl": image_url
                }
                
                # Add optional fields if requested
                if storyboard_request.include_dialogue:
                    frame_data["dialogue"] = frame.dialogue
                if storyboard_request.include_action_notes:
                    frame_data["actionNote"] = frame.action_note
                
                frames_with_images.append(frame_data)
                
            except Exception as e:
                logging.error(f"Failed to generate image for frame {i}: {str(e)}")
                # Add frame with placeholder image instead of failing completely
                frame_data = {
                    "description": frame.description,
                    "imageUrl": Config.PLACEHOLDER_IMAGE_URL
                }
                
                if storyboard_request.include_dialogue:
                    frame_data["dialogue"] = frame.dialogue
                if storyboard_request.include_action_notes:
                    frame_data["actionNote"] = frame.action_note
                
                frames_with_images.append(frame_data)
        
        return frames_with_images
