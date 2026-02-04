"""
Configuration settings for the AI Storyboard Weaver server.
Centralizes all environment variables and constants.
"""
import os
from typing import Dict, Any

class Config:
    """Application configuration settings"""
    
    # AI Model Endpoints
    LLM_MODEL_ENDPOINT = os.getenv("LLM_MODEL_ENDPOINT")
    LLM_MODEL_API_KEY = os.getenv("LLM_MODEL_API_KEY")
    DALLE_MODEL_ENDPOINT = os.getenv("DALLE_MODEL_ENDPOINT")
    DALLE_MODEL_API_KEY = os.getenv("DALLE_MODEL_API_KEY")
    
    # Database Configuration
    DB_HOST = os.getenv("DB_HOST")
    DB_NAME = os.getenv("DB_NAME")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_PORT = int(os.getenv("DB_PORT", "3306"))
    
    # Authentication Settings
    JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production")
    JWT_ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS = 1
    REFRESH_TOKEN_EXPIRE_DAYS = 7
    RESET_TOKEN_EXPIRE_HOURS = 1
    VERIFICATION_TOKEN_EXPIRE_DAYS = 1
    
    # Email/SMTP Settings
#    SMTP_SERVER = os.getenv("SMTP_SERVER")
#    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
#    SMTP_USERNAME = os.getenv("SMTP_USERNAME")
#    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
#    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Application Settings
    DAILY_USAGE_LIMIT = 3
    MAX_RETRIES = 3
    PLACEHOLDER_IMAGE_URL = "https://via.placeholder.com/1792x1024/cccccc/333333?text=Image+Generation+Failed"
    
    # Image Generation Settings
    IMAGE_SIZE = "1792x1024"  # 16:9 landscape aspect ratio
    IMAGE_STYLE = "vivid"
    IMAGE_QUALITY = "standard"
    
    # Model Settings
    DEEPSEEK_MODEL_NAME = "weaver-generator"
    DALLE_MODEL_NAME = "weaver-generator-dalle3"
    MAX_TOKENS = 2048
    TEMPERATURE = 0.8
    TOP_P = 0.1
    PRESENCE_PENALTY = 0.0
    FREQUENCY_PENALTY = 0.0
    
    @classmethod
    def get_database_config(cls) -> Dict[str, Any]:
        """Get database connection configuration"""
        return {
            'host': cls.DB_HOST,
            'database': cls.DB_NAME,
            'user': cls.DB_USER,
            'password': cls.DB_PASSWORD,
            'port': cls.DB_PORT,
            'autocommit': True,
            'charset': 'utf8mb4',
            'use_unicode': True
        }
    
    @classmethod
    def validate_config(cls) -> None:
        """Validate that all required configuration is present"""
        # Skip validation if we're in deployment mode
        # (Some environment variables might not be available during deployment)
        if os.getenv("DEPLOYMENT_MODE") == "true":
            return
            
        required_vars = [
            'LLM_MODEL_ENDPOINT', 'LLM_MODEL_API_KEY',
            'DALLE_MODEL_ENDPOINT', 'DALLE_MODEL_API_KEY',
            'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'
        ]
        
        missing_vars = []
        for var in required_vars:
            if not getattr(cls, var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

# Only validate configuration if not in deployment mode
try:
    Config.validate_config()
except ValueError as e:
    # Log warning but don't fail during import
    import logging
    logging.warning(f"Configuration validation failed: {e}")
