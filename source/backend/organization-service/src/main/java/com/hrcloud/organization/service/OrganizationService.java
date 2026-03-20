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

    public List<Staff> getAllStaff() {
        return staffRepository.findAll();
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
    public List<OrgChartNode> getOrgChart() {
        List<Staff> allStaff = staffRepository.findAll();
        return buildTree(allStaff, null, 0);
    }

    /**
     * Returns flat list from Recursive CTE ordered by level.
     */
    public List<Map<String, Object>> getOrgChartFlat() {
        List<Object[]> raw = staffRepository.findOrgChartFlat();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : raw) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", row[0]);
            map.put("name", row[1]);
            map.put("managerId", row[2]);
            map.put("salary", row[3]);
            map.put("leaveBalance", row[4]);
            map.put("level", row[5]);
            result.add(map);
        }
        return result;
    }

    private List<OrgChartNode> buildTree(List<Staff> all, Integer parentId, int level) {
        return all.stream()
                .filter(s -> Objects.equals(s.getManagerId(), parentId))
                .map(s -> OrgChartNode.builder()
                        .id(s.getId())
                        .name(s.getName())
                        .managerId(s.getManagerId())
                        .salary(s.getSalary())
                        .leaveBalance(s.getLeaveBalance())
                        .level(level)
                        .children(buildTree(all, s.getId(), level + 1))
                        .build())
                .collect(Collectors.toList());
    }

    public Map<String, Object> getDashboardStats() {
        List<Staff> all = staffRepository.findAll();
        return Map.of(
                "totalEmployees", all.size(),
                "avgSalary", all.stream().mapToInt(Staff::getSalary).average().orElse(0),
                "totalPayroll", all.stream().mapToInt(Staff::getSalary).sum()
        );
    }
}
