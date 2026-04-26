package com.hrcloud.recruitment.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@Service
public class PdfExtractionService {

    public String extractTextFromPdf(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("Cannot extract text from an empty file.");
        }

        try (InputStream inputStream = file.getInputStream();
             PDDocument document = Loader.loadPDF(inputStream.readAllBytes())) {

            if (document.isEncrypted()) {
                throw new RuntimeException("Cannot extract text from encrypted PDF.");
            }

            PDFTextStripper stripper = new PDFTextStripper();
            String extractedText = stripper.getText(document);

            return extractedText != null ? extractedText.trim() : "";

        } catch (IOException e) {
            throw new RuntimeException("Error extracting text from PDF: " + e.getMessage(), e);
        }
    }
}
