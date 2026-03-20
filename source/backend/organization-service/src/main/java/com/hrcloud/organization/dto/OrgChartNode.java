package com.hrcloud.organization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrgChartNode {
    private Integer id;
    private String name;
    private Integer managerId;
    private Integer salary;
    private Integer leaveBalance;
    private int level;
    private List<OrgChartNode> children;
}
