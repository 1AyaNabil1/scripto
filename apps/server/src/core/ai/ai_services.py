"""
AI services for storyboard generation.
Handles interactions with DeepSeek and DALL-E models.
"""
import logging
import json
import time
import requests
from typing import Dict, Any, List, Optional
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
        """Build optimized prompt for LLM model - concise but effective"""
        return f"""Create a {frame_count}-frame storyboard for: "{prompt}"

Style: {visual_style} | Genre: {genre} | Mood: {mood}

For each frame, provide JSON with:
- description: 1-2 sentence scene summary
- detailedDescription: Visual scene (characters, setting, lighting) for image generation. Keep safe/family-friendly.
- dialogue: Character dialogue or empty string
- actionNote: Character actions or empty string  
- cameraAngle: One of {json.dumps(camera_angles)}
- characterDetails: Brief character appearance (age, hair, clothes)
- environmentDetails: Setting, lighting, colors

Return JSON: {{"title": "3-4 word title", "frames": [...]}}"""
    
    def generate_storyboard_data(self, prompt: str, genre: str, visual_style: str, mood: str,
                               frame_count: int, camera_angles: List[str]) -> StoryboardResponse:
        """Generate storyboard data using DeepSeek model"""
        try:
            gpt_prompt = self.build_prompt(prompt, genre, visual_style, mood, frame_count, camera_angles)
            logging.info(f"Calling Azure OpenAI with endpoint: {self.endpoint}")

            client = AzureOpenAI(
                azure_endpoint=self.endpoint or "",
                api_key=self.api_key,
                api_version="2024-05-01-preview"
            )

            response = client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a storyboard assistant. Return ONLY valid JSON with 'title' and 'frames' array. Keep descriptions concise and family-friendly. Avoid weapons, violence, or controversial content. Maintain character consistency across frames."},
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
    
    # Words that may trigger content policy violations
    UNSAFE_WORDS = {
        'dagger', 'knife', 'sword', 'weapon', 'gun', 'pistol', 'rifle', 'blade',
        'blood', 'gore', 'violent', 'kill', 'murder', 'death', 'dead', 'dying',
        'naked', 'nude', 'sexy', 'seductive', 'provocative', 'revealing',
        'drug', 'drugs', 'cocaine', 'heroin', 'marijuana', 'cigarette',
        'alcohol', 'drunk', 'beer', 'wine', 'whiskey', 'vodka',
        'fight', 'attack', 'punch', 'kick', 'hit', 'strike', 'combat',
        'war', 'battle', 'soldier', 'military', 'army', 'explosion'
    }
    
    # Safe replacements for common unsafe words
    SAFE_REPLACEMENTS = {
        'dagger': 'accessory', 'knife': 'tool', 'sword': 'staff', 'weapon': 'item',
        'gun': 'device', 'blade': 'pendant', 'fight': 'confrontation',
        'attack': 'approach', 'battle': 'challenge', 'soldier': 'guardian'
    }
    
    def __init__(self):
        self.endpoint = Config.DALLE_MODEL_ENDPOINT
        self.api_key = Config.DALLE_MODEL_API_KEY
        self.model_name = Config.DALLE_MODEL_NAME
    
    def _sanitize_prompt(self, text: str) -> str:
        """Remove or replace potentially unsafe words from prompt"""
        result = text.lower()
        for unsafe, safe in self.SAFE_REPLACEMENTS.items():
            result = result.replace(unsafe, safe)
        
        # Remove any remaining unsafe words
        words = result.split()
        filtered = [w for w in words if w.lower() not in self.UNSAFE_WORDS]
        return ' '.join(filtered)
    
    def build_image_prompt(self, description: str, visual_style: str, mood: str, 
                          frame_number: int = 1, total_frames: int = 1, story_context: str = "",
                          character_details: str = "", environment_details: str = "") -> str:
        """Build concise, safe image prompt for DALL-E (max 400 chars)"""
        # Sanitize all inputs
        safe_desc = self._sanitize_prompt(description)
        safe_chars = self._sanitize_prompt(character_details) if character_details else ""
        safe_env = self._sanitize_prompt(environment_details) if environment_details else ""
        
        # Build concise prompt - prioritize essential elements
        parts = [f"{visual_style} illustration"]
        
        # Add scene description (truncate if needed)
        if safe_desc:
            parts.append(safe_desc[:120])
        
        # Add character info (brief)
        if safe_chars:
            parts.append(f"featuring {safe_chars[:60]}")
        
        # Add environment info (brief)
        if safe_env:
            parts.append(safe_env[:50])
        
        # Add style/mood
        parts.append(f"{mood} atmosphere, digital art")
        
        full_prompt = ", ".join(parts)
        
        # Hard limit at 400 characters for faster generation
        if len(full_prompt) > 400:
            full_prompt = full_prompt[:397] + "..."
        
        return full_prompt
    
    def generate_image(self, image_prompt: str, story_id: Optional[str] = None, frame_number: Optional[int] = None) -> str:
        """Generate image using DALL-E API and upload to blob storage"""
        
        for attempt in range(Config.MAX_RETRIES):
            try:
                client = AzureOpenAI(
                    azure_endpoint=self.endpoint or "",
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
