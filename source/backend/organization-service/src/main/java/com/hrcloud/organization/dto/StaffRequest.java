package com.hrcloud.organization.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class StaffRequest {
    @NotNull(message = "ID is required")
    private Integer id;

    @NotBlank(message = "Name is required")
    private String name;

    private Integer managerId;

    @NotNull(message = "Salary is required")
    @Min(value = 0, message = "Salary must be non-negative")
    private Integer salary;

    @Min(value = 0, message = "Leave balance must be non-negative")
    private Integer leaveBalance = 15;

    private String department;

    private String roleTitle;

    private String documentFolder;

    // Fields from candidate recruitment
    private String candidateId;
    private String candidateEmail;
    private String candidatePhone;
    private String candidateIndustry;
    private String candidatePosition;
    private List<String> candidateSkills;
    private Integer candidateExperience;
}
