-- ==========================================================================
-- Database initialization script for the Natural Language Database Query tool.
--
-- Creates sample tables and populates them with demo data so the
-- application has something to query out of the box.
--
-- Tables:
--   departments  – organizational departments
--   employees    – employee records with department links
--   projects     – project tracking
--   assignments  – many-to-many link between employees and projects
--   salaries     – historical salary records
-- ==========================================================================

-- ---------------------------------------------------------------------------
-- Departments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    location    VARCHAR(100),
    manager_id  INTEGER,           -- references employees.id (set after employees exist)
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Employees
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
    id              SERIAL PRIMARY KEY,
    first_name      VARCHAR(50) NOT NULL,
    last_name       VARCHAR(50) NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    department_id   INTEGER REFERENCES departments(id),
    hire_date       DATE NOT NULL,
    job_title       VARCHAR(100),
    salary          NUMERIC(12, 2),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add the foreign key for department manager after employees table exists
ALTER TABLE departments
    ADD CONSTRAINT fk_dept_manager
    FOREIGN KEY (manager_id) REFERENCES employees(id);

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    start_date  DATE,
    end_date    DATE,
    budget      NUMERIC(14, 2),
    status      VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Assignments (many-to-many: employees <-> projects)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
    id          SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    project_id  INTEGER NOT NULL REFERENCES projects(id),
    role        VARCHAR(50),           -- e.g. 'lead', 'developer', 'analyst'
    hours_allocated NUMERIC(6, 1),
    assigned_date   DATE DEFAULT CURRENT_DATE,
    UNIQUE(employee_id, project_id)
);

-- ---------------------------------------------------------------------------
-- Salary history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salaries (
    id          SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    amount      NUMERIC(12, 2) NOT NULL,
    effective_date DATE NOT NULL,
    end_date    DATE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================================================
-- Seed data
-- ==========================================================================

-- Departments
INSERT INTO departments (name, location) VALUES
    ('Engineering',     'Building A'),
    ('Data Science',    'Building B'),
    ('Product',         'Building A'),
    ('Marketing',       'Building C'),
    ('Human Resources', 'Building D'),
    ('Finance',         'Building D')
ON CONFLICT (name) DO NOTHING;

-- Employees
INSERT INTO employees (first_name, last_name, email, department_id, hire_date, job_title, salary) VALUES
    ('Alice',   'Johnson',  'alice.johnson@example.com',   1, '2019-03-15', 'Senior Engineer',       135000.00),
    ('Bob',     'Smith',    'bob.smith@example.com',       1, '2020-07-01', 'Staff Engineer',        155000.00),
    ('Carol',   'Williams', 'carol.williams@example.com',  2, '2018-11-20', 'Lead Data Scientist',   145000.00),
    ('David',   'Brown',    'david.brown@example.com',     2, '2021-01-10', 'Data Analyst',          95000.00),
    ('Eve',     'Davis',    'eve.davis@example.com',       3, '2017-06-25', 'VP of Product',         180000.00),
    ('Frank',   'Miller',   'frank.miller@example.com',    3, '2022-02-14', 'Product Manager',       120000.00),
    ('Grace',   'Wilson',   'grace.wilson@example.com',    4, '2020-09-01', 'Marketing Director',    130000.00),
    ('Henry',   'Taylor',   'henry.taylor@example.com',    4, '2023-03-20', 'Content Strategist',    85000.00),
    ('Ivy',     'Anderson', 'ivy.anderson@example.com',    5, '2019-08-12', 'HR Manager',            110000.00),
    ('Jack',    'Thomas',   'jack.thomas@example.com',     6, '2018-04-30', 'Finance Director',      150000.00),
    ('Karen',   'Jackson',  'karen.jackson@example.com',   1, '2021-06-15', 'Software Engineer',     115000.00),
    ('Leo',     'White',    'leo.white@example.com',       1, '2022-09-01', 'Junior Engineer',       90000.00),
    ('Mia',     'Harris',   'mia.harris@example.com',      2, '2023-01-05', 'Data Engineer',         105000.00),
    ('Nathan',  'Martin',   'nathan.martin@example.com',   3, '2020-11-15', 'UX Designer',           100000.00),
    ('Olivia',  'Garcia',   'olivia.garcia@example.com',   6, '2021-03-22', 'Financial Analyst',     95000.00)
ON CONFLICT (email) DO NOTHING;

-- Set department managers
UPDATE departments SET manager_id = 2 WHERE name = 'Engineering';
UPDATE departments SET manager_id = 3 WHERE name = 'Data Science';
UPDATE departments SET manager_id = 5 WHERE name = 'Product';
UPDATE departments SET manager_id = 7 WHERE name = 'Marketing';
UPDATE departments SET manager_id = 9 WHERE name = 'Human Resources';
UPDATE departments SET manager_id = 10 WHERE name = 'Finance';

-- Projects
INSERT INTO projects (name, description, start_date, end_date, budget, status) VALUES
    ('Platform Migration',   'Migrate legacy platform to cloud-native architecture',  '2024-01-01', '2024-12-31', 500000.00, 'active'),
    ('ML Pipeline v2',       'Rebuild the machine learning training pipeline',         '2024-03-01', '2024-09-30', 250000.00, 'active'),
    ('Mobile App Redesign',  'Complete UI/UX overhaul of the mobile application',      '2024-02-15', '2024-08-15', 180000.00, 'active'),
    ('Data Warehouse',       'Build centralized analytics data warehouse',             '2023-06-01', '2024-03-31', 350000.00, 'completed'),
    ('Brand Refresh',        'Update brand guidelines and marketing materials',        '2024-04-01', '2024-07-31', 75000.00,  'active'),
    ('Security Audit',       'Annual security assessment and remediation',             '2024-05-01', '2024-06-30', 120000.00, 'on_hold')
ON CONFLICT DO NOTHING;

-- Assignments
INSERT INTO assignments (employee_id, project_id, role, hours_allocated) VALUES
    (1, 1, 'lead',       40.0),
    (2, 1, 'architect',  30.0),
    (11, 1, 'developer', 40.0),
    (12, 1, 'developer', 40.0),
    (3, 2, 'lead',       35.0),
    (4, 2, 'analyst',    40.0),
    (13, 2, 'engineer',  40.0),
    (6, 3, 'lead',       30.0),
    (14, 3, 'designer',  40.0),
    (5, 3, 'sponsor',    5.0),
    (3, 4, 'lead',       20.0),
    (4, 4, 'analyst',    30.0),
    (7, 5, 'lead',       25.0),
    (8, 5, 'contributor', 40.0),
    (2, 6, 'reviewer',   10.0),
    (11, 6, 'contributor', 20.0)
ON CONFLICT (employee_id, project_id) DO NOTHING;

-- Salary history
INSERT INTO salaries (employee_id, amount, effective_date, end_date) VALUES
    (1, 110000.00, '2019-03-15', '2021-03-14'),
    (1, 125000.00, '2021-03-15', '2023-03-14'),
    (1, 135000.00, '2023-03-15', NULL),
    (2, 130000.00, '2020-07-01', '2022-06-30'),
    (2, 145000.00, '2022-07-01', '2024-06-30'),
    (2, 155000.00, '2024-07-01', NULL),
    (3, 120000.00, '2018-11-20', '2020-11-19'),
    (3, 135000.00, '2020-11-20', '2022-11-19'),
    (3, 145000.00, '2022-11-20', NULL),
    (5, 150000.00, '2017-06-25', '2020-06-24'),
    (5, 165000.00, '2020-06-25', '2022-06-24'),
    (5, 180000.00, '2022-06-25', NULL)
ON CONFLICT DO NOTHING;
