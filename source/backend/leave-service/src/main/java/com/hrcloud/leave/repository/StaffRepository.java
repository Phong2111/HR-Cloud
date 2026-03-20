package com.hrcloud.leave.repository;

import com.hrcloud.leave.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffRepository extends JpaRepository<Staff, Integer> {
}
