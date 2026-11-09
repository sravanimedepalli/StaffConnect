-- ===================================================================
-- StaffConnect - Sample Data Seeder (MySQL)
-- Admin Password: Admin@123
-- Employee Password: Staff@123
-- ===================================================================

USE `staffconnect_db`;

-- Departments
INSERT INTO `departments` (`name`, `code`, `description`, `head_name`, `location`, `budget`) VALUES
('Engineering', 'ENG', 'Core software development, cloud infrastructure, and QA', 'Alex Morgan', 'Building A - Floor 4', 1250000.0),
('Human Resources', 'HR', 'Talent acquisition, employee welfare, and onboarding', 'Marcus Johnson', 'Building B - Floor 2', 350000.0),
('Product & Design', 'PRD', 'Product discovery, user research, and UI/UX design', 'Elena Rostova', 'Building A - Floor 3', 550000.0),
('Marketing', 'MKT', 'Brand management, content growth, and digital outreach', 'David Kim', 'Building B - Floor 3', 650000.0),
('Finance', 'FIN', 'Corporate accounting, financial planning, and audits', 'Priya Patel', 'Building B - Floor 1', 420000.0),
('Sales', 'SLS', 'Global customer acquisition and enterprise partnerships', 'Ananya Sharma', 'Building C - Floor 2', 890000.0)
ON DUPLICATE KEY UPDATE `name`=`name`;

-- Note: The Spring Boot application automatically handles password encryption (BCrypt)
-- and populates initial staff and administrator records on startup via DataInitializer.
