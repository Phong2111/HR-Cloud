package com.hrcloud.organization.controller;

import com.hrcloud.organization.dto.OrgChartNode;
import com.hrcloud.organization.dto.StaffRequest;
import com.hrcloud.organization.entity.Staff;
import com.hrcloud.organization.service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrganizationController {

    private final OrganizationService organizationService;

    // ─── Staff CRUD ───────────────────────────────────────────────

    @GetMapping("/staff")
    public ResponseEntity<List<Staff>> getAllStaff() {
        return ResponseEntity.ok(organizationService.getAllStaff());
    }

    @GetMapping("/staff/{id}")
    public ResponseEntity<Staff> getStaffById(@PathVariable Integer id) {
        return ResponseEntity.ok(organizationService.getStaffById(id));
    }

    @PostMapping("/staff")
    public ResponseEntity<Staff> createStaff(@Valid @RequestBody StaffRequest request) {
        return ResponseEntity.ok(organizationService.createStaff(request));
    }

    @PutMapping("/staff/{id}")
    public ResponseEntity<Staff> updateStaff(@PathVariable Integer id,
                                              @Valid @RequestBody StaffRequest request) {
        return ResponseEntity.ok(organizationService.updateStaff(id, request));
    }

    @DeleteMapping("/staff/{id}")
    public ResponseEntity<Map<String, String>> deleteStaff(@PathVariable Integer id) {
        organizationService.deleteStaff(id);
        return ResponseEntity.ok(Map.of("message", "Staff deleted successfully"));
    }

    // ─── Org Chart (Recursive CTE) ────────────────────────────────

    /**
     * Returns hierarchical tree structure (nested JSON).
     * Uses Java-side tree builder from full staff list.
     */
    @GetMapping("/org-chart")
    public ResponseEntity<List<OrgChartNode>> getOrgChart() {
        return ResponseEntity.ok(organizationService.getOrgChart());
    }

    /**
     * Returns flat org chart list ordered by level (direct from Recursive CTE).
     */
    @GetMapping("/org-chart/flat")
    public ResponseEntity<List<Map<String, Object>>> getOrgChartFlat() {
        return ResponseEntity.ok(organizationService.getOrgChartFlat());
    }

    // ─── Dashboard Stats ──────────────────────────────────────────

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(organizationService.getDashboardStats());
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleError(RuntimeException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
