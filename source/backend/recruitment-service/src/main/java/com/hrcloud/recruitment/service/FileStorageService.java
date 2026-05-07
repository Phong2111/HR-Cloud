package com.hrcloud.recruitment.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    // Default upload directory if not specified in properties
    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * Get the upload directory path
     */
    public String getUploadDir() {
        return uploadDir;
    }

    public String storeCandidateCv(MultipartFile file) {
        // Clean the file name
        String fileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "cv.pdf");

        try {
            // Check if the file's name contains invalid characters
            if (fileName.contains("..")) {
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + fileName);
            }

            // Generate a unique folder for the candidate based on UUID
            String candidateFolder = "cand_" + UUID.randomUUID().toString().substring(0, 8);
            
            // Path: /uploads/candidates/{candidateFolder}/
            Path targetLocation = Paths.get(uploadDir, "candidates", candidateFolder).toAbsolutePath().normalize();
            
            // Create directories if they do not exist
            Files.createDirectories(targetLocation);
            
            // Resolve the exact file path
            Path filePath = targetLocation.resolve(fileName);
            
            // Copy file to the target location (Replacing existing file with the same name)
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return the relative URL/Path to store in the database
            return "/uploads/candidates/" + candidateFolder + "/" + fileName;

        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + fileName + ". Please try again!", ex);
        }
    }

    /**
     * Load a CV file as a Resource for download/preview.
     * @param cvUrl The relative URL path stored in the database
     * @return ResponseEntity with the file as resource
     */
    public ResponseEntity<Resource> loadCvAsResource(String cvUrl) {
        return loadCvAsResource(cvUrl, false);
    }

    /**
     * Load a CV file as a Resource for download/preview.
     * @param cvUrl The relative URL path stored in the database
     * @param asAttachment If true, force download; if false, display inline
     * @return ResponseEntity with the file as resource
     */
    public ResponseEntity<Resource> loadCvAsResource(String cvUrl, boolean asAttachment) {
        try {
            // Remove leading slash if present
            String cleanPath = cvUrl.startsWith("/") ? cvUrl.substring(1) : cvUrl;
            Path filePath = Paths.get(cleanPath).toAbsolutePath().normalize();
            
            if (!Files.exists(filePath) || !Files.isReadable(filePath)) {
                throw new RuntimeException("CV file not found: " + cvUrl);
            }

            Resource resource = new UrlResource(filePath.toUri());
            
            String fileName = filePath.getFileName().toString();
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/pdf";
            }

            String disposition = asAttachment 
                    ? "attachment; filename=\"" + fileName + "\"" 
                    : "inline; filename=\"" + fileName + "\"";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                    .body(resource);

        } catch (IOException e) {
            throw new RuntimeException("Could not load CV file: " + e.getMessage(), e);
        }
    }
}
