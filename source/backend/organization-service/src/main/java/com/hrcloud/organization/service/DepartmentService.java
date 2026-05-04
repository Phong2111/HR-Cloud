package com.hrcloud.organization.service;

import com.hrcloud.organization.dto.DepartmentRequest;
import com.hrcloud.organization.entity.Department;
import com.hrcloud.organization.repository.DepartmentRepository;
import com.hrcloud.organization.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final StaffRepository staffRepository;

    @Transactional
    public List<Department> getAllDepartments() {
        syncDepartmentsFromStaff();
        return departmentRepository.findAll().stream()
                .sorted((left, right) -> left.getName().compareToIgnoreCase(right.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Department getDepartmentById(Integer id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay phong ban voi ID: " + id));
    }

    @Transactional
    public Department createDepartment(DepartmentRequest request) {
        String normalizedName = normalizeDepartmentName(request.getName());
        if (departmentRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new RuntimeException("Phong ban '" + normalizedName + "' da ton tai");
        }

        Department department = Department.builder()
                .name(normalizedName)
                .description(normalizeDescription(request.getDescription()))
                .build();
        return departmentRepository.save(department);
    }

    @Transactional
    public Department updateDepartment(Integer id, DepartmentRequest request) {
        Department department = getDepartmentById(id);
        String normalizedName = normalizeDepartmentName(request.getName());
        String previousName = department.getName();

        departmentRepository.findByNameIgnoreCase(normalizedName)
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new RuntimeException("Phong ban '" + normalizedName + "' da ton tai");
                    }
                });

        department.setName(normalizedName);
        department.setDescription(normalizeDescription(request.getDescription()));
        Department savedDepartment = departmentRepository.save(department);

        if (!previousName.equalsIgnoreCase(normalizedName)) {
            staffRepository.renameDepartment(previousName, normalizedName);
        }

        return savedDepartment;
    }

    @Transactional
    public Map<String, String> deleteDepartment(Integer id) {
        Department department = getDepartmentById(id);
        long staffCount = staffRepository.countByDepartmentIgnoreCase(department.getName());
        if (staffCount > 0) {
            throw new RuntimeException("Khong the xoa phong ban '" + department.getName()
                    + "' vi con " + staffCount + " nhan vien thuoc phong ban nay");
        }

        departmentRepository.deleteById(id);
        return Map.of("message", "Da xoa phong ban thanh cong");
    }

    @Transactional(readOnly = true)
    public void validateDepartmentExists(String departmentName) {
        String normalizedName = normalizeDepartmentName(departmentName);
        if (!departmentRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new RuntimeException("Phong ban '" + normalizedName + "' chua ton tai. Vui long tao phong ban truoc.");
        }
    }

    private void syncDepartmentsFromStaff() {
        Set<String> staffDepartments = new LinkedHashSet<>();
        staffRepository.findAll().stream()
                .map(staff -> staff.getDepartment() == null ? null : staff.getDepartment().trim())
                .filter(name -> name != null && !name.isBlank())
                .forEach(staffDepartments::add);

        for (String departmentName : staffDepartments) {
            if (!departmentRepository.existsByNameIgnoreCase(departmentName)) {
                departmentRepository.save(Department.builder()
                        .name(departmentName)
                        .description("Dong bo tu du lieu nhan vien hien co")
                        .build());
            }
        }
    }

    private String normalizeDepartmentName(String name) {
        if (name == null || name.isBlank()) {
            throw new RuntimeException("Ten phong ban khong duoc de trong");
        }
        return name.trim();
    }

    private String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            return null;
        }
        return description.trim();
    }
}
