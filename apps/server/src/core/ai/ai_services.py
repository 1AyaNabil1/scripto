"""
AI services for storyboard generation.
Handles interactions with DeepSeek and DALL-E models.
"""
import logging
import json
import time
import requests
from typing import Dict, Any, List
from openai import AzureOpenAI
from src.config.settings import Config
from src.models import StoryFrame, StoryboardResponse, APIError, RateLimitError
from src.core.storage.blob_storage import get_blob_storage

class DeepSeekService:
    """Service for interacting with DeepSeek language model"""
    
    def __init__(self):
        self.endpoint = Config.LLM_MODEL_ENDPOINT
        self.api_key = Config.LLM_MODEL_API_KEY
        self.model_name = Config.DEEPSEEK_MODEL_NAME
    
    def build_prompt(self, prompt: str, genre: str, visual_style: str, mood: str, 
                    frame_count: int, camera_angles: List[str]) -> str:
        """Build enhanced prompt for LLM model with character consistency requirements"""
        return f"""Generate a detailed storyboard with {frame_count} frames for the following story:
"{prompt}"

Genre: {genre}
Visual Style: {visual_style}
Mood: {mood}

IMPORTANT REQUIREMENTS FOR CHARACTER CONSISTENCY:
1. Identify the main characters early and maintain their appearance throughout all frames
2. Include detailed character descriptions (age, gender, hair color/style, clothing, distinctive features)
3. For each frame, describe characters with consistent physical traits
4. Include environmental details that should remain consistent (locations, time of day, weather)
5. Specify visual continuity elements (lighting style, color palette, artistic approach)

For each frame, return a JSON object with the following properties:
- "description": A simple, clean scene description for UI display (1-2 sentences, user-friendly)
- "detailedDescription": A comprehensive scene description including character details, setting, actions, and visual elements for image generation
- "dialogue": (Optional) Dialogue, or an empty string if none
- "actionNote": (Optional) Action note including character movements and interactions, or an empty string if none
- "cameraAngle": Suggested camera angle (from: {json.dumps(camera_angles)})
- "characterDetails": A brief description of main characters visible in this frame with their consistent physical traits
- "environmentDetails": Description of the setting, lighting, and atmosphere for visual continuity

Return the result as a single valid JSON object with two properties: 'title' (a short title of 3-4 words max based on the story) and 'frames' (an array of frame objects). Ensure all values are properly quoted and the JSON is syntactically correct."""
    
    def generate_storyboard_data(self, prompt: str, genre: str, visual_style: str, mood: str,
                               frame_count: int, camera_angles: List[str]) -> StoryboardResponse:
        """Generate storyboard data using DeepSeek model"""
        try:
            gpt_prompt = self.build_prompt(prompt, genre, visual_style, mood, frame_count, camera_angles)
            logging.info(f"Calling Azure OpenAI with endpoint: {self.endpoint}")

            client = AzureOpenAI(
                azure_endpoint=self.endpoint,
                api_key=self.api_key,
                api_version="2024-05-01-preview"
            )

            response = client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are an expert storyboard generation assistant with deep understanding of visual storytelling and character consistency. Your task is to generate a response strictly as a valid JSON object with two properties: 'title' (a short title of 3-4 words max based on the story) and 'frames' (an array of frame objects). CRITICAL: Ensure visual continuity by maintaining consistent character descriptions, environmental details, and artistic elements across all frames. Provide both simple UI descriptions and detailed descriptions for image generation. Do not include any text outside the JSON structure. If you cannot generate valid JSON, return {{'title': '', 'frames': []}}. Ensure all properties ('description', 'detailedDescription', 'dialogue', 'actionNote', 'cameraAngle', 'characterDetails', 'environmentDetails') in each frame are present with proper quoting, even if empty."},
                    {"role": "user", "content": gpt_prompt}
                ],
                max_tokens=Config.MAX_TOKENS,
                temperature=Config.TEMPERATURE,
                top_p=Config.TOP_P,
                presence_penalty=Config.PRESENCE_PENALTY,
                frequency_penalty=Config.FREQUENCY_PENALTY
            )

            content = response.choices[0].message.content
            logging.info(f"Raw Azure OpenAI response content: {content}")
            
            return self._parse_response(content)
            
        except Exception as e:
            logging.error(f"Error calling Azure OpenAI model: {str(e)}")
            raise APIError(f"Failed to generate storyboard: {str(e)}")
    
    def _parse_response(self, content: str) -> StoryboardResponse:
        """Parse and validate DeepSeek response"""
        try:
            # Handle markdown code blocks
            if content.startswith('```json'):
                start_index = content.find('{')
                end_index = content.rfind('}') + 1
                if start_index != -1 and end_index != 0:
                    content = content[start_index:end_index]
                else:
                    raise ValueError("Could not extract JSON from markdown code block")
            elif content.startswith('```'):
                lines = content.split('\n')
                json_lines = []
                in_json = False
                for line in lines:
                    if line.strip().startswith('{'):
                        in_json = True
                    if in_json:
                        json_lines.append(line)
                    if line.strip().endswith('}') and in_json:
                        break
                content = '\n'.join(json_lines)
            
            logging.info(f"Cleaned content for JSON parsing: {content}")
            parsed_response = json.loads(content)
            
            if not isinstance(parsed_response, dict) or 'title' not in parsed_response or 'frames' not in parsed_response:
                raise ValueError("Invalid response structure")
            
            # Create StoryFrame objects
            frames = []
            for frame_data in parsed_response.get('frames', []):
                frame = StoryFrame(
                    description=frame_data.get("description", ""),
                    detailed_description=frame_data.get("detailedDescription", frame_data.get("description", "")),
                    dialogue=frame_data.get("dialogue", ""),
                    action_note=frame_data.get("actionNote", ""),
                    camera_angle=frame_data.get("cameraAngle", ""),
                    character_details=frame_data.get("characterDetails", ""),
                    environment_details=frame_data.get("environmentDetails", "")
                )
                frames.append(frame)
            
            return StoryboardResponse(
                title=parsed_response.get('title', ''),
                frames=frames
            )
            
        except Exception as e:
            logging.warning(f"Failed to parse DeepSeek response: {str(e)}. Content was: {content}")
            return StoryboardResponse(title="", frames=[])

class DALLEService:
    """Service for generating images with DALL-E"""
    
    def __init__(self):
        self.endpoint = Config.DALLE_MODEL_ENDPOINT
        self.api_key = Config.DALLE_MODEL_API_KEY
        self.model_name = Config.DALLE_MODEL_NAME
    
    def build_image_prompt(self, description: str, visual_style: str, mood: str, 
                          frame_number: int, total_frames: int, story_context: str = "",
                          character_details: str = "", environment_details: str = "") -> str:
        """Build comprehensive image prompt for DALL-E with enhanced character consistency"""
        base_prompt = "Digital illustration of a scene"
        
        # Character consistency instructions
        character_consistency = ""
        if character_details:
            character_consistency = f". Characters: {character_details}"
        
        # Environment consistency instructions  
        environment_consistency = ""
        if environment_details:
            environment_consistency = f". Setting: {environment_details}"
        
        # Style and mood instructions
        style_instructions = f". Art style: {visual_style} style"
        mood_instructions = f". Atmosphere: {mood} mood with appropriate lighting"
        
        # Scene description
        scene_description = f". Scene: {description}"
        
        # Quality instructions
        quality_instructions = ". High quality digital art, clean composition, no UI elements, no borders, no frames, no text overlays, no storyboard panels, just the pure scene illustration"
        
        # Combine all elements
        full_prompt = (base_prompt + scene_description + character_consistency + environment_consistency + 
                      style_instructions + mood_instructions + quality_instructions)
        
        # Ensure prompt isn't too long (DALL-E has limits)
        if len(full_prompt) > 1000:
            essential_parts = base_prompt + scene_description + character_consistency + style_instructions + quality_instructions
            if len(essential_parts) <= 1000:
                full_prompt = essential_parts
            else:
                full_prompt = full_prompt[:1000]
        
        return full_prompt
    
    def generate_image(self, image_prompt: str, story_id: str = None, frame_number: int = None) -> str:
        """Generate image using DALL-E API and upload to blob storage"""
        
        for attempt in range(Config.MAX_RETRIES):
            try:
                client = AzureOpenAI(
                    azure_endpoint=self.endpoint,
                    api_key=self.api_key,
                    api_version="2024-05-01-preview"
                )

                response = client.images.generate(
                    model=self.model_name,
                    prompt=image_prompt,
                    size=Config.IMAGE_SIZE,
                    style=Config.IMAGE_STYLE,
                    quality=Config.IMAGE_QUALITY,
                    n=1
                )
                
                # Get the temporary DALL-E URL
                temp_image_url = response.data[0].url
                
                # Generate filename for blob storage
                file_name = None
                if story_id and frame_number is not None:
                    file_name = f"story_{story_id}_frame_{frame_number}.png"
                
                # Upload to blob storage and get permanent URL
                try:
                    blob_storage_service = get_blob_storage()
                    permanent_url = blob_storage_service.upload_image_from_url(temp_image_url, file_name)
                    logging.info(f"Successfully uploaded image to blob storage: {permanent_url}")
                    return permanent_url
                except Exception as blob_error:
                    logging.error(f"Failed to upload to blob storage: {blob_error}")
                    # Fallback to temporary URL if blob upload fails
                    return temp_image_url
                
            except Exception as e:
                if "rate limit" in str(e).lower() or "429" in str(e):
                    # Rate limit hit, wait and retry
                    wait_time = (attempt + 1) * 60  # Wait 60, 120, 180 seconds
                    logging.warning(f"Rate limit hit, waiting {wait_time} seconds before retry {attempt + 1}/{Config.MAX_RETRIES}")
                    if attempt < Config.MAX_RETRIES - 1:
                        time.sleep(wait_time)
                        continue
                    else:
                        raise RateLimitError("Rate limit exceeded. Please wait a few minutes before trying again.")
                        
                if attempt == Config.MAX_RETRIES - 1:
                    logging.error(f"DALL-E API error after {Config.MAX_RETRIES} attempts: {str(e)}")
                    raise APIError(f"Image generation failed: {str(e)}")
                logging.warning(f"DALL-E API error on attempt {attempt + 1}: {str(e)}")
        
        raise APIError("Failed to generate image after all retry attempts")

# Global service instances
deepseek_service = DeepSeekService()
dalle_service = DALLEService()
