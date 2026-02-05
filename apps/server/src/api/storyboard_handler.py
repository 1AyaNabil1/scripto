"""
Request handlers for storyboard generation endpoints.
Contains the main business logic for storyboard creation.
"""
import logging
from datetime import date
from typing import Dict, Any, List, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
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

# Maximum parallel image generations (DALL-E can handle concurrent requests)
MAX_PARALLEL_IMAGES = 3

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
        """Check if user has exceeded daily usage limits (admins have unlimited usage)"""
        try:
            user = db_service.get_user_by_id(user_id)
            if user:
                # Admin users have unlimited usage
                if user.is_admin or user.role in ['admin', 'superadmin']:
                    logging.info(f"Admin user {user.email} - bypassing usage limits")
                    return
                
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
        """Generate images for all frames in parallel for lower latency"""
        total_frames = len(storyboard_response.frames)
        
        # Generate a unique story ID for blob naming
        import uuid
        story_id = str(uuid.uuid4())[:8]
        
        # Build character reference from first frame for consistency
        main_character_reference = ""
        if storyboard_response.frames and storyboard_response.frames[0].character_details:
            main_character_reference = storyboard_response.frames[0].character_details
        
        def generate_single_frame(frame_data: Tuple[int, StoryFrame]) -> Tuple[int, dict]:
            """Generate image for a single frame - used by thread pool"""
            i, frame = frame_data
            try:
                # Enhance character details with reference to first frame
                enhanced_character_details = frame.character_details
                if i > 1 and main_character_reference:
                    enhanced_character_details = f"Same as frame 1: {main_character_reference[:100]}"
                
                # Build concise image prompt
                image_prompt = dalle_service.build_image_prompt(
                    frame.detailed_description or frame.description,
                    storyboard_request.visual_style,
                    storyboard_request.mood,
                    i,
                    total_frames,
                    storyboard_response.title,
                    enhanced_character_details,
                    frame.environment_details
                )
                
                logging.info(f"Frame {i} image prompt length: {len(image_prompt)} chars")
                
                # Generate image
                image_url = dalle_service.generate_image(image_prompt, story_id, i)
                
                frame_result = {
                    "description": frame.description,
                    "imageUrl": image_url
                }
                
                if storyboard_request.include_dialogue:
                    frame_result["dialogue"] = frame.dialogue
                if storyboard_request.include_action_notes:
                    frame_result["actionNote"] = frame.action_note
                
                return (i, frame_result)
                
            except Exception as e:
                logging.error(f"Failed to generate image for frame {i}: {str(e)}")
                frame_result = {
                    "description": frame.description,
                    "imageUrl": Config.PLACEHOLDER_IMAGE_URL
                }
                if storyboard_request.include_dialogue:
                    frame_result["dialogue"] = frame.dialogue
                if storyboard_request.include_action_notes:
                    frame_result["actionNote"] = frame.action_note
                
                return (i, frame_result)
        
        # Prepare frame data with indices
        frame_tasks = [(i, frame) for i, frame in enumerate(storyboard_response.frames, 1)]
        
        # Generate images in parallel
        results = {}
        logging.info(f"Generating {total_frames} images in parallel (max {MAX_PARALLEL_IMAGES} concurrent)")
        
        with ThreadPoolExecutor(max_workers=MAX_PARALLEL_IMAGES) as executor:
            future_to_frame = {
                executor.submit(generate_single_frame, task): task[0] 
                for task in frame_tasks
            }
            
            for future in as_completed(future_to_frame):
                frame_idx = future_to_frame[future]
                try:
                    idx, frame_data = future.result()
                    results[idx] = frame_data
                    logging.info(f"Completed frame {idx}/{total_frames}")
                except Exception as e:
                    logging.error(f"Frame {frame_idx} generation failed: {e}")
                    results[frame_idx] = {
                        "description": storyboard_response.frames[frame_idx-1].description,
                        "imageUrl": Config.PLACEHOLDER_IMAGE_URL
                    }
        
        # Return frames in order
        return [results[i] for i in range(1, total_frames + 1)]
