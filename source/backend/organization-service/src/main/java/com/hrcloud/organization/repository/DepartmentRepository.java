package com.hrcloud.organization.repository;

import com.hrcloud.organization.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Integer> {

    Optional<Department> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
