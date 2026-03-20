package com.hrcloud.leave.service;

import com.hrcloud.leave.dto.LeaveRequest;
import com.hrcloud.leave.dto.LeaveResponse;
import com.hrcloud.leave.entity.LeaveRecord;
import com.hrcloud.leave.entity.Staff;
import com.hrcloud.leave.repository.LeaveRecordRepository;
import com.hrcloud.leave.repository.StaffRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.ParameterMode;
import jakarta.persistence.StoredProcedureQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRecordRepository leaveRecordRepository;
    private final StaffRepository staffRepository;
    private final EntityManager entityManager;

    /**
     * Calls the SQL Server Stored Procedure ApproveLeave(@staff_id, @days).
     * The SP atomically checks leave balance, deducts days, and inserts a record.
     * This mirrors the HRCloud.sql stored procedure exactly.
     */
    @Transactional
    public LeaveResponse approveLeave(LeaveRequest request) {
        Staff staff = staffRepository.findById(request.getStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found: " + request.getStaffId()));

        // Execute the stored procedure (matches HRCloud.sql exactly)
        StoredProcedureQuery spQuery = entityManager
                .createStoredProcedureQuery("ApproveLeave")
                .registerStoredProcedureParameter("staff_id", Integer.class, ParameterMode.IN)
                .registerStoredProcedureParameter("days", Integer.class, ParameterMode.IN)
                .setParameter("staff_id", request.getStaffId())
                .setParameter("days", request.getDays());

        spQuery.execute();

        // Refresh to get updated balance after SP execution
        entityManager.refresh(staff);
        int balanceBefore = staff.getLeaveBalance() + request.getDays(); // reconstruct

        // Check if SP approved (balance was sufficient)
        if (staff.getLeaveBalance() < balanceBefore) {
            // SP approved: insert happened inside SP, find latest record
            List<LeaveRecord> records = leaveRecordRepository.findByStaffId(request.getStaffId());
            LeaveRecord latest = records.isEmpty() ? null : records.get(records.size() - 1);

            return LeaveResponse.builder()
                    .recordId(latest != null ? latest.getId() : null)
                    .staffId(request.getStaffId())
                    .staffName(staff.getName())
                    .days(request.getDays())
                    .status("Approved")
                    .remainingBalance(staff.getLeaveBalance())
                    .message("Leave approved successfully. Remaining balance: " + staff.getLeaveBalance() + " days.")
                    .build();
        } else {
            return LeaveResponse.builder()
                    .staffId(request.getStaffId())
                    .staffName(staff.getName())
                    .days(request.getDays())
                    .status("Rejected")
                    .remainingBalance(staff.getLeaveBalance())
                    .message("Not enough leave days. Available: " + staff.getLeaveBalance() + " days, Requested: " + request.getDays() + " days.")
                    .build();
        }
    }

    public List<LeaveRecord> getLeavesByStaff(Integer staffId) {
        return leaveRecordRepository.findByStaffId(staffId);
    }

    public List<LeaveRecord> getAllLeaves() {
        return leaveRecordRepository.findAll();
    }

    public Map<String, Object> getLeaveBalance(Integer staffId) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found: " + staffId));
        long approvedCount = leaveRecordRepository.countByStaffIdAndStatus(staffId, "Approved");
        return Map.of(
                "staffId", staffId,
                "staffName", staff.getName(),
                "leaveBalance", staff.getLeaveBalance(),
                "approvedRequestsCount", approvedCount
        );
    }
}
