package com.hrcloud.leave.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LeaveRequest {
    @NotNull(message = "Staff ID is required")
    private Integer staffId;

    @NotNull(message = "Number of days is required")
    @Min(value = 1, message = "Days must be at least 1")
    private Integer days;
}
