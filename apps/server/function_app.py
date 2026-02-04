import azure.functions as func
import logging
from src.api import StoryboardHandler, UserHandler, GalleryHandler
from src.core.auth.auth_handler import AuthHandler

app = func.FunctionApp()

# Authentication Endpoints
@app.route(route="auth/register", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def register(req: func.HttpRequest) -> func.HttpResponse:
    """Register a new user with email and password."""
    return AuthHandler.register(req)

@app.route(route="auth/login", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def login(req: func.HttpRequest) -> func.HttpResponse:
    """Login user with email and password."""
    return AuthHandler.login(req)

@app.route(route="auth/refresh", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def refresh_token(req: func.HttpRequest) -> func.HttpResponse:
    """Refresh access token using refresh token."""
    return AuthHandler.refresh_token(req)

@app.route(route="auth/profile", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def get_profile(req: func.HttpRequest) -> func.HttpResponse:
    """Get user profile (requires authentication)."""
    return AuthHandler.get_profile(req)

@app.route(route="auth/profile", methods=["PATCH"], auth_level=func.AuthLevel.ANONYMOUS)
def update_profile(req: func.HttpRequest) -> func.HttpResponse:
    """Update user profile (requires authentication)."""
    return AuthHandler.update_profile(req)

@app.route(route="request_password_reset", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def request_password_reset(req: func.HttpRequest) -> func.HttpResponse:
    """Send password reset email."""
    return UserHandler.request_password_reset(req)

@app.route(route="reset_password", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def reset_password(req: func.HttpRequest) -> func.HttpResponse:
    """Reset password using reset token."""
    return UserHandler.reset_password(req)

@app.route(route="validate_reset_token", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def validate_reset_token(req: func.HttpRequest) -> func.HttpResponse:
    """Validate password reset token."""
    return UserHandler.validate_reset_token(req)

@app.route(route="auth/verify-email", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def verify_email(req: func.HttpRequest) -> func.HttpResponse:
    """Verify email using verification token."""
    return AuthHandler.verify_email(req)

# Storyboard Generation Endpoint
@app.route(route="generateStoryboard", auth_level=func.AuthLevel.ANONYMOUS)
def generateStoryboard(req: func.HttpRequest) -> func.HttpResponse:
    """Generate a storyboard with AI-generated frames and images."""
    return StoryboardHandler.generate_storyboard(req)

# User Management Endpoints (Legacy - for backward compatibility)
@app.route(route="user/{userId}", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def get_user(req: func.HttpRequest) -> func.HttpResponse:
    """Get user by ID."""
    return UserHandler.get_user(req)

@app.route(route="user", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def create_user(req: func.HttpRequest) -> func.HttpResponse:
    """Create new user."""
    return UserHandler.create_user(req)

@app.route(route="user/{userId}/usage", methods=["PATCH"], auth_level=func.AuthLevel.ANONYMOUS)
def update_user_usage(req: func.HttpRequest) -> func.HttpResponse:
    """Update user usage count."""
    return UserHandler.update_user_usage(req)

# Gallery Management Endpoints
@app.route(route="gallery", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def get_gallery_stories(req: func.HttpRequest) -> func.HttpResponse:
    """Get all gallery stories."""
    return GalleryHandler.get_gallery_stories(req)

@app.route(route="gallery", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def add_story_to_gallery(req: func.HttpRequest) -> func.HttpResponse:
    """Add story to gallery."""
    return GalleryHandler.add_story_to_gallery(req)

@app.route(route="gallery/{storyId}/like", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def like_gallery_story(req: func.HttpRequest) -> func.HttpResponse:
    """Like a gallery story."""
    return GalleryHandler.like_gallery_story(req)

@app.route(route="gallery/{storyId}", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def get_story_by_id(req: func.HttpRequest) -> func.HttpResponse:
    """Get a specific story by ID."""
    return GalleryHandler.get_story_by_id(req)

@app.route(route="user/{userId}/stories", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def get_user_stories(req: func.HttpRequest) -> func.HttpResponse:
    """Get all stories by a specific user."""
    return GalleryHandler.get_user_stories(req)

# Manual reset endpoint for testing
@app.route(route="reset-daily-usage", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def reset_daily_usage_manual(req: func.HttpRequest) -> func.HttpResponse:
    """Manually reset daily usage for all users."""
    return UserHandler.reset_daily_usage(req)