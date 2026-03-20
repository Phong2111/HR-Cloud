package com.hrcloud.recruitment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateRequest {
    private String fullName;
    private String email;
    private String phone;
    private String position;
    private Integer yearsExperience;
    private List<String> skills;
    private List<ProjectDto> projects;
    private List<WorkExperienceDto> workExperiences;
    private List<String> certifications;
    private String cvUrl;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectDto {
        private String name;
        private String description;
        private List<String> technologies;
        private String duration;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkExperienceDto {
        private String company;
        private String role;
        private Integer years;
        private String description;
    }
}
