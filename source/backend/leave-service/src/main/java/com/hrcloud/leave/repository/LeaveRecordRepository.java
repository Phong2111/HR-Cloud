package com.hrcloud.leave.repository;

import com.hrcloud.leave.entity.LeaveRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeaveRecordRepository extends JpaRepository<LeaveRecord, Integer> {
    List<LeaveRecord> findByStaffId(Integer staffId);
    List<LeaveRecord> findByStatus(String status);
    long countByStaffIdAndStatus(Integer staffId, String status);
}
