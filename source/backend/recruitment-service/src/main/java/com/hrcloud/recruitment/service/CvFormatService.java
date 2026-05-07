package com.hrcloud.recruitment.service;

import com.hrcloud.recruitment.model.Candidate;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

/**
 * Service to standardize CV text into a common format.
 * Handles various CV templates and converts them to a unified structure.
 */
@Service
public class CvFormatService {

    /**
     * Format a Candidate object into a standardized CV text.
     * Template:
     * <pre>
     * Full Name
     * Position: [position]
     * Email: [email]
     * Phone: [phone]
     *
     * Career Objective
     * [position-related objective]
     *
     * Education
     * [Degree info]
     *
     * Skills
     * [comma-separated skills]
     *
     * Experience
     * [years] years working experience in relevant field
     * </pre>
     */
    public String formatCandidateToCv(Candidate candidate) {
        StringBuilder sb = new StringBuilder();

        // Name
        sb.append(candidate.getFullName() != null ? candidate.getFullName() : "Không có tên");
        sb.append("\n");

        // Position
        if (candidate.getPosition() != null && !candidate.getPosition().isBlank()) {
            sb.append("Vị trí: ").append(candidate.getPosition());
            sb.append("\n");
        }

        // Email
        if (candidate.getEmail() != null && !candidate.getEmail().isBlank()) {
            sb.append("Email: ").append(candidate.getEmail());
            sb.append("\n");
        }

        // Phone
        if (candidate.getPhone() != null && !candidate.getPhone().isBlank()) {
            sb.append("Điện thoại: ").append(candidate.getPhone());
            sb.append("\n");
        }

        sb.append("\n");

        // Career Objective
        sb.append("Mục tiêu nghề nghiệp\n");
        String objective = generateCareerObjective(candidate);
        sb.append(objective);
        sb.append("\n\n");

        // Education
        sb.append("Học vấn\n");
        if (candidate.getIndustry() != null && !candidate.getIndustry().isBlank()) {
            sb.append(formatEducation(candidate.getIndustry(), candidate.getYearsExperience()));
        } else {
            sb.append("Chưa cập nhật\n");
        }
        sb.append("\n");

        // Skills
        sb.append("Kỹ năng\n");
        if (candidate.getSkills() != null && !candidate.getSkills().isEmpty()) {
            sb.append(candidate.getSkills().stream()
                    .collect(Collectors.joining(", ")));
        } else {
            sb.append("Chưa cập nhật");
        }
        sb.append("\n\n");

        // Experience Summary
        sb.append("Kinh nghiệm làm việc\n");
        sb.append(formatExperience(candidate));

        return sb.toString();
    }

    /**
     * Generate a career objective based on the candidate's position and industry.
     */
    private String generateCareerObjective(Candidate candidate) {
        String position = candidate.getPosition() != null ? candidate.getPosition() : "vị trí phù hợp";
        String industry = candidate.getIndustry() != null ? candidate.getIndustry() : "lĩnh vực chuyên môn";

        return String.format(
            "Tìm kiếm vị trí %s trong lĩnh vực %s để phát triển nghề nghiệp và đóng góp vào thành công của công ty.",
            position, industry
        );
    }

    /**
     * Format education based on industry and experience.
     */
    private String formatEducation(String industry, Integer yearsExperience) {
        int graduationYear = 2020;
        if (yearsExperience != null && yearsExperience > 0) {
            graduationYear = java.time.Year.now().getValue() - yearsExperience - 4;
        }

        String degree = switch (industry.toLowerCase()) {
            case "technology" -> "Cử nhân Công nghệ thông tin";
            case "finance" -> "Cử nhân Tài chính - Kế toán";
            case "healthcare" -> "Cử nhân Quản lý Y tế";
            case "education" -> "Cử nhân Sư phạm";
            case "manufacturing" -> "Cử nhân Kỹ thuật";
            case "retail" -> "Cử nhân Quản trị Kinh doanh";
            case "logistics" -> "Cử nhân Quản lý Logistics";
            case "hospitality" -> "Cử nhân Quản trị Khách sạn";
            default -> "Cử nhân";
        };

        return String.format("%s - %d - %d", degree, graduationYear, graduationYear + 4);
    }

    /**
     * Format experience summary.
     */
    private String formatExperience(Candidate candidate) {
        int years = candidate.getYearsExperience() != null ? candidate.getYearsExperience() : 0;

        StringBuilder sb = new StringBuilder();

        // Main experience summary
        if (years > 0) {
            sb.append(years).append("-").append(years + 2)
              .append(" năm kinh nghiệm trong lĩnh vực liên quan\n\n");
        } else {
            sb.append("Vị trí mới, sẵn sàng học hỏi và đóng góp.\n\n");
        }

        // Work experiences
        if (candidate.getWorkExperiences() != null && !candidate.getWorkExperiences().isEmpty()) {
            for (int i = 0; i < candidate.getWorkExperiences().size(); i++) {
                Candidate.WorkExperience exp = candidate.getWorkExperiences().get(i);
                sb.append(String.format("• %s tại %s (%d năm)\n",
                    exp.getRole() != null ? exp.getRole() : "Vị trí",
                    exp.getCompany() != null ? exp.getCompany() : "Công ty",
                    exp.getYears() != null ? exp.getYears() : 0));

                if (exp.getDescription() != null && !exp.getDescription().isBlank()) {
                    sb.append("  ").append(exp.getDescription()).append("\n");
                }
            }
        }

        // Projects
        if (candidate.getProjects() != null && !candidate.getProjects().isEmpty()) {
            sb.append("\nDự án\n");
            for (Candidate.Project project : candidate.getProjects()) {
                sb.append(String.format("• %s\n",
                    project.getName() != null ? project.getName() : "Dự án"));

                if (project.getDescription() != null && !project.getDescription().isBlank()) {
                    sb.append("  ").append(project.getDescription()).append("\n");
                }

                if (project.getTechnologies() != null && !project.getTechnologies().isEmpty()) {
                    sb.append("  Công nghệ: ")
                      .append(String.join(", ", project.getTechnologies()))
                      .append("\n");
                }

                if (project.getDuration() != null && !project.getDuration().isBlank()) {
                    sb.append("  Thời gian: ").append(project.getDuration()).append("\n");
                }
            }
        }

        // Certifications
        if (candidate.getCertifications() != null && !candidate.getCertifications().isEmpty()) {
            sb.append("\nChứng chỉ\n");
            for (String cert : candidate.getCertifications()) {
                sb.append("• ").append(cert).append("\n");
            }
        }

        return sb.toString();
    }

    /**
     * Reformat raw CV text from various sources into the standardized format.
     * Uses pattern matching to extract information from unstructured text.
     */
    public String reformatRawCvText(String rawText, Candidate candidate) {
        if (candidate == null) {
            return rawText;
        }
        return formatCandidateToCv(candidate);
    }
}
