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
    private final DepartmentService departmentService;

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
        String department = normalizeDepartment(request.getDepartment());
        departmentService.validateDepartmentExists(department);

        Staff staff = Staff.builder()
                .id(request.getId())
                .name(request.getName())
                .managerId(request.getManagerId())
                .salary(request.getSalary())
                .leaveBalance(request.getLeaveBalance())
                .department(department)
                .roleTitle(normalizeRoleTitle(request.getRoleTitle()))
                .documentFolder(request.getDocumentFolder())
                // Candidate recruitment info
                .candidateId(request.getCandidateId())
                .candidateEmail(request.getCandidateEmail())
                .candidatePhone(request.getCandidatePhone())
                .candidateIndustry(request.getCandidateIndustry())
                .candidatePosition(request.getCandidatePosition())
                .candidateSkills(request.getCandidateSkills() != null ? String.join(", ", request.getCandidateSkills()) : null)
                .candidateExperience(request.getCandidateExperience())
                .recruitedAt(java.time.LocalDateTime.now())
                .build();
        return staffRepository.save(staff);
    }

    @Transactional
    public Staff updateStaff(Integer id, StaffRequest request) {
        Staff staff = getStaffById(id);
        String department = normalizeDepartment(request.getDepartment());
        departmentService.validateDepartmentExists(department);

        staff.setName(request.getName());
        staff.setManagerId(request.getManagerId());
        staff.setSalary(request.getSalary());
        staff.setLeaveBalance(request.getLeaveBalance());
        staff.setDepartment(department);
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
     * When filtering by department, builds the full tree but prunes branches
     * that don't contain any members of the target department.
     */
    public List<OrgChartNode> getOrgChart(String department, Integer rootId) {
        // Always fetch ALL staff for tree building (managers may be in different departments)
        List<Staff> allStaff = staffRepository.findAll();

        // Determine which IDs belong to the filtered department
        Set<Integer> departmentIds = null;
        if (department != null && !department.isBlank()) {
            String deptTrimmed = department.trim();
            departmentIds = allStaff.stream()
                    .filter(s -> deptTrimmed.equalsIgnoreCase(s.getDepartment()))
                    .map(Staff::getId)
                    .collect(Collectors.toSet());
        }

        List<OrgChartNode> tree;
        if (rootId != null) {
            Staff root = allStaff.stream()
                    .filter(staff -> Objects.equals(staff.getId(), rootId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Cannot find root staff in current filter: " + rootId));
            tree = List.of(buildNode(allStaff, root, 0));
        } else {
            tree = buildTree(allStaff, null, 0);
        }

        // If department filter is active, prune branches that don't contain matching members
        if (departmentIds != null) {
            tree = pruneTree(tree, departmentIds);
        }

        return tree;
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

    /**
     * Recursively prune the tree: keep only branches that contain at least
     * one node whose ID is in the relevantIds set.
     */
    private List<OrgChartNode> pruneTree(List<OrgChartNode> nodes, Set<Integer> relevantIds) {
        List<OrgChartNode> result = new ArrayList<>();
        for (OrgChartNode node : nodes) {
            // Recursively prune children first
            List<OrgChartNode> prunedChildren = pruneTree(node.getChildren(), relevantIds);
            boolean selfRelevant = relevantIds.contains(node.getId());
            boolean hasRelevantChild = !prunedChildren.isEmpty();

            if (selfRelevant || hasRelevantChild) {
                // Keep this node with the pruned children
                OrgChartNode kept = OrgChartNode.builder()
                        .id(node.getId())
                        .name(node.getName())
                        .managerId(node.getManagerId())
                        .salary(node.getSalary())
                        .leaveBalance(node.getLeaveBalance())
                        .department(node.getDepartment())
                        .roleTitle(node.getRoleTitle())
                        .documentFolder(node.getDocumentFolder())
                        .level(node.getLevel())
                        .children(prunedChildren)
                        .build();
                result.add(kept);
            }
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
