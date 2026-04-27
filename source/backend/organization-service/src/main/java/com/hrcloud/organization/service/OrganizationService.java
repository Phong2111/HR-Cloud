package com.hrcloud.organization.service;

import com.hrcloud.organization.dto.OrgChartNode;
import com.hrcloud.organization.dto.StaffRequest;
import com.hrcloud.organization.entity.Staff;
import com.hrcloud.organization.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final StaffRepository staffRepository;

    public List<Staff> getAllStaff(String department) {
        if (department == null || department.isBlank()) {
            return staffRepository.findAll();
        }
        return staffRepository.findByDepartmentIgnoreCase(department.trim());
    }

    public Staff getStaffById(Integer id) {
        return staffRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff not found with id: " + id));
    }

    @Transactional
    public Staff createStaff(StaffRequest request) {
        if (staffRepository.existsById(request.getId())) {
            throw new RuntimeException("Staff with ID " + request.getId() + " already exists");
        }
        Staff staff = Staff.builder()
                .id(request.getId())
                .name(request.getName())
                .managerId(request.getManagerId())
                .salary(request.getSalary())
                .leaveBalance(request.getLeaveBalance())
            .department(normalizeDepartment(request.getDepartment()))
            .roleTitle(normalizeRoleTitle(request.getRoleTitle()))
                .documentFolder(request.getDocumentFolder())
                .build();
        return staffRepository.save(staff);
    }

    @Transactional
    public Staff updateStaff(Integer id, StaffRequest request) {
        Staff staff = getStaffById(id);
        staff.setName(request.getName());
        staff.setManagerId(request.getManagerId());
        staff.setSalary(request.getSalary());
        staff.setLeaveBalance(request.getLeaveBalance());
        staff.setDepartment(normalizeDepartment(request.getDepartment()));
        staff.setRoleTitle(normalizeRoleTitle(request.getRoleTitle()));
        staff.setDocumentFolder(request.getDocumentFolder());
        return staffRepository.save(staff);
    }

    @Transactional
    public void deleteStaff(Integer id) {
        if (!staffRepository.existsById(id)) {
            throw new RuntimeException("Staff not found with id: " + id);
        }
        staffRepository.deleteById(id);
    }

    /**
     * Returns the full org chart as a tree structure using Recursive CTE result.
     */
    public List<OrgChartNode> getOrgChart(String department, Integer rootId) {
        List<Staff> allStaff = getAllStaff(department);
        if (rootId != null) {
            Staff root = allStaff.stream()
                    .filter(staff -> Objects.equals(staff.getId(), rootId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Cannot find root staff in current filter: " + rootId));
            return List.of(buildNode(allStaff, root, 0));
        }
        return buildTree(allStaff, null, 0);
    }

    /**
     * Returns flat list from Recursive CTE ordered by level.
     */
    public List<Map<String, Object>> getOrgChartFlat(String department, Integer rootId) {
        List<Map<String, Object>> result = new ArrayList<>();
        List<OrgChartNode> tree = getOrgChart(department, rootId);
        for (OrgChartNode node : tree) {
            flattenTree(node, result);
        }
        return result;
    }

    private void flattenTree(OrgChartNode node, List<Map<String, Object>> result) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", node.getId());
        map.put("name", node.getName());
        map.put("managerId", node.getManagerId());
        map.put("salary", node.getSalary());
        map.put("leaveBalance", node.getLeaveBalance());
        map.put("department", node.getDepartment());
        map.put("roleTitle", node.getRoleTitle());
        map.put("documentFolder", node.getDocumentFolder());
        map.put("level", node.getLevel());
        result.add(map);
        for (OrgChartNode child : node.getChildren()) {
            flattenTree(child, result);
        }
    }

    private List<OrgChartNode> buildTree(List<Staff> all, Integer parentId, int level) {
        return all.stream()
                .filter(s -> Objects.equals(s.getManagerId(), parentId))
                .map(s -> buildNode(all, s, level))
                .collect(Collectors.toList());
    }

    private OrgChartNode buildNode(List<Staff> all, Staff current, int level) {
        return OrgChartNode.builder()
                .id(current.getId())
                .name(current.getName())
                .managerId(current.getManagerId())
                .salary(current.getSalary())
                .leaveBalance(current.getLeaveBalance())
                .department(current.getDepartment())
                .roleTitle(current.getRoleTitle())
                .documentFolder(current.getDocumentFolder())
                .level(level)
                .children(buildTree(all, current.getId(), level + 1))
                .build();
    }

    private String normalizeDepartment(String department) {
        if (department == null || department.isBlank()) {
            return "General";
        }
        return department.trim();
    }

    private String normalizeRoleTitle(String roleTitle) {
        if (roleTitle == null || roleTitle.isBlank()) {
            return "Staff";
        }
        return roleTitle.trim();
    }

    public Map<String, Object> getDashboardStats() {
        List<Staff> all = getAllStaff(null);
        return Map.of(
                "totalEmployees", all.size(),
                "avgSalary", all.stream().mapToInt(Staff::getSalary).average().orElse(0),
                "totalPayroll", all.stream().mapToInt(Staff::getSalary).sum()
        );
    }
}
