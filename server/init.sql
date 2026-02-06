-- Database initialization script for Anime Ranker
-- Run this on your MariaDB server to set up the database

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS anime_ranker;
USE anime_ranker;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  anilist_id INT UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(512),
  access_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create rankings table
CREATE TABLE IF NOT EXISTS rankings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user (user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_anilist_id ON users(anilist_id);

-- Grant permissions (adjust password as needed)
-- CREATE USER IF NOT EXISTS 'anime_ranker'@'%' IDENTIFIED BY 'your_secure_password';
-- GRANT ALL PRIVILEGES ON anime_ranker.* TO 'anime_ranker'@'%';
-- FLUSH PRIVILEGES;
