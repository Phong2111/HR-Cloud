package com.hrcloud.leave.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveResponse {
    private Integer recordId;
    private Integer staffId;
    private String staffName;
    private Integer days;
    private String status;
    private Integer remainingBalance;
    private String message;
}
