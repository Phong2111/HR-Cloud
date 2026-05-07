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

    @Column(name = "Department", length = 100)
    private String department;

    @Column(name = "RoleTitle", length = 100)
    private String roleTitle;

    @Column(name = "DocumentFolder", length = 255)
    private String documentFolder;

    // Fields from candidate recruitment
    @Column(name = "CandidateID", length = 100)
    private String candidateId;  // Reference to the original candidate

    @Column(name = "CandidateEmail", length = 150)
    private String candidateEmail;

    @Column(name = "CandidatePhone", length = 50)
    private String candidatePhone;

    @Column(name = "CandidateIndustry", length = 100)
    private String candidateIndustry;

    @Column(name = "CandidatePosition", length = 100)
    private String candidatePosition;

    @Column(name = "CandidateSkills", length = 500)
    private String candidateSkills;  // Comma-separated skills

    @Column(name = "CandidateExperience")
    private Integer candidateExperience;  // Years of experience

    @Column(name = "RecruitedAt")
    private java.time.LocalDateTime recruitedAt;  // When the candidate was hired
}
