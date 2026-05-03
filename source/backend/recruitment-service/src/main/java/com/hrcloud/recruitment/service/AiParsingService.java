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
                    "Tên ứng viên (fullName), email, số điện thoại (phone), lĩnh vực ngành nghề (industry), vị trí ứng tuyển (position), " +
                    "số năm kinh nghiệm (yearsExperience), và kỹ năng (skills). " +
                    "Nếu thiếu mục nào thì sẽ bỏ trống mục đó (để null đối với chuỗi/số, hoặc mảng rỗng đối với danh sách). " +
                    "Chỉ trả về DUY NHẤT một chuỗi JSON hợp lệ theo cấu trúc dưới đây. Không giải thích thêm, không dùng markdown (```json):\n" +
                    "{\n" +
                    "  \"fullName\": \"string\",\n" +
                    "  \"email\": \"string\",\n" +
                    "  \"phone\": \"string\",\n" +
                    "  \"industry\": \"string\",\n" +
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
        // A simple keyword-based mock for demonstration purposes.
        // Positions MUST match exactly the frontend's POSITIONS_BY_INDUSTRY lists.
        CandidateRequest req = new CandidateRequest();

        String lower = cvText.toLowerCase();
        if (lower.contains("bank") || lower.contains("finance") || lower.contains("accounting")) {
            req.setIndustry("Finance");
            req.setPosition("Financial Analyst");
            req.setSkills(List.of("Financial Reporting", "Excel", "Risk Analysis"));
        } else if (lower.contains("hospital") || lower.contains("clinic") || lower.contains("medical")) {
            req.setIndustry("Healthcare");
            req.setPosition("Healthcare Operations Specialist");
            req.setSkills(List.of("Healthcare Operations", "Patient Service", "Compliance"));
        } else if (lower.contains("teacher") || lower.contains("education") || lower.contains("training")) {
            req.setIndustry("Education");
            req.setPosition("Training Specialist");
            req.setSkills(List.of("Curriculum Design", "Training Delivery", "Assessment"));
        } else if (lower.contains("java") || lower.contains("spring") || lower.contains("backend")) {
            req.setIndustry("Technology");
            req.setPosition("Backend Developer");
            req.setSkills(List.of("Java", "Spring Boot", "SQL Server"));
        } else if (lower.contains("react") || lower.contains("frontend") || lower.contains("javascript")) {
            req.setIndustry("Technology");
            req.setPosition("Frontend Developer");
            req.setSkills(List.of("React", "JavaScript", "TypeScript"));
        } else if (lower.contains("devops") || lower.contains("docker") || lower.contains("kubernetes") || lower.contains("ci/cd")) {
            req.setIndustry("Technology");
            req.setPosition("DevOps Engineer");
            req.setSkills(List.of("Docker", "Kubernetes", "REST API"));
        } else if (lower.contains("data") || lower.contains("analytics") || lower.contains("etl") || lower.contains("pipeline")) {
            req.setIndustry("Technology");
            req.setPosition("Data Engineer");
            req.setSkills(List.of("SQL Server", "MongoDB", "Microservices"));
        } else if (lower.contains("qa") || lower.contains("testing") || lower.contains("automation test")) {
            req.setIndustry("Technology");
            req.setPosition("QA Engineer");
            req.setSkills(List.of("Java", "REST API", "Docker"));
        } else if (lower.contains("fullstack") || lower.contains("full stack") || lower.contains("full-stack")) {
            req.setIndustry("Technology");
            req.setPosition("Fullstack Developer");
            req.setSkills(List.of("Java", "React", "Node.js"));
        } else if (lower.contains("product") || lower.contains("scrum") || lower.contains("agile")) {
            req.setIndustry("Technology");
            req.setPosition("Product Manager");
            req.setSkills(List.of("REST API", "Microservices", "Docker"));
        } else if (lower.contains("warehouse") || lower.contains("logistics") || lower.contains("shipping")) {
            req.setIndustry("Logistics");
            req.setPosition("Logistics Coordinator");
            req.setSkills(List.of("Supply Chain", "Warehouse Management", "Data Analysis"));
        } else if (lower.contains("store") || lower.contains("retail") || lower.contains("merchandis")) {
            req.setIndustry("Retail");
            req.setPosition("Store Manager");
            req.setSkills(List.of("Customer Service", "Sales Planning", "Inventory Management"));
        } else if (lower.contains("hotel") || lower.contains("hospitality") || lower.contains("restaurant")) {
            req.setIndustry("Hospitality");
            req.setPosition("Guest Relations Manager");
            req.setSkills(List.of("Guest Service", "Event Coordination", "Communication"));
        } else if (lower.contains("factory") || lower.contains("manufacturing") || lower.contains("production")) {
            req.setIndustry("Manufacturing");
            req.setPosition("Production Supervisor");
            req.setSkills(List.of("Quality Control", "Lean Manufacturing", "Safety Compliance"));
        } else {
            // Default fallback — Technology / Backend Developer
            req.setIndustry("Technology");
            req.setPosition("Backend Developer");
            req.setSkills(List.of("Java", "Spring Boot", "SQL Server"));
        }

        // Try to extract the candidate's name from the first non-empty lines of the CV text
        String extractedName = extractNameFromCvText(cvText);
        req.setFullName(extractedName); // may be null — controller will fall back to filename

        // Try to extract years of experience
        Matcher expMatcher = Pattern.compile("(\\d+)\\s*(?:years|năm|year)").matcher(lower);
        if (expMatcher.find()) {
            req.setYearsExperience(Integer.parseInt(expMatcher.group(1)));
        } else {
            req.setYearsExperience(0);
        }

        // Try to extract email
        Matcher emailMatcher = Pattern.compile("[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}").matcher(cvText);
        if (emailMatcher.find()) {
            req.setEmail(emailMatcher.group());
        }

        // Try to extract phone
        Matcher phoneMatcher = Pattern.compile("(?:\\+?\\d{1,3}[\\s.-]?)?\\(?\\d{2,4}\\)?[\\s.-]?\\d{3,4}[\\s.-]?\\d{3,4}").matcher(cvText);
        if (phoneMatcher.find()) {
            req.setPhone(phoneMatcher.group().trim());
        }

        return req;
    }

    /**
     * Attempt to extract a candidate name from the first few lines of the CV text.
     * A simple heuristic: the first non-empty line that looks like a name
     * (2-5 words, no digits, no special URL/email patterns).
     */
    private String extractNameFromCvText(String cvText) {
        if (cvText == null || cvText.isBlank()) return null;

        String[] lines = cvText.split("\\r?\\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;
            // Skip lines that look like email, URL, phone, or contain too many numbers
            if (trimmed.contains("@") || trimmed.contains("http") || trimmed.contains("www.")) continue;
            if (trimmed.matches(".*\\d{4,}.*")) continue; // skip lines with long numbers (phone, date)
            // A name line usually has 2-5 words, all alphabetic (including Vietnamese chars)
            String[] words = trimmed.split("\\s+");
            if (words.length >= 2 && words.length <= 6) {
                boolean allAlpha = true;
                for (String w : words) {
                    // Allow alphabetic + accented chars (Vietnamese names)
                    if (!w.matches("[\\p{L}.'-]+")) {
                        allAlpha = false;
                        break;
                    }
                }
                if (allAlpha) {
                    return trimmed;
                }
            }
        }
        return null; // could not extract — let controller use filename
    }
}
