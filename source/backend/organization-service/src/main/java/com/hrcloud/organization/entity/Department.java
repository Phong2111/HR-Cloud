package com.hrcloud.organization.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "Departments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @Column(name = "Name", length = 100, nullable = false, unique = true, columnDefinition = "NVARCHAR(100)")
    private String name;

    @Column(name = "Description", length = 255, columnDefinition = "NVARCHAR(255)")
    private String description;
}
