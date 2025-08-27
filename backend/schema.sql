-- CRM Database Schema
CREATE DATABASE IF NOT EXISTS crm_db;
USE crm_db;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'caller') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Records table
CREATE TABLE records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caller_id INT,
    phone_number VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    response TEXT,
    notes TEXT,
    visit ENUM('yes', 'no', 'pending') DEFAULT 'pending',
    visit_by INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (visit_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_caller_id (caller_id),
    INDEX idx_phone_number (phone_number),
    INDEX idx_updated_at (updated_at)
);

-- Tasks table
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_to INT NOT NULL,
    assigned_by INT NOT NULL,
    deadline DATETIME,
    status ENUM('pending', 'in_progress', 'completed', 'overdue') DEFAULT 'pending',
    progress INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_status (status),
    INDEX idx_deadline (deadline)
);