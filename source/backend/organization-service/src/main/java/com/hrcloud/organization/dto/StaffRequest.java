package com.hrcloud.organization.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

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
}
