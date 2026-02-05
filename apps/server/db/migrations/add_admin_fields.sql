-- =====================================================
-- Migration: Add Admin Fields to Users Table
-- =====================================================
-- Run this migration if you have an existing database
-- that needs the admin role columns added.
--
-- Usage:
--   mysql -u root -p scripto < add_admin_fields.sql
-- =====================================================

-- Add is_admin column if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = "users";
SET @columnname = "is_admin";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column is_admin already exists'",
  "ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add role column if it doesn't exist
SET @columnname = "role";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column role already exists'",
  "ALTER TABLE users ADD COLUMN role ENUM('user', 'admin', 'superadmin') DEFAULT 'user'"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index on is_admin if it doesn't exist
SET @indexname = "idx_is_admin";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname)
  ) > 0,
  "SELECT 'Index idx_is_admin already exists'",
  "CREATE INDEX idx_is_admin ON users (is_admin)"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index on role if it doesn't exist
SET @indexname = "idx_role";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname)
  ) > 0,
  "SELECT 'Index idx_role already exists'",
  "CREATE INDEX idx_role ON users (role)"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verify the changes
SELECT 'Migration completed. Checking changes:' as status;
DESCRIBE users;
