/**
 * Database Schema - SQL
 * Run these queries on Neon to set up tables
 */

-- ========================================
-- USERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ========================================
-- CLOTHING ITEMS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS clothing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(100) NOT NULL, -- 'shirt', 'pants', 'dress', 'jacket', etc.
  color VARCHAR(100),
  size VARCHAR(50),
  price DECIMAL(10, 2) NOT NULL,
  image_public_id VARCHAR(255) NOT NULL, -- Cloudinary public ID
  image_url VARCHAR(500) NOT NULL, -- Cloudinary secure URL
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clothing_user_id ON clothing_items(user_id);
CREATE INDEX idx_clothing_type ON clothing_items(type);
CREATE INDEX idx_clothing_created_at ON clothing_items(created_at);

-- ========================================
-- FILES TABLE (For general file uploads)
-- ========================================
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_id VARCHAR(255) NOT NULL UNIQUE,
  url VARCHAR(500) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_public_id ON files(public_id);
