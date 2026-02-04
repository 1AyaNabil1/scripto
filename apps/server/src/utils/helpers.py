"""
Utility functions for the AI Storyboard Weaver server.
Contains reusable helper functions and decorators.
"""
import json
import logging
import functools
from typing import Dict, Any, Callable
import azure.functions as func
from ..models import APIError, ValidationError

def create_json_response(data: Any, status_code: int = 200) -> func.HttpResponse:
    """Create a standardized JSON HTTP response"""
    return func.HttpResponse(
        json.dumps(data, default=str),
        status_code=status_code,
        mimetype="application/json",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
    )

def create_error_response(message: str, status_code: int = 500) -> func.HttpResponse:
    """Create a standardized error response"""
    return create_json_response({"error": message}, status_code)

def validate_json_request(req: func.HttpRequest) -> Dict[str, Any]:
    """Validate and parse JSON request body"""
    try:
        req_body = req.get_json()
        if not req_body:
            raise ValidationError("Request body required")
        return req_body
    except ValueError:
        raise ValidationError("Invalid JSON input")

def error_handler(func: Callable) -> Callable:
    """Decorator to handle exceptions and return appropriate responses"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except APIError as e:
            logging.error(f"API Error in {func.__name__}: {e.message}")
            return create_error_response(e.message, e.status_code)
        except Exception as e:
            logging.error(f"Unexpected error in {func.__name__}: {str(e)}")
            return create_error_response("An unexpected error occurred", 500)
    return wrapper

def log_request(func: Callable) -> Callable:
    """Decorator to log HTTP requests"""
    @functools.wraps(func)
    def wrapper(req, *args, **kwargs):
        logging.info(f"Processing {req.method} request to {req.url}")
        result = func(req, *args, **kwargs)
        logging.info(f"Request processed with status {result.status_code}")
        return result
    return wrapper

def clean_db_response(data: Dict[str, Any]) -> Dict[str, Any]:
    """Clean database response by converting snake_case to camelCase"""
    field_mapping = {
        'created_at': 'createdAt',
        'last_usage_date': 'lastUsageDate', 
        'daily_usage_count': 'dailyUsageCount',
        'device_id': 'deviceId',
        'user_name': 'userName',
        'user_id': 'userId',
        'total_frames': 'totalFrames',
        'is_public': 'isPublic'
    }
    
    cleaned = {}
    for key, value in data.items():
        new_key = field_mapping.get(key, key)
        
        # Convert dates to ISO format
        if key in ['created_at', 'last_usage_date'] and value:
            try:
                cleaned[new_key] = value.isoformat() if hasattr(value, 'isoformat') else value
            except:
                cleaned[new_key] = str(value)
        else:
            cleaned[new_key] = value
    
    return cleaned

def validate_required_fields(data: Dict[str, Any], required_fields: list) -> None:
    """Validate that all required fields are present in data"""
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    if missing_fields:
        raise ValidationError(f"Missing required fields: {', '.join(missing_fields)}")

def truncate_string(text: str, max_length: int) -> str:
    """Truncate string to maximum length"""
    return text[:max_length] if len(text) > max_length else text

def safe_json_loads(json_str: str, default=None):
    """Safely load JSON string with fallback"""
    try:
        return json.loads(json_str) if json_str else default
    except (json.JSONDecodeError, TypeError):
        return default

def build_pagination_query(base_query: str, limit: int = 100, offset: int = 0) -> tuple:
    """Build paginated query with limit and offset"""
    paginated_query = f"{base_query} LIMIT %s OFFSET %s"
    return paginated_query, (limit, offset)
