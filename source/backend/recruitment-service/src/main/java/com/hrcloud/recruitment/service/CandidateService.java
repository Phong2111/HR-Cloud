package com.hrcloud.recruitment.service;

import com.hrcloud.recruitment.dto.CandidateRequest;
import com.hrcloud.recruitment.model.Candidate;
import com.hrcloud.recruitment.repository.CandidateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CandidateService {

    private final CandidateRepository candidateRepository;
    private final MongoTemplate mongoTemplate;

    public Candidate createCandidate(CandidateRequest request) {
        Candidate candidate = mapToCandidate(request);
        candidate.setStatus("PENDING");
        candidate.setAppliedAt(LocalDateTime.now());
        return candidateRepository.save(candidate);
    }

    public List<Candidate> getAllCandidates() {
        return candidateRepository.findAll();
    }

    public Candidate getCandidateById(String id) {
        return candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found: " + id));
    }

    public Candidate updateCandidate(String id, CandidateRequest request) {
        Candidate existing = getCandidateById(id);
        Candidate updated = mapToCandidate(request);
        updated.setId(id);
        updated.setStatus(existing.getStatus());
        updated.setAppliedAt(existing.getAppliedAt());
        return candidateRepository.save(updated);
    }

    public Candidate updateStatus(String id, String status) {
        Candidate candidate = getCandidateById(id);
        candidate.setStatus(status);
        return candidateRepository.save(candidate);
    }

    public void deleteCandidate(String id) {
        if (!candidateRepository.existsById(id)) {
            throw new RuntimeException("Candidate not found: " + id);
        }
        candidateRepository.deleteById(id);
    }

    /**
     * MongoDB Aggregation Pipeline for complex candidate search.
     * Filters by: skills (array contains), minimumYearsExperience, position keyword.
     * Demonstrates the Aggregation Pipeline as described in project requirements.
     */
    public List<Candidate> searchCandidates(List<String> skills, Integer minExp, String position) {
        List<AggregationOperation> operations = new ArrayList<>();

        // Build match criteria dynamically
        Criteria criteria = new Criteria();
        List<Criteria> conditions = new ArrayList<>();

        if (skills != null && !skills.isEmpty()) {
            // Match candidates who have ANY of the specified skills (using $in operator)
            conditions.add(Criteria.where("skills").in(skills));
        }
        if (minExp != null) {
            conditions.add(Criteria.where("yearsExperience").gte(minExp));
        }
        if (position != null && !position.isBlank()) {
            conditions.add(Criteria.where("position").regex(position, "i"));
        }

        if (!conditions.isEmpty()) {
            criteria = new Criteria().andOperator(conditions.toArray(new Criteria[0]));
        }

        operations.add(Aggregation.match(criteria));

        // Sort: most experienced first
        operations.add(Aggregation.sort(
                org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.DESC, "yearsExperience")));

        // Add computed field: skillCount
        operations.add(Aggregation.addFields()
                .addField("skillCount")
                .withValue(ArrayOperators.Size.lengthOfArray("skills"))
                .build());

        TypedAggregation<Candidate> aggregation = Aggregation.newAggregation(
                Candidate.class, operations);

        AggregationResults<Candidate> results = mongoTemplate.aggregate(
                aggregation, "candidates", Candidate.class);

        return results.getMappedResults();
    }

    private Candidate mapToCandidate(CandidateRequest req) {
        List<Candidate.Project> projects = null;
        if (req.getProjects() != null) {
            projects = req.getProjects().stream()
                    .map(p -> Candidate.Project.builder()
                            .name(p.getName())
                            .description(p.getDescription())
                            .technologies(p.getTechnologies())
                            .duration(p.getDuration())
                            .build())
                    .collect(Collectors.toList());
        }
        List<Candidate.WorkExperience> experiences = null;
        if (req.getWorkExperiences() != null) {
            experiences = req.getWorkExperiences().stream()
                    .map(w -> Candidate.WorkExperience.builder()
                            .company(w.getCompany())
                            .role(w.getRole())
                            .years(w.getYears())
                            .description(w.getDescription())
                            .build())
                    .collect(Collectors.toList());
        }
        return Candidate.builder()
                .fullName(req.getFullName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .position(req.getPosition())
                .yearsExperience(req.getYearsExperience())
                .skills(req.getSkills())
                .projects(projects)
                .workExperiences(experiences)
                .certifications(req.getCertifications())
                .cvUrl(req.getCvUrl())
                .build();
    }
}
