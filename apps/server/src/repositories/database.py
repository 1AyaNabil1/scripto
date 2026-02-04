"""
Database service layer for the AI Storyboard Weaver application.
Handles all database operations with proper error handling and connection management.
"""
import mysql.connector
import logging
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, date
from src.config.settings import Config
from src.models import User, GalleryStory, NotFoundError

class DatabaseService:
    """Database service for managing all database operations"""
    
    def __init__(self):
        self.connection_config = Config.get_database_config()
    
    def get_connection(self):
        """Get a database connection with error handling"""
        try:
            logging.info(f"Connecting to database: {self.connection_config['host']}:{self.connection_config['port']}")
            connection = mysql.connector.connect(**self.connection_config)
            logging.info("Database connection successful")
            return connection
        except mysql.connector.Error as err:
            logging.error(f"Database connection error: {err}")
            raise
    
    def execute_query(self, query: str, params: tuple = None, fetch_one: bool = False, fetch_all: bool = True) -> Any:
        """Execute a query with proper connection handling"""
        connection = None
        cursor = None
        try:
            connection = self.get_connection()
            cursor = connection.cursor(dictionary=True)
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            if query.strip().upper().startswith('SELECT'):
                if fetch_one:
                    return cursor.fetchone()
                elif fetch_all:
                    return cursor.fetchall()
            else:
                # For INSERT, UPDATE, DELETE
                connection.commit()
                return cursor.lastrowid if query.strip().upper().startswith('INSERT') else cursor.rowcount
                
        except mysql.connector.Error as err:
            logging.error(f"Database query error: {err}")
            if connection:
                connection.rollback()
            raise
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    # User Management Methods
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        query = "SELECT * FROM users WHERE id = %s"
        row = self.execute_query(query, (user_id,), fetch_one=True)
        return User.from_db_row(row) if row else None
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        query = "SELECT * FROM users WHERE email = %s"
        row = self.execute_query(query, (email,), fetch_one=True)
        return User.from_db_row(row) if row else None
    
    def create_user(self, user_data: Dict) -> User:
        """Create a new user (legacy method for device-based users)"""
        query = """
        INSERT INTO users (id, name, device_id, created_at, daily_usage_count, last_usage_date)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        params = (
            user_data['id'],
            user_data['name'],
            user_data['deviceId'],
            user_data.get('createdAt', datetime.utcnow()),
            user_data.get('dailyUsageCount', 0),
            user_data.get('lastUsageDate', date.today())
        )
        self.execute_query(query, params)
        return self.get_user_by_id(user_data['id'])
    
    def create_user_with_auth(self, user_data: Dict) -> User:
        """Create a new user with authentication (email/password)"""
        query = """
        INSERT INTO users (id, name, email, password, created_at, daily_usage_count, last_usage_date, is_email_verified)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            user_data['id'],
            user_data['name'],
            user_data['email'],
            user_data['password'],
            user_data.get('createdAt', datetime.utcnow()),
            user_data.get('dailyUsageCount', 0),
            user_data.get('lastUsageDate', date.today()),
            user_data.get('isEmailVerified', False)
        )
        self.execute_query(query, params)
        return self.get_user_by_id(user_data['id'])
    
    def update_user_usage(self, user_id: str, daily_usage_count: int, last_usage_date: str) -> User:
        """Update user usage count"""
        query = """
        UPDATE users 
        SET daily_usage_count = %s, last_usage_date = %s 
        WHERE id = %s
        """
        rows_affected = self.execute_query(query, (daily_usage_count, last_usage_date, user_id))
        if rows_affected == 0:
            raise NotFoundError("User not found")
        return self.get_user_by_id(user_id)
    
    def update_user_profile(self, user_id: str, update_data: Dict) -> User:
        """Update user profile information"""
        if not update_data:
            return self.get_user_by_id(user_id)
        
        # Build dynamic query based on provided fields
        set_clauses = []
        params = []
        
        for field, value in update_data.items():
            if field in ['name', 'email']:  # Only allow certain fields to be updated
                set_clauses.append(f"{field} = %s")
                params.append(value)
        
        if not set_clauses:
            return self.get_user_by_id(user_id)
        
        query = f"UPDATE users SET {', '.join(set_clauses)} WHERE id = %s"
        params.append(user_id)
        
        rows_affected = self.execute_query(query, params)
        if rows_affected == 0:
            raise NotFoundError("User not found")
        return self.get_user_by_id(user_id)
    
    def update_user_password(self, user_id: str, hashed_password: str) -> bool:
        """Update user password"""
        query = "UPDATE users SET password = %s WHERE id = %s"
        rows_affected = self.execute_query(query, (hashed_password, user_id))
        return rows_affected > 0
    
    def update_email_verification(self, user_id: str, is_verified: bool) -> bool:
        """Update email verification status"""
        query = "UPDATE users SET is_email_verified = %s WHERE id = %s"
        rows_affected = self.execute_query(query, (is_verified, user_id))
        return rows_affected > 0
    
    # Gallery Management Methods
    def get_gallery_stories(self, limit: int = 100, offset: int = 0) -> List[GalleryStory]:
        """Get all public gallery stories"""
        query = """
        SELECT gs.*, 
               (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = gs.id) as likes
        FROM gallery_stories gs 
        WHERE is_public = TRUE 
        ORDER BY created_at DESC 
        LIMIT %s OFFSET %s
        """
        rows = self.execute_query(query, (limit, offset))
        return [GalleryStory.from_db_row(row) for row in rows]
    
    def get_story_by_id(self, story_id: str) -> Optional[GalleryStory]:
        """Get a story by ID"""
        query = """
        SELECT gs.*, 
               (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = gs.id) as likes
        FROM gallery_stories gs 
        WHERE gs.id = %s
        """
        row = self.execute_query(query, (story_id,), fetch_one=True)
        return GalleryStory.from_db_row(row) if row else None
    
    def add_story_to_gallery(self, story_data: Dict) -> GalleryStory:
        """Add a story to the gallery"""
        import uuid
        story_id = str(uuid.uuid4())
        
        query = """
        INSERT INTO gallery_stories 
        (id, title, description, frames, user_name, user_id, genre, style, total_frames, is_public)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        frames_json = json.dumps(story_data['frames']) if story_data['frames'] else '[]'
        total_frames = len(story_data['frames']) if story_data['frames'] else 0
        
        params = (
            story_id,
            story_data['title'],
            story_data['description'],
            frames_json,
            story_data['user_name'],
            story_data['user_id'],
            story_data.get('genre', ''),
            story_data.get('style', ''),
            total_frames,
            story_data.get('is_public', True)
        )
        
        self.execute_query(query, params)
        return self.get_story_by_id(story_id)
    
    def toggle_story_like(self, story_id: str, user_id: str) -> bool:
        """Like or unlike a story (toggle)"""
        # Check if user already liked this story
        check_query = "SELECT id FROM story_likes WHERE story_id = %s AND user_id = %s"
        existing_like = self.execute_query(check_query, (story_id, user_id), fetch_one=True)
        
        if existing_like:
            # Unlike the story
            delete_query = "DELETE FROM story_likes WHERE story_id = %s AND user_id = %s"
            self.execute_query(delete_query, (story_id, user_id))
        else:
            # Like the story
            insert_query = "INSERT INTO story_likes (story_id, user_id) VALUES (%s, %s)"
            self.execute_query(insert_query, (story_id, user_id))
        
        return True
    
    def get_user_stories(self, user_id: str) -> List[GalleryStory]:
        """Get all stories by a specific user"""
        query = """
        SELECT gs.*, 
               (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = gs.id) as likes
        FROM gallery_stories gs 
        WHERE user_id = %s 
        ORDER BY created_at DESC
        """
        rows = self.execute_query(query, (user_id,))
        return [GalleryStory.from_db_row(row) for row in rows]
    
    def reset_daily_usage(self) -> int:
        """Reset daily usage count for all users"""
        query = "UPDATE users SET daily_usage_count = 0"
        return self.execute_query(query, fetch_all=False)

    # Password Reset Methods
    async def store_password_reset_token(self, user_id: str, token: str, expires_at: datetime) -> None:
        """Store password reset token in database"""
        query = """
        INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) 
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE 
        token = VALUES(token), 
        expires_at = VALUES(expires_at), 
        created_at = VALUES(created_at)
        """
        self.execute_query(query, (user_id, token, expires_at, datetime.utcnow()), fetch_all=False)

    async def verify_password_reset_token(self, token: str) -> Optional[str]:
        """Verify reset token and return user_id if valid"""
        query = """
        SELECT user_id FROM password_reset_tokens 
        WHERE token = %s AND expires_at > %s
        """
        result = self.execute_query(query, (token, datetime.utcnow()), fetch_one=True)
        return result['user_id'] if result else None

    async def delete_password_reset_token(self, token: str) -> None:
        """Delete used password reset token"""
        query = "DELETE FROM password_reset_tokens WHERE token = %s"
        self.execute_query(query, (token,), fetch_all=False)

    async def update_user_password(self, user_id: str, hashed_password: str) -> None:
        """Update user password"""
        query = "UPDATE users SET password = %s WHERE id = %s"
        self.execute_query(query, (hashed_password, user_id), fetch_all=False)

# Global database service instance
db_service = DatabaseService()
