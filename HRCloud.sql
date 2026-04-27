
Go
use HRCloud;

Go 
CREATE TABLE Staff (
    ID INT PRIMARY KEY,
    Name VARCHAR(100),
    ManagerID INT,
    Salary INT,
    LeaveBalance INT,
    Department VARCHAR(100),
    RoleTitle VARCHAR(100),
    DocumentFolder VARCHAR(255)
);

Go
CREATE TABLE LeaveRecords (
    ID INT PRIMARY KEY,
    StaffID INT,
    Days INT,
    Status VARCHAR(20),
    FOREIGN KEY (StaffID) REFERENCES Staff(ID)
);

Go
INSERT INTO Staff VALUES (1,'CEO',NULL,10000,30,'Executive','Chief Executive Officer','/uploads/staffs/staff_1/');
INSERT INTO Staff VALUES (2,'Manager A',1,7000,20,'Engineering','Engineering Manager','/uploads/staffs/staff_2/');
INSERT INTO Staff VALUES (3,'Manager B',1,7000,20,'Human Resources','HR Manager','/uploads/staffs/staff_3/');
INSERT INTO Staff VALUES (4,'Employee A',2,4000,15,'Engineering','Backend Developer','/uploads/staffs/staff_4/');
INSERT INTO Staff VALUES (5,'Employee B',2,4000,15,'Engineering','Frontend Developer','/uploads/staffs/staff_5/');
INSERT INTO Staff VALUES (6,'Employee C',3,4000,15,'Human Resources','Talent Acquisition Executive','/uploads/staffs/staff_6/');

Go
WITH OrgChart AS (
    SELECT ID, Name, ManagerID, 0 AS Level
    FROM Staff
    WHERE ManagerID IS NULL

    UNION ALL

    SELECT s.ID, s.Name, s.ManagerID, o.Level + 1
    FROM Staff s
    JOIN OrgChart o ON s.ManagerID = o.ID
)
SELECT * FROM OrgChart;



DROP TABLE LeaveRecords;

CREATE TABLE LeaveRecords (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    StaffID INT,
    Days INT,
    Status VARCHAR(20),
    FOREIGN KEY (StaffID) REFERENCES Staff(ID)
);

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

EXEC ApproveLeave 4, 5;
SELECT * FROM LeaveRecords;