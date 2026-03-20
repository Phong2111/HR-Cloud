package com.hrcloud.recruitment.repository;

import com.hrcloud.recruitment.model.Candidate;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CandidateRepository extends MongoRepository<Candidate, String> {
    List<Candidate> findByStatus(String status);
    List<Candidate> findByPositionContainingIgnoreCase(String position);
    List<Candidate> findBySkillsContaining(String skill);
    List<Candidate> findByYearsExperienceGreaterThanEqual(Integer minYears);
}
