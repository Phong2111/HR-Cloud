package com.hrcloud.leave.controller;

import com.hrcloud.leave.dto.LeaveRequest;
import com.hrcloud.leave.dto.LeaveResponse;
import com.hrcloud.leave.entity.LeaveRecord;
import com.hrcloud.leave.service.LeaveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leave")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LeaveController {

    private final LeaveService leaveService;

    /**
     * POST /api/leave/request
     * Triggers the ApproveLeave Stored Procedure atomically.
     */
    @PostMapping("/request")
    public ResponseEntity<LeaveResponse> requestLeave(@Valid @RequestBody LeaveRequest request) {
        return ResponseEntity.ok(leaveService.approveLeave(request));
    }

    /**
     * GET /api/leave/{staffId}
     * Get leave history for a specific staff member.
     */
    @GetMapping("/{staffId}")
    public ResponseEntity<List<LeaveRecord>> getLeavesByStaff(@PathVariable Integer staffId) {
        return ResponseEntity.ok(leaveService.getLeavesByStaff(staffId));
    }

    /**
     * GET /api/leave
     * Get all leave records.
     */
    @GetMapping
    public ResponseEntity<List<LeaveRecord>> getAllLeaves() {
        return ResponseEntity.ok(leaveService.getAllLeaves());
    }

    /**
     * GET /api/leave/balance/{staffId}
     * Get remaining leave balance for a staff member.
     */
    @GetMapping("/balance/{staffId}")
    public ResponseEntity<Map<String, Object>> getLeaveBalance(@PathVariable Integer staffId) {
        return ResponseEntity.ok(leaveService.getLeaveBalance(staffId));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleError(RuntimeException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
