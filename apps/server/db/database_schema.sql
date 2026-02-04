-- =====================================================
-- AI Storyboard Weaver - Complete Database Schema
-- =====================================================
-- This script creates the complete database schema for the AI Storyboard Weaver application
-- Includes both the original schema and authentication enhancements
-- Compatible with MySQL 5.7+ and MariaDB 10.2+

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
-- Main users table supporting both device-based and email-based authentication
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NULL,
    password VARCHAR(255) NULL,
    device_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    daily_usage_count INT DEFAULT 0,
    last_usage_date DATE DEFAULT (CURRENT_DATE),
    is_email_verified BOOLEAN DEFAULT FALSE,
    
    -- Indexes for performance
    INDEX idx_device_id (device_id),
    INDEX idx_email (email),
    INDEX idx_last_usage_date (last_usage_date),
    INDEX idx_email_verified (is_email_verified),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- 2. GALLERY STORIES TABLE
-- =====================================================
-- Stores user-generated storyboards shared in the public gallery
CREATE TABLE gallery_stories (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    frames JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_name VARCHAR(100) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    genre VARCHAR(50),
    style VARCHAR(50),
    total_frames INT DEFAULT 0,
    likes INT DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_updated_at (updated_at),
    INDEX idx_genre (genre),
    INDEX idx_style (style),
    INDEX idx_likes (likes),
    INDEX idx_is_public (is_public),
    INDEX idx_total_frames (total_frames),
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- 3. STORY LIKES TABLE
-- =====================================================
-- Tracks which users liked which stories (many-to-many relationship)
CREATE TABLE story_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure a user can only like a story once
    UNIQUE KEY unique_like (story_id, user_id),
    
    -- Indexes for performance
    INDEX idx_story_id (story_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    
    -- Foreign key constraints
    FOREIGN KEY (story_id) REFERENCES gallery_stories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- 4. PASSWORD RESET TOKENS TABLE
-- =====================================================
-- Stores temporary tokens for password reset functionality
CREATE TABLE password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_password_reset_token (token),
    INDEX idx_password_reset_user_id (user_id),
    INDEX idx_password_reset_expires_at (expires_at),
    
    -- Unique constraint per user (one active reset token per user)
    UNIQUE KEY unique_user_reset_token (user_id)
);

-- =====================================================
-- 5. USER SESSIONS TABLE (Optional - for enhanced security)
-- =====================================================
-- Tracks active user sessions and refresh tokens
CREATE TABLE user_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address VARCHAR(45),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_refresh_token_hash (refresh_token_hash),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_active (is_active),
    INDEX idx_last_used_at (last_used_at),
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Sample users (mix of device-based and email-based)
INSERT INTO users (id, name, email, password, device_id, daily_usage_count, last_usage_date, is_email_verified) VALUES
-- Email-based users (password would be hashed in real application)
('user-email-1', 'Alice Creator', 'alice@example.com', '$2b$12$placeholder_hash_1', NULL, 2, CURRENT_DATE, TRUE),
('user-email-2', 'Bob Storyteller', 'bob@example.com', '$2b$12$placeholder_hash_2', NULL, 1, CURRENT_DATE, TRUE),
('user-email-3', 'Carol Artist', 'carol@example.com', '$2b$12$placeholder_hash_3', NULL, 0, CURRENT_DATE - INTERVAL 1 DAY, FALSE),

-- Device-based users (for backward compatibility)
('user-device-1', 'Device User 1', NULL, NULL, 'device-abc123', 1, CURRENT_DATE, FALSE),
('user-device-2', 'Device User 2', NULL, NULL, 'device-def456', 3, CURRENT_DATE, FALSE),
('user-device-3', 'Device User 3', NULL, NULL, 'device-ghi789', 0, CURRENT_DATE - INTERVAL 2 DAY, FALSE);

-- Sample gallery stories
INSERT INTO gallery_stories (
    id, title, description, frames, user_name, user_id, 
    genre, style, total_frames, likes, is_public
) VALUES
(
    'story-1',
    'The Mysterious Forest',
    'A young adventurer discovers an enchanted forest filled with magical creatures.',
    '[
        {
            "panel_number": 1,
            "scene_description": "A young person stands at the edge of a dark forest",
            "visual_elements": ["forest", "character", "mysterious lighting"],
            "camera_angle": "Wide Shot",
            "mood": "Mysterious",
            "image_url": "https://example.com/image1.jpg"
        },
        {
            "panel_number": 2,
            "scene_description": "Magical creatures peek from behind trees",
            "visual_elements": ["magical creatures", "trees", "glowing eyes"],
            "camera_angle": "Medium Shot", 
            "mood": "Mysterious",
            "image_url": "https://example.com/image2.jpg"
        }
    ]',
    'Alice Creator',
    'user-email-1',
    'Fantasy',
    'Cinematic',
    2,
    5,
    TRUE
),
(
    'story-2',
    'Space Adventure',
    'A thrilling journey through the cosmos in search of a new home planet.',
    '[
        {
            "panel_number": 1,
            "scene_description": "A sleek spaceship launches from Earth",
            "visual_elements": ["spaceship", "Earth", "stars", "launch pad"],
            "camera_angle": "Low Angle",
            "mood": "Epic",
            "image_url": "https://example.com/space1.jpg"
        },
        {
            "panel_number": 2,
            "scene_description": "Crew members in zero gravity discussing their mission",
            "visual_elements": ["astronauts", "zero gravity", "control panel"],
            "camera_angle": "Medium Shot",
            "mood": "Focused",
            "image_url": "https://example.com/space2.jpg"
        },
        {
            "panel_number": 3,
            "scene_description": "Discovery of a beautiful alien planet",
            "visual_elements": ["alien planet", "colorful atmosphere", "spaceship"],
            "camera_angle": "Wide Shot",
            "mood": "Wonder",
            "image_url": "https://example.com/space3.jpg"
        }
    ]',
    'Bob Storyteller',
    'user-email-2',
    'Sci-Fi',
    'Realistic',
    3,
    12,
    TRUE
),
(
    'story-3',
    'The Lost Treasure',
    'Pirates embark on a dangerous quest to find legendary treasure.',
    '[
        {
            "panel_number": 1,
            "scene_description": "Old pirate captain studying a treasure map",
            "visual_elements": ["pirate", "treasure map", "candlelight", "wooden table"],
            "camera_angle": "Close-up",
            "mood": "Mysterious",
            "image_url": "https://example.com/pirate1.jpg"
        },
        {
            "panel_number": 2,
            "scene_description": "Pirate ship sailing through stormy seas",
            "visual_elements": ["pirate ship", "storm", "waves", "dark clouds"],
            "camera_angle": "Wide Shot",
            "mood": "Dramatic",
            "image_url": "https://example.com/pirate2.jpg"
        }
    ]',
    'Device User 1',
    'user-device-1',
    'Adventure',
    'Cartoon',
    2,
    8,
    TRUE
);

-- Sample story likes
INSERT INTO story_likes (story_id, user_id) VALUES
('story-1', 'user-email-2'),
('story-1', 'user-email-3'),
('story-1', 'user-device-1'),
('story-1', 'user-device-2'),
('story-1', 'user-device-3'),
('story-2', 'user-email-1'),
('story-2', 'user-email-3'),
('story-2', 'user-device-1'),
('story-3', 'user-email-1'),
('story-3', 'user-email-2');

-- =====================================================
-- USEFUL VIEWS FOR ANALYTICS
-- =====================================================

-- View to get user statistics
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.created_at,
    u.daily_usage_count,
    u.last_usage_date,
    u.is_email_verified,
    COUNT(gs.id) as total_stories,
    COALESCE(SUM(gs.likes), 0) as total_likes_received,
    (SELECT COUNT(*) FROM story_likes sl WHERE sl.user_id = u.id) as total_likes_given
FROM users u
LEFT JOIN gallery_stories gs ON u.id = gs.user_id
GROUP BY u.id, u.name, u.email, u.created_at, u.daily_usage_count, u.last_usage_date, u.is_email_verified;

-- View to get popular stories
CREATE VIEW popular_stories AS
SELECT 
    gs.*,
    u.email as user_email,
    COUNT(sl.id) as like_count
FROM gallery_stories gs
JOIN users u ON gs.user_id = u.id
LEFT JOIN story_likes sl ON gs.id = sl.story_id
WHERE gs.is_public = TRUE
GROUP BY gs.id
ORDER BY like_count DESC, gs.created_at DESC;

-- =====================================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- =====================================================

DELIMITER //

-- Procedure to reset daily usage for all users
CREATE PROCEDURE ResetDailyUsage()
BEGIN
    UPDATE users 
    SET daily_usage_count = 0, last_usage_date = CURRENT_DATE
    WHERE last_usage_date < CURRENT_DATE;
    
    SELECT ROW_COUNT() as users_reset;
END //

-- Procedure to clean up expired sessions
CREATE PROCEDURE CleanupExpiredSessions()
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR is_active = FALSE;
    
    SELECT ROW_COUNT() as sessions_cleaned;
END //

-- Procedure to clean up expired password reset tokens
CREATE PROCEDURE CleanupExpiredPasswordResets()
BEGIN
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW() OR is_used = TRUE;
    
    SELECT ROW_COUNT() as tokens_cleaned;
END //

-- Function to get user's remaining daily usage
CREATE FUNCTION GetRemainingUsage(user_id_param VARCHAR(36))
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE current_usage INT DEFAULT 0;
    DECLARE last_date DATE;
    
    SELECT daily_usage_count, last_usage_date 
    INTO current_usage, last_date
    FROM users 
    WHERE id = user_id_param;
    
    -- If last usage was not today, reset usage count
    IF last_date != CURRENT_DATE THEN
        SET current_usage = 0;
    END IF;
    
    RETURN GREATEST(0, 3 - current_usage);
END //

DELIMITER ;

-- =====================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_users_email_verified ON users(email, is_email_verified);
CREATE INDEX idx_users_usage_date ON users(last_usage_date, daily_usage_count);
CREATE INDEX idx_gallery_public_likes ON gallery_stories(is_public, likes DESC);
CREATE INDEX idx_gallery_user_public ON gallery_stories(user_id, is_public, created_at DESC);
CREATE INDEX idx_gallery_genre_public ON gallery_stories(genre, is_public, created_at DESC);

-- =====================================================
-- TRIGGERS FOR DATA INTEGRITY
-- =====================================================

DELIMITER //

-- Trigger to update gallery story likes count
CREATE TRIGGER update_story_likes_count
AFTER INSERT ON story_likes
FOR EACH ROW
BEGIN
    UPDATE gallery_stories 
    SET likes = (
        SELECT COUNT(*) 
        FROM story_likes 
        WHERE story_id = NEW.story_id
    )
    WHERE id = NEW.story_id;
END //

-- Trigger to update gallery story likes count on delete
CREATE TRIGGER update_story_likes_count_delete
AFTER DELETE ON story_likes
FOR EACH ROW
BEGIN
    UPDATE gallery_stories 
    SET likes = (
        SELECT COUNT(*) 
        FROM story_likes 
        WHERE story_id = OLD.story_id
    )
    WHERE id = OLD.story_id;
END //

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER update_gallery_stories_timestamp
BEFORE UPDATE ON gallery_stories
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

DELIMITER ;

-- =====================================================
-- SECURITY AND MAINTENANCE
-- =====================================================

-- Create a database user for the application (run these manually with proper credentials)
-- CREATE USER 'storyboard_app'@'%' IDENTIFIED BY 'secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON storyboard_db.* TO 'storyboard_app'@'%';
-- GRANT EXECUTE ON storyboard_db.* TO 'storyboard_app'@'%';
-- FLUSH PRIVILEGES;

-- =====================================================
-- NOTES FOR DEPLOYMENT
-- =====================================================

/*
DEPLOYMENT CHECKLIST:

1. Database Setup:
   - Create database: CREATE DATABASE storyboard_weaver_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   - Run this entire script
   - Verify all tables, views, and procedures are created

2. Environment Variables:
   - DB_HOST: Your database host
   - DB_NAME: storyboard_weaver_db (or your chosen name)
   - DB_USER: storyboard_app (or your chosen username)
   - DB_PASSWORD: Your secure password
   - DB_PORT: 3306 (default MySQL port)
   - JWT_SECRET: Generate a strong random secret

3. Security:
   - Change all placeholder passwords
   - Use strong, unique passwords for database users
   - Enable SSL/TLS for database connections
   - Set up regular backups
   - Monitor for suspicious activity

4. Performance:
   - Set up query caching if available
   - Monitor slow queries
   - Consider read replicas for high traffic
   - Set up monitoring and alerts

5. Maintenance:
   - Schedule daily execution of ResetDailyUsage()
   - Schedule weekly execution of CleanupExpiredSessions()
   - Schedule weekly execution of CleanupExpiredPasswordResets()
   - Set up automated backups
   - Monitor disk space and performance metrics

6. Migration from Existing Data:
   - If migrating from device-only users, existing data will work as-is
   - Users can gradually upgrade to email authentication
   - No data loss during migration
*/
