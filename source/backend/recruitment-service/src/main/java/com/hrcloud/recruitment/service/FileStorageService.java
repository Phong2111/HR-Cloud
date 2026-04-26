package com.hrcloud.recruitment.service;

import org.springframework.beans.factory.annotation.Value;
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
}
