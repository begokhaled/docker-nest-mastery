-- =============================================================================
-- PostgreSQL Initial Setup Script
-- Executed automatically on container first initialization by /docker-entrypoint-initdb.d
-- =============================================================================

-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
    RAISE NOTICE 'PostgreSQL init.sql executed: uuid-ossp extension enabled.';
END $$;
