package com.hrcloud.organization.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "Staff")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Staff {

    @Id
    @Column(name = "ID")
    private Integer id;

    @Column(name = "Name", length = 100)
    private String name;

    @Column(name = "ManagerID")
    private Integer managerId;

    @Column(name = "Salary")
    private Integer salary;

    @Column(name = "LeaveBalance")
    private Integer leaveBalance;
}
