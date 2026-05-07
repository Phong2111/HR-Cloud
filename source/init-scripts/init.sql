-- HR Cloud Platform - SQL Server Initialization Script
-- Matches the structure in HRCloud.sql exactly

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'HRCloud')
BEGIN
    CREATE DATABASE HRCloud;
END
GO

USE HRCloud;
GO

-- Staff table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Staff')
BEGIN
    CREATE TABLE Staff (
        ID INT PRIMARY KEY,
        Name NVARCHAR(100),
        ManagerID INT,
        Salary INT,
        LeaveBalance INT,
        Department NVARCHAR(100),
        RoleTitle NVARCHAR(100),
        DocumentFolder NVARCHAR(255)
    );

    INSERT INTO Staff VALUES (1, N'CEO', NULL, 10000, 30, N'Executive', N'Chief Executive Officer', N'/uploads/staffs/staff_1/');
    INSERT INTO Staff VALUES (2, N'Manager A', 1, 7000, 20, N'Engineering', N'Engineering Manager', N'/uploads/staffs/staff_2/');
    INSERT INTO Staff VALUES (3, N'Manager B', 1, 7000, 20, N'Human Resources', N'HR Manager', N'/uploads/staffs/staff_3/');
    INSERT INTO Staff VALUES (4, N'Employee A', 2, 4000, 15, N'Engineering', N'Backend Developer', N'/uploads/staffs/staff_4/');
    INSERT INTO Staff VALUES (5, N'Employee B', 2, 4000, 15, N'Engineering', N'Frontend Developer', N'/uploads/staffs/staff_5/');
    INSERT INTO Staff VALUES (6, N'Employee C', 3, 4000, 15, N'Human Resources', N'Talent Acquisition Executive', N'/uploads/staffs/staff_6/');

    PRINT 'Staff table created and seeded.';
END
GO

IF COL_LENGTH('Staff', 'Department') IS NULL
BEGIN
    ALTER TABLE Staff ADD Department NVARCHAR(100) NULL;
END
GO

IF COL_LENGTH('Staff', 'RoleTitle') IS NULL
BEGIN
    ALTER TABLE Staff ADD RoleTitle NVARCHAR(100) NULL;
END
GO

IF COL_LENGTH('Staff', 'DocumentFolder') IS NULL
BEGIN
    ALTER TABLE Staff ADD DocumentFolder NVARCHAR(255) NULL;
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'Staff')
      AND name = 'Name'
      AND system_type_id = 167
)
BEGIN
    ALTER TABLE Staff ALTER COLUMN Name NVARCHAR(100) NULL;
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'Staff')
      AND name = 'Department'
      AND system_type_id = 167
)
BEGIN
    ALTER TABLE Staff ALTER COLUMN Department NVARCHAR(100) NULL;
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'Staff')
      AND name = 'RoleTitle'
      AND system_type_id = 167
)
BEGIN
    ALTER TABLE Staff ALTER COLUMN RoleTitle NVARCHAR(100) NULL;
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'Staff')
      AND name = 'DocumentFolder'
      AND system_type_id = 167
)
BEGIN
    ALTER TABLE Staff ALTER COLUMN DocumentFolder NVARCHAR(255) NULL;
END
GO

UPDATE Staff
SET Department = CASE
    WHEN ManagerID IS NULL THEN N'Executive'
    WHEN ManagerID = 1 THEN N'Engineering'
    ELSE N'General'
END
WHERE Department IS NULL;
GO

UPDATE Staff
SET RoleTitle = CASE
    WHEN ManagerID IS NULL THEN N'Chief Executive Officer'
    WHEN ManagerID = 1 THEN N'Department Manager'
    ELSE N'Staff'
END
WHERE RoleTitle IS NULL;
GO

-- Departments table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Departments')
BEGIN
    CREATE TABLE Departments (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL UNIQUE,
        Description NVARCHAR(255)
    );

    INSERT INTO Departments (Name, Description) VALUES (N'Executive', N'Ban giám đốc điều hành');
    INSERT INTO Departments (Name, Description) VALUES (N'Engineering', N'Phòng kỹ thuật và phát triển phần mềm');
    INSERT INTO Departments (Name, Description) VALUES (N'Human Resources', N'Phòng nhân sự');
    INSERT INTO Departments (Name, Description) VALUES (N'General', N'Phòng chung');

    PRINT 'Departments table created and seeded.';
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'Departments')
      AND name = 'Name'
      AND system_type_id = 167
)
BEGIN
    ALTER TABLE Departments ALTER COLUMN Name NVARCHAR(100) NOT NULL;
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'Departments')
      AND name = 'Description'
      AND system_type_id = 167
)
BEGIN
    ALTER TABLE Departments ALTER COLUMN Description NVARCHAR(255) NULL;
END
GO

UPDATE Departments
SET Description = CASE Name
    WHEN N'Executive' THEN N'Ban giám đốc điều hành'
    WHEN N'Engineering' THEN N'Phòng kỹ thuật và phát triển phần mềm'
    WHEN N'Human Resources' THEN N'Phòng nhân sự'
    WHEN N'General' THEN N'Phòng chung'
    ELSE Description
END
WHERE Name IN (N'Executive', N'Engineering', N'Human Resources', N'General');
GO

INSERT INTO Departments (Name, Description)
SELECT DISTINCT
    LTRIM(RTRIM(s.Department)) AS Name,
    N'Đồng bộ từ dữ liệu nhân viên hiện có' AS Description
FROM Staff s
WHERE s.Department IS NOT NULL
  AND LTRIM(RTRIM(s.Department)) <> ''
  AND NOT EXISTS (
      SELECT 1
      FROM Departments d
      WHERE LOWER(d.Name) = LOWER(LTRIM(RTRIM(s.Department)))
  );
GO

-- LeaveRecords table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LeaveRecords')
BEGIN
    CREATE TABLE LeaveRecords (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        StaffID INT,
        Days INT,
        Status NVARCHAR(20),
        FOREIGN KEY (StaffID) REFERENCES Staff(ID)
    );

    PRINT 'LeaveRecords table created.';
END
GO

-- Stored Procedure: ApproveLeave
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'ApproveLeave')
    DROP PROCEDURE ApproveLeave;
GO

CREATE PROCEDURE ApproveLeave
    @staff_id INT,
    @days INT
AS
BEGIN
    DECLARE @balance INT;

    SELECT @balance = LeaveBalance
    FROM Staff
    WHERE ID = @staff_id;

    IF @balance >= @days
    BEGIN
        UPDATE Staff
        SET LeaveBalance = LeaveBalance - @days
        WHERE ID = @staff_id;

        INSERT INTO LeaveRecords (StaffID, Days, Status)
        VALUES (@staff_id, @days, N'Approved');
    END
    ELSE
    BEGIN
        PRINT 'Not enough leave days';
    END
END
GO

-- Users table (for Identity Service)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(200) NOT NULL UNIQUE,
        full_name NVARCHAR(150),
        role VARCHAR(20) NOT NULL DEFAULT 'EMPLOYEE',
        is_active BIT NOT NULL DEFAULT 1
    );

    INSERT INTO users (username, password, email, full_name, role, is_active)
    VALUES ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIvi', 'admin@hrcloud.com', N'System Admin', 'ADMIN', 1);

    PRINT 'Users table created with default admin.';
END
GO

PRINT 'HR Cloud database initialized successfully.';
GO

-- =====================================================
-- NEW COLUMNS: Candidate Recruitment Fields (2026-05-07)
-- =====================================================
IF COL_LENGTH('Staff', 'CandidateID') IS NULL
BEGIN
    ALTER TABLE Staff ADD CandidateID NVARCHAR(100) NULL;
END
GO

IF COL_LENGTH('Staff', 'CandidateEmail') IS NULL
BEGIN
    ALTER TABLE Staff ADD CandidateEmail NVARCHAR(150) NULL;
END
GO

IF COL_LENGTH('Staff', 'CandidatePhone') IS NULL
BEGIN
    ALTER TABLE Staff ADD CandidatePhone NVARCHAR(50) NULL;
END
GO

IF COL_LENGTH('Staff', 'CandidateIndustry') IS NULL
BEGIN
    ALTER TABLE Staff ADD CandidateIndustry NVARCHAR(100) NULL;
END
GO

IF COL_LENGTH('Staff', 'CandidatePosition') IS NULL
BEGIN
    ALTER TABLE Staff ADD CandidatePosition NVARCHAR(100) NULL;
END
GO

IF COL_LENGTH('Staff', 'CandidateSkills') IS NULL
BEGIN
    ALTER TABLE Staff ADD CandidateSkills NVARCHAR(500) NULL;
END
GO

IF COL_LENGTH('Staff', 'CandidateExperience') IS NULL
BEGIN
    ALTER TABLE Staff ADD CandidateExperience INT NULL;
END
GO

IF COL_LENGTH('Staff', 'RecruitedAt') IS NULL
BEGIN
    ALTER TABLE Staff ADD RecruitedAt DATETIME NULL;
END
GO

PRINT 'Added candidate recruitment columns to Staff table.';
GO
