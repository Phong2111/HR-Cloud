package com.hrcloud.recruitment.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrcloud.recruitment.dto.CandidateRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiParsingService {

    @Value("${gemini.api.key:AIzaSyBbma0m3oXthxlUVBdKXiBjyHA0Yoi6b6Q}")
    private String geminiApiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent}")
    private String geminiApiUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public AiParsingService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public CandidateRequest parseCvText(String cvText) {
        if (geminiApiKey == null || geminiApiKey.isEmpty() || geminiApiKey.contains("YOUR_GEMINI")) {
            // Fallback mock if no API key is provided
            return mockParseCvText(cvText);
        }

        try {
            String prompt = "Bạn là một trợ lý nhân sự. Hãy phân tích CV sau và trích xuất các thông tin: " +
                    "Tên ứng viên (fullName), email, số điện thoại (phone), vị trí ứng tuyển (position), " +
                    "số năm kinh nghiệm (yearsExperience), và kỹ năng (skills). " +
                    "Nếu thiếu mục nào thì sẽ bỏ trống mục đó (để null đối với chuỗi/số, hoặc mảng rỗng đối với danh sách). " +
                    "Chỉ trả về DUY NHẤT một chuỗi JSON hợp lệ theo cấu trúc dưới đây. Không giải thích thêm, không dùng markdown (```json):\n" +
                    "{\n" +
                    "  \"fullName\": \"string\",\n" +
                    "  \"email\": \"string\",\n" +
                    "  \"phone\": \"string\",\n" +
                    "  \"position\": \"string\",\n" +
                    "  \"yearsExperience\": 0,\n" +
                    "  \"skills\": [\"string\", \"string\"]\n" +
                    "}\n\n" +
                    "Nội dung CV:\n" + cvText;

            String url = geminiApiUrl + "?key=" + geminiApiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> parts = Map.of("text", prompt);
            Map<String, Object> contents = Map.of("parts", List.of(parts));
            Map<String, Object> requestBody = Map.of("contents", List.of(contents));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> partsList = (List<Map<String, Object>>) content.get("parts");
                    if (partsList != null && !partsList.isEmpty()) {
                        String jsonResponse = (String) partsList.get(0).get("text");

                        // Clean up markdown if AI still includes it
                        jsonResponse = cleanJsonResponse(jsonResponse);

                        return objectMapper.readValue(jsonResponse, CandidateRequest.class);
                    }
                }
            }
            throw new RuntimeException("Failed to parse response from AI");

        } catch (Exception e) {
            System.err.println("AI Parsing failed: " + e.getMessage() + ". Falling back to mock.");
            return mockParseCvText(cvText);
        }
    }

    private String cleanJsonResponse(String json) {
        json = json.trim();
        if (json.startsWith("```json")) {
            json = json.substring(7);
        } else if (json.startsWith("```")) {
            json = json.substring(3);
        }
        if (json.endsWith("```")) {
            json = json.substring(0, json.length() - 3);
        }
        return json.trim();
    }

    private CandidateRequest mockParseCvText(String cvText) {
        // A very simple keyword-based mock for demonstration purposes
        CandidateRequest req = new CandidateRequest();

        String lower = cvText.toLowerCase();
        if (lower.contains("java") || lower.contains("spring")) {
            req.setPosition("Java Developer");
            req.setSkills(List.of("Java", "Spring Boot", "SQL"));
        } else if (lower.contains("react") || lower.contains("frontend")) {
            req.setPosition("Frontend Developer");
            req.setSkills(List.of("React", "JavaScript", "CSS"));
        } else {
            req.setPosition("Software Engineer");
            req.setSkills(List.of("Software Development"));
        }

        req.setFullName("Unknown Candidate");

        Matcher expMatcher = Pattern.compile("(\\d+)\\s*years").matcher(lower);
        if (expMatcher.find()) {
            req.setYearsExperience(Integer.parseInt(expMatcher.group(1)));
        } else {
            req.setYearsExperience(0);
        }

        return req;
    }
}
