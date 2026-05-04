package com.hrcloud.organization.repository;

import com.hrcloud.organization.entity.Staff;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StaffRepository extends JpaRepository<Staff, Integer> {

    /**
     * Recursive CTE to generate full organizational hierarchy from CEO down.
     * Replicates the Recursive CTE in HRCloud.sql.
     */
    @Query(value = """
            WITH OrgChart AS (
                SELECT ID, Name, ManagerID, Salary, LeaveBalance, Department, RoleTitle, DocumentFolder, 0 AS Level
                FROM Staff
                WHERE ManagerID IS NULL
                
                UNION ALL
                
                SELECT s.ID, s.Name, s.ManagerID, s.Salary, s.LeaveBalance, s.Department, s.RoleTitle, s.DocumentFolder, o.Level + 1
                FROM Staff s
                JOIN OrgChart o ON s.ManagerID = o.ID
            )
            SELECT * FROM OrgChart ORDER BY Level, ManagerID, ID
            """, nativeQuery = true)
    List<Object[]> findOrgChartFlat();

    List<Staff> findByDepartmentIgnoreCase(String department);

    long countByDepartmentIgnoreCase(String department);

    List<Staff> findByManagerId(Integer managerId);

    List<Staff> findByManagerIdIsNull();

    @Modifying
    @Query("""
            update Staff s
            set s.department = :newDepartment
            where lower(s.department) = lower(:oldDepartment)
            """)
    int renameDepartment(@Param("oldDepartment") String oldDepartment,
                         @Param("newDepartment") String newDepartment);
}
