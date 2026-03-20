package com.hrcloud.recruitment.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

/**
 * MongoDB Document for candidate profiles.
 * Stores nested/variable data: skills, experience, projects, certifications.
 * Supports schema-on-read and flexible structure per requirements.
 */
@Document(collection = "candidates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Candidate {

    @Id
    private String id;

    private String fullName;
    private String email;
    private String phone;
    private String position;        // Desired position

    private Integer yearsExperience;

    private List<String> skills;    // e.g. ["Java", "Spring Boot", "SQL"]

    private List<Project> projects;

    private List<WorkExperience> workExperiences;

    private List<String> certifications;

    private String status;          // PENDING, INTERVIEWING, HIRED, REJECTED

    private String cvUrl;

    private LocalDateTime appliedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Project {
        private String name;
        private String description;
        private List<String> technologies;
        private String duration; // e.g. "6 months"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkExperience {
        private String company;
        private String role;
        private Integer years;
        private String description;
    }
}
