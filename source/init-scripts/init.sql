-- HR Cloud Platform - SQL Server Initialization Script
-- Matches the structure in HRCloud.sql exactly

USE master;
GO

-- Create database if not exists
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'HRCloud')
BEGIN
    CREATE DATABASE HRCloud;
END
GO

USE HRCloud;
GO

-- ─── Staff table ─────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Staff')
BEGIN
    CREATE TABLE Staff (
        ID INT PRIMARY KEY,
        Name VARCHAR(100),
        ManagerID INT,
        Salary INT,
        LeaveBalance INT
    );

    -- Seed data from HRCloud.sql
    INSERT INTO Staff VALUES (1, 'CEO', NULL, 10000, 30);
    INSERT INTO Staff VALUES (2, 'Manager A', 1, 7000, 20);
    INSERT INTO Staff VALUES (3, 'Manager B', 1, 7000, 20);
    INSERT INTO Staff VALUES (4, 'Employee A', 2, 4000, 15);
    INSERT INTO Staff VALUES (5, 'Employee B', 2, 4000, 15);
    INSERT INTO Staff VALUES (6, 'Employee C', 3, 4000, 15);

    PRINT 'Staff table created and seeded.';
END
GO

-- ─── LeaveRecords table ────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LeaveRecords')
BEGIN
    CREATE TABLE LeaveRecords (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        StaffID INT,
        Days INT,
        Status VARCHAR(20),
        FOREIGN KEY (StaffID) REFERENCES Staff(ID)
    );

    PRINT 'LeaveRecords table created.';
END
GO

-- ─── Stored Procedure: ApproveLeave ──────────────────────────────
-- Matches HRCloud.sql exactly: checks balance, deducts, inserts record atomically
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
        VALUES (@staff_id, @days, 'Approved');
    END
    ELSE
    BEGIN
        PRINT 'Not enough leave days';
    END
END
GO

-- ─── Users table (for Identity Service) ──────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(200) NOT NULL UNIQUE,
        full_name VARCHAR(150),
        role VARCHAR(20) NOT NULL DEFAULT 'EMPLOYEE',
        is_active BIT NOT NULL DEFAULT 1
    );

    -- Default admin user (password: admin123)
    INSERT INTO users (username, password, email, full_name, role, is_active)
    VALUES ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIvi', 'admin@hrcloud.com', 'System Admin', 'ADMIN', 1);

    PRINT 'Users table created with default admin.';
END
GO

PRINT 'HR Cloud database initialized successfully.';
GO
