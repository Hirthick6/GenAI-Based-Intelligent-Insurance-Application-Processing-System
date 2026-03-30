-- Database initialization script for TCE Insurance Document Processor
-- This script runs automatically when the database container is first created

-- Create database if it doesn't exist (handled by POSTGRES_DB env var)
-- This file can be used for additional initialization

-- Set timezone
SET timezone = 'UTC';

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE tce_project TO postgres;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'TCE Database initialized successfully';
END $$;
