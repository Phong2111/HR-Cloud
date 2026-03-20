package com.hrcloud.leave.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "LeaveRecords")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @Column(name = "StaffID", nullable = false)
    private Integer staffId;

    @Column(name = "Days", nullable = false)
    private Integer days;

    @Column(name = "Status", length = 20)
    private String status;
}
