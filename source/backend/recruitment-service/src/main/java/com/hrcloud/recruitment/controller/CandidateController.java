package com.hrcloud.recruitment.controller;

import com.hrcloud.recruitment.dto.CandidateRequest;
import com.hrcloud.recruitment.model.Candidate;
import com.hrcloud.recruitment.service.CandidateService;
import com.hrcloud.recruitment.service.FileStorageService;
import com.hrcloud.recruitment.service.PdfExtractionService;
import com.hrcloud.recruitment.service.AiParsingService;
import com.hrcloud.recruitment.service.CvFormatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CandidateController {

    private final CandidateService candidateService;
    private final FileStorageService fileStorageService;
    private final PdfExtractionService pdfExtractionService;
    private final AiParsingService aiParsingService;
    private final CvFormatService cvFormatService;

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
                                                   @RequestParam String status,
                                                   @RequestParam(required = false) String assignedRole,
                                                   @RequestParam(required = false) String assignedDepartment,
                                                   @RequestParam(required = false) Integer assignedManagerId) {
        return ResponseEntity.ok(candidateService.updateStatus(id, status, assignedRole, assignedDepartment, assignedManagerId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteCandidate(@PathVariable String id) {
        candidateService.deleteCandidate(id);
        return ResponseEntity.ok(Map.of("message", "Candidate deleted successfully"));
    }

    /**
     * GET /api/candidates/{id}/cv
     * Returns the original CV file for download or preview.
     */
    @GetMapping("/{id}/cv")
    public ResponseEntity<org.springframework.core.io.Resource> getCandidateCv(@PathVariable String id) {
        Candidate candidate = candidateService.getCandidateById(id);
        if (candidate.getCvUrl() == null || candidate.getCvUrl().isBlank()) {
            throw new RuntimeException("No CV file attached to this candidate.");
        }
        return fileStorageService.loadCvAsResource(candidate.getCvUrl());
    }

    /**
     * GET /api/candidates/{id}/cv/download
     * Downloads the original CV file as an attachment.
     */
    @GetMapping("/{id}/cv/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadCandidateCv(@PathVariable String id) {
        Candidate candidate = candidateService.getCandidateById(id);
        if (candidate.getCvUrl() == null || candidate.getCvUrl().isBlank()) {
            throw new RuntimeException("No CV file attached to this candidate.");
        }
        return fileStorageService.loadCvAsResource(candidate.getCvUrl(), true);
    }

    /**
     * GET /api/candidates/{id}/formatted-cv
     * Returns the candidate's information formatted as a standardized CV text.
     */
    @GetMapping("/{id}/formatted-cv")
    public ResponseEntity<Map<String, Object>> getFormattedCv(@PathVariable String id) {
        Candidate candidate = candidateService.getCandidateById(id);
        String formattedCv = cvFormatService.formatCandidateToCv(candidate);
        return ResponseEntity.ok(Map.of(
            "candidateId", candidate.getId() != null ? candidate.getId() : "",
            "fullName", candidate.getFullName() != null ? candidate.getFullName() : "Unknown",
            "email", candidate.getEmail() != null ? candidate.getEmail() : "",
            "phone", candidate.getPhone() != null ? candidate.getPhone() : "",
            "position", candidate.getPosition() != null ? candidate.getPosition() : "",
            "industry", candidate.getIndustry() != null ? candidate.getIndustry() : "",
            "yearsExperience", candidate.getYearsExperience() != null ? candidate.getYearsExperience() : 0,
            "skills", candidate.getSkills() != null ? candidate.getSkills() : List.of(),
            "formattedCv", formattedCv
        ));
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
            @RequestParam(required = false) String position,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String roleKeyword) {
        return ResponseEntity.ok(candidateService.searchCandidates(skills, minExp, position, status, industry, department, roleKeyword));
    }

    @PostMapping("/upload-cv")
    public ResponseEntity<Candidate> uploadCv(@RequestParam("file") MultipartFile file) {
        // 1. Save file to storage
        String cvUrl = fileStorageService.storeCandidateCv(file);

        // 2. Extract text from PDF
        String cvText = pdfExtractionService.extractTextFromPdf(file);

        // 3. Parse with AI
        CandidateRequest request = aiParsingService.parseCvText(cvText);

        // 4. Update the request with cvUrl
        request.setCvUrl(cvUrl);
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            String filename = file.getOriginalFilename();
            if (filename != null) {
                // Strip the .pdf extension for a cleaner display name
                filename = filename.replaceAll("(?i)\\.pdf$", "").trim();
            }
            request.setFullName(filename != null && !filename.isEmpty() ? filename : "Unknown Candidate");
        }

        // 5. Save to database
        return ResponseEntity.ok(candidateService.createCandidate(request));
    }

    @PostMapping("/upload-batch-cv")
    public ResponseEntity<List<Candidate>> uploadBatchCv(@RequestParam("files") List<MultipartFile> files) {
        List<Candidate> savedCandidates = files.stream().map(file -> {
            String cvUrl = fileStorageService.storeCandidateCv(file);
            String cvText = pdfExtractionService.extractTextFromPdf(file);
            CandidateRequest request = aiParsingService.parseCvText(cvText);
            request.setCvUrl(cvUrl);
            if (request.getFullName() == null || request.getFullName().isBlank()) {
                String filename = file.getOriginalFilename();
                if (filename != null) {
                    filename = filename.replaceAll("(?i)\\.pdf$", "").trim();
                }
                request.setFullName(filename != null && !filename.isEmpty() ? filename : "Unknown Candidate");
            }
            return candidateService.createCandidate(request);
        }).toList();

        return ResponseEntity.ok(savedCandidates);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleError(RuntimeException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
