"""
Data models and type definitions for the AI Storyboard Weaver application.
Provides structured data validation and type hints.
"""
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime, date
import json

@dataclass
class StoryFrame:
    """Represents a single frame in a storyboard"""
    description: str
    detailed_description: str = ""
    dialogue: str = ""
    action_note: str = ""
    camera_angle: str = ""
    character_details: str = ""
    environment_details: str = ""
    image_url: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert frame to dictionary"""
        return {
            "description": self.description,
            "detailedDescription": self.detailed_description,
            "dialogue": self.dialogue,
            "actionNote": self.action_note,
            "cameraAngle": self.camera_angle,
            "characterDetails": self.character_details,
            "environmentDetails": self.environment_details,
            "imageUrl": self.image_url
        }

@dataclass
class StoryboardRequest:
    """Request model for storyboard generation"""
    prompt: str
    genre: str
    visual_style: str
    mood: str
    frame_count: int
    camera_angles: List[str]
    include_dialogue: bool = False
    include_action_notes: bool = False
    user_id: Optional[str] = None
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'StoryboardRequest':
        """Create StoryboardRequest from dictionary"""
        return cls(
            prompt=data.get('prompt', ''),
            genre=data.get('genre', ''),
            visual_style=data.get('visualStyle', ''),
            mood=data.get('mood', ''),
            frame_count=data.get('frameCount', 4),
            camera_angles=data.get('cameraAngles', []),
            include_dialogue=data.get('includeDialogue', False),
            include_action_notes=data.get('includeActionNotes', False),
            user_id=data.get('userId')
        )
    
    def validate(self) -> List[str]:
        """Validate request data and return list of errors"""
        errors = []
        
        if not self.prompt:
            errors.append("Prompt is required")
        if not self.genre:
            errors.append("Genre is required")
        if not self.visual_style:
            errors.append("Visual style is required")
        if not self.mood:
            errors.append("Mood is required")
        if not self.frame_count or self.frame_count < 1:
            errors.append("Frame count must be at least 1")
        if not self.camera_angles:
            errors.append("Camera angles are required")
            
        return errors

@dataclass
class StoryboardResponse:
    """Response model for storyboard generation"""
    title: str
    frames: List[StoryFrame]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert response to dictionary"""
        return {
            "title": self.title,
            "frames": [frame.to_dict() for frame in self.frames]
        }

@dataclass
class User:
    """User model with authentication support"""
    id: str
    name: str
    email: str
    password: str = None  # Will be excluded from API responses
    device_id: str = None  # Optional for backward compatibility
    created_at: datetime = None
    daily_usage_count: int = 0
    last_usage_date: date = None
    is_email_verified: bool = False
    is_admin: bool = False
    role: str = 'user'  # 'user', 'admin', 'superadmin'
    
    @classmethod
    def from_db_row(cls, row: Dict[str, Any]) -> 'User':
        """Create User from database row"""
        return cls(
            id=row['id'],
            name=row['name'],
            email=row.get('email', ''),
            password=row.get('password', ''),
            device_id=row.get('device_id'),
            created_at=row['created_at'],
            daily_usage_count=row['daily_usage_count'],
            last_usage_date=row['last_usage_date'],
            is_email_verified=row.get('is_email_verified', False),
            is_admin=row.get('is_admin', False),
            role=row.get('role', 'user')
        )
    
    def to_dict(self, include_sensitive: bool = False) -> Dict[str, Any]:
        """Convert user to dictionary for API response"""
        data = {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "dailyUsageCount": self.daily_usage_count,
            "lastUsageDate": self.last_usage_date.isoformat() if self.last_usage_date else None,
            "isEmailVerified": self.is_email_verified,
            "isAdmin": self.is_admin,
            "role": self.role
        }
        
        # Include device_id for backward compatibility if it exists
        if self.device_id:
            data["deviceId"] = self.device_id
            
        # Only include sensitive data if explicitly requested (for internal use)
        if include_sensitive and self.password:
            data["password"] = self.password
            
        return data

@dataclass
class GalleryStory:
    """Gallery story model"""
    id: str
    title: str
    description: str
    frames: List[Dict[str, Any]]
    user_name: str
    user_id: str
    genre: str = ""
    style: str = ""
    total_frames: int = 0
    is_public: bool = True
    created_at: datetime = None
    likes: int = 0
    
    @classmethod
    def from_db_row(cls, row: Dict[str, Any]) -> 'GalleryStory':
        """Create GalleryStory from database row"""
        frames = row['frames']
        if isinstance(frames, str):
            try:
                frames = json.loads(frames)
            except (json.JSONDecodeError, TypeError):
                frames = []
        
        return cls(
            id=row['id'],
            title=row['title'],
            description=row['description'],
            frames=frames,
            user_name=row['user_name'],
            user_id=row['user_id'],
            genre=row.get('genre', ''),
            style=row.get('style', ''),
            total_frames=row.get('total_frames', len(frames)),
            is_public=row.get('is_public', True),
            created_at=row.get('created_at'),
            likes=row.get('likes', 0)
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert gallery story to dictionary for API response"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "frames": self.frames,
            "userName": self.user_name,
            "userId": self.user_id,
            "genre": self.genre,
            "style": self.style,
            "totalFrames": self.total_frames,
            "isPublic": self.is_public,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "likes": self.likes
        }

class APIError(Exception):
    """Custom API error with status code"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class ValidationError(APIError):
    """Validation error (400 status)"""
    def __init__(self, message: str):
        super().__init__(message, 400)

class NotFoundError(APIError):
    """Not found error (404 status)"""
    def __init__(self, message: str):
        super().__init__(message, 404)

class RateLimitError(APIError):
    """Rate limit error (429 status)"""
    def __init__(self, message: str):
        super().__init__(message, 429)
