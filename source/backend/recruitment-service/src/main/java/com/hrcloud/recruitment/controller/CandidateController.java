package com.hrcloud.recruitment.controller;

import com.hrcloud.recruitment.dto.CandidateRequest;
import com.hrcloud.recruitment.model.Candidate;
import com.hrcloud.recruitment.service.CandidateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CandidateController {

    private final CandidateService candidateService;

    @PostMapping
    public ResponseEntity<Candidate> createCandidate(@RequestBody CandidateRequest request) {
        return ResponseEntity.ok(candidateService.createCandidate(request));
    }

    @GetMapping
    public ResponseEntity<List<Candidate>> getAllCandidates() {
        return ResponseEntity.ok(candidateService.getAllCandidates());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Candidate> getCandidateById(@PathVariable String id) {
        return ResponseEntity.ok(candidateService.getCandidateById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Candidate> updateCandidate(@PathVariable String id,
                                                      @RequestBody CandidateRequest request) {
        return ResponseEntity.ok(candidateService.updateCandidate(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Candidate> updateStatus(@PathVariable String id,
                                                   @RequestParam String status) {
        return ResponseEntity.ok(candidateService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteCandidate(@PathVariable String id) {
        candidateService.deleteCandidate(id);
        return ResponseEntity.ok(Map.of("message", "Candidate deleted successfully"));
    }

    /**
     * GET /api/candidates/search
     * Uses MongoDB Aggregation Pipeline to filter by skills, minExp, position.
     * Example: /api/candidates/search?skills=Java,Spring Boot&minExp=2&position=Backend
     */
    @GetMapping("/search")
    public ResponseEntity<List<Candidate>> searchCandidates(
            @RequestParam(required = false) List<String> skills,
            @RequestParam(required = false) Integer minExp,
            @RequestParam(required = false) String position) {
        return ResponseEntity.ok(candidateService.searchCandidates(skills, minExp, position));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleError(RuntimeException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
