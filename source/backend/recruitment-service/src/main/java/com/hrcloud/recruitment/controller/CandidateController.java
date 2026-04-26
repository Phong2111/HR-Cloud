package com.hrcloud.recruitment.controller;

import com.hrcloud.recruitment.dto.CandidateRequest;
import com.hrcloud.recruitment.model.Candidate;
import com.hrcloud.recruitment.service.CandidateService;
import com.hrcloud.recruitment.service.FileStorageService;
import com.hrcloud.recruitment.service.PdfExtractionService;
import com.hrcloud.recruitment.service.AiParsingService;
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
        if (request.getFullName() == null || request.getFullName().isEmpty()) {
            request.setFullName(file.getOriginalFilename());
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
            if (request.getFullName() == null || request.getFullName().isEmpty()) {
                request.setFullName(file.getOriginalFilename());
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
