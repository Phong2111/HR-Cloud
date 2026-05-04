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

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiParsingService {

    private static final Map<String, List<String>> POSITIONS_BY_INDUSTRY = new LinkedHashMap<>();
    private static final Map<String, List<String>> SKILLS_BY_INDUSTRY = new LinkedHashMap<>();
    private static final List<String> ALL_POSITIONS;
    private static final List<String> ALL_SKILLS;

    static {
        POSITIONS_BY_INDUSTRY.put("Technology", List.of(
                "Backend Developer",
                "Frontend Developer",
                "Fullstack Developer",
                "DevOps Engineer",
                "Data Engineer",
                "QA Engineer",
                "Product Manager"
        ));
        POSITIONS_BY_INDUSTRY.put("Finance", List.of(
                "Financial Analyst",
                "Credit Risk Specialist",
                "Internal Auditor",
                "Investment Associate",
                "Compliance Officer"
        ));
        POSITIONS_BY_INDUSTRY.put("Healthcare", List.of(
                "Healthcare Operations Specialist",
                "Medical Sales Executive",
                "Clinical Data Coordinator",
                "Patient Service Manager"
        ));
        POSITIONS_BY_INDUSTRY.put("Education", List.of(
                "Training Specialist",
                "Academic Advisor",
                "Program Coordinator",
                "Education Consultant"
        ));
        POSITIONS_BY_INDUSTRY.put("Manufacturing", List.of(
                "Production Supervisor",
                "Supply Chain Planner",
                "Quality Control Engineer",
                "Maintenance Manager"
        ));
        POSITIONS_BY_INDUSTRY.put("Retail", List.of(
                "Store Manager",
                "Category Executive",
                "Merchandising Specialist",
                "E-commerce Operations Specialist"
        ));
        POSITIONS_BY_INDUSTRY.put("Logistics", List.of(
                "Logistics Coordinator",
                "Warehouse Supervisor",
                "Procurement Specialist",
                "Transportation Planner"
        ));
        POSITIONS_BY_INDUSTRY.put("Hospitality", List.of(
                "Guest Relations Manager",
                "Food and Beverage Supervisor",
                "Event Coordinator",
                "Hotel Operations Executive"
        ));

        SKILLS_BY_INDUSTRY.put("Technology", List.of(
                "Java", "Spring Boot", "JavaScript", "TypeScript", "React", "Node.js",
                "SQL Server", "MongoDB", "Docker", "Kubernetes", "REST API", "Microservices"
        ));
        SKILLS_BY_INDUSTRY.put("Finance", List.of(
                "Financial Reporting", "Risk Analysis", "Compliance", "Data Analysis", "Excel",
                "SQL", "Communication", "Problem Solving"
        ));
        SKILLS_BY_INDUSTRY.put("Healthcare", List.of(
                "Healthcare Operations", "Patient Service", "Compliance", "Clinical Data",
                "Medical Terminology", "Communication"
        ));
        SKILLS_BY_INDUSTRY.put("Education", List.of(
                "Curriculum Design", "Training Delivery", "Assessment", "Presentation",
                "Classroom Management", "Communication"
        ));
        SKILLS_BY_INDUSTRY.put("Manufacturing", List.of(
                "Quality Control", "Lean Manufacturing", "Supply Chain", "Inventory Management",
                "Root Cause Analysis", "Safety Compliance"
        ));
        SKILLS_BY_INDUSTRY.put("Retail", List.of(
                "Customer Service", "Merchandising", "Sales Planning", "Inventory Management",
                "E-commerce Operations", "Communication"
        ));
        SKILLS_BY_INDUSTRY.put("Logistics", List.of(
                "Supply Chain", "Procurement", "Warehouse Management", "Transportation Planning",
                "Inventory Management", "Data Analysis"
        ));
        SKILLS_BY_INDUSTRY.put("Hospitality", List.of(
                "Guest Service", "Event Coordination", "Operations Management",
                "Food and Beverage", "Communication", "Problem Solving"
        ));

        ALL_POSITIONS = POSITIONS_BY_INDUSTRY.values().stream()
                .flatMap(List::stream)
                .distinct()
                .toList();
        ALL_SKILLS = SKILLS_BY_INDUSTRY.values().stream()
                .flatMap(List::stream)
                .distinct()
                .toList();
    }

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
            return normalizeCandidateRequest(mockParseCvText(cvText), cvText);
        }

        try {
            String prompt = buildPrompt(cvText);
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
                        jsonResponse = cleanJsonResponse(jsonResponse);
                        CandidateRequest parsed = objectMapper.readValue(jsonResponse, CandidateRequest.class);
                        return normalizeCandidateRequest(parsed, cvText);
                    }
                }
            }
            throw new RuntimeException("Failed to parse response from AI");

        } catch (Exception e) {
            System.err.println("AI Parsing failed: " + e.getMessage() + ". Falling back to mock.");
            return normalizeCandidateRequest(mockParseCvText(cvText), cvText);
        }
    }

    private String buildPrompt(String cvText) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Ban la tro ly nhan su. Nhiem vu la doc CV va tra ve DUY NHAT mot JSON hop le.\n");
        prompt.append("Yeu cau rat quan trong:\n");
        prompt.append("1. email va fullName phai lay dung theo CV neu tim thay.\n");
        prompt.append("2. industry phai chon CHINH XAC mot gia tri trong danh sach hop le ben duoi. Neu khong chac thi de null.\n");
        prompt.append("3. position phai chon CHINH XAC mot gia tri trong danh sach vi tri hop le tuong ung voi industry. Khong duoc tu viet vi tri khac. Neu khong chac thi de null.\n");
        prompt.append("4. skills chi duoc chon tu danh sach ky nang hop le ben duoi. Khong duoc tu viet them ky nang khac. Neu khong chac thi bo qua.\n");
        prompt.append("5. chi lay ky nang va vi tri co bang chung ro rang trong CV, khong du doan qua muc.\n");
        prompt.append("6. yearsExperience la tong so nam kinh nghiem gan dung, neu khong thay thi de 0.\n");
        prompt.append("7. Khong giai thich, khong markdown, khong them text ngoai JSON.\n\n");
        prompt.append("Danh sach industry hop le:\n");
        prompt.append(String.join(", ", POSITIONS_BY_INDUSTRY.keySet())).append("\n\n");
        prompt.append("Danh sach position hop le theo tung industry:\n");
        for (Map.Entry<String, List<String>> entry : POSITIONS_BY_INDUSTRY.entrySet()) {
            prompt.append("- ").append(entry.getKey()).append(": ")
                    .append(String.join(", ", entry.getValue()))
                    .append("\n");
        }
        prompt.append("\nDanh sach skills hop le theo tung industry:\n");
        for (Map.Entry<String, List<String>> entry : SKILLS_BY_INDUSTRY.entrySet()) {
            prompt.append("- ").append(entry.getKey()).append(": ")
                    .append(String.join(", ", entry.getValue()))
                    .append("\n");
        }
        prompt.append("\nTra ve JSON theo dung cau truc sau:\n");
        prompt.append("{\n");
        prompt.append("  \"fullName\": \"string or null\",\n");
        prompt.append("  \"email\": \"string or null\",\n");
        prompt.append("  \"phone\": \"string or null\",\n");
        prompt.append("  \"industry\": \"one valid industry or null\",\n");
        prompt.append("  \"position\": \"one valid position or null\",\n");
        prompt.append("  \"yearsExperience\": 0,\n");
        prompt.append("  \"skills\": [\"valid skill 1\", \"valid skill 2\"]\n");
        prompt.append("}\n\n");
        prompt.append("Noi dung CV:\n").append(cvText);
        return prompt.toString();
    }

    private CandidateRequest normalizeCandidateRequest(CandidateRequest request, String cvText) {
        CandidateRequest normalized = request == null ? new CandidateRequest() : request;

        if (normalized.getFullName() == null || normalized.getFullName().isBlank()) {
            normalized.setFullName(extractNameFromCvText(cvText));
        } else {
            normalized.setFullName(normalized.getFullName().trim());
        }

        if (normalized.getEmail() == null || normalized.getEmail().isBlank()) {
            Matcher emailMatcher = Pattern.compile("[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}").matcher(cvText);
            if (emailMatcher.find()) {
                normalized.setEmail(emailMatcher.group());
            }
        } else {
            normalized.setEmail(normalized.getEmail().trim());
        }

        if (normalized.getPhone() == null || normalized.getPhone().isBlank()) {
            Matcher phoneMatcher = Pattern.compile("(?:\\+?\\d{1,3}[\\s.-]?)?\\(?\\d{2,4}\\)?[\\s.-]?\\d{3,4}[\\s.-]?\\d{3,4}").matcher(cvText);
            if (phoneMatcher.find()) {
                normalized.setPhone(phoneMatcher.group().trim());
            }
        } else {
            normalized.setPhone(normalized.getPhone().trim());
        }

        String normalizedIndustry = normalizeIndustry(normalized.getIndustry(), cvText);
        normalized.setIndustry(normalizedIndustry);

        String normalizedPosition = normalizePosition(normalized.getPosition(), normalizedIndustry, cvText);
        normalized.setPosition(normalizedPosition);

        if (normalized.getYearsExperience() == null || normalized.getYearsExperience() < 0) {
            normalized.setYearsExperience(extractYearsExperience(cvText));
        }

        normalized.setSkills(normalizeSkills(normalized.getSkills(), normalizedIndustry, cvText));
        return normalized;
    }

    private String normalizeIndustry(String aiIndustry, String cvText) {
        String matchedFromAi = bestMatch(aiIndustry, new ArrayList<>(POSITIONS_BY_INDUSTRY.keySet()));
        if (matchedFromAi != null) {
            return matchedFromAi;
        }

        String text = normalizeText(cvText);
        if (containsAny(text, "bank", "finance", "accounting", "audit", "financial")) return "Finance";
        if (containsAny(text, "hospital", "clinic", "medical", "healthcare", "patient")) return "Healthcare";
        if (containsAny(text, "teacher", "education", "training", "academic", "curriculum")) return "Education";
        if (containsAny(text, "warehouse", "logistics", "shipping", "procurement", "supply chain", "transport")) return "Logistics";
        if (containsAny(text, "retail", "store", "merchand", "e-commerce", "customer service")) return "Retail";
        if (containsAny(text, "hotel", "hospitality", "restaurant", "event", "guest")) return "Hospitality";
        if (containsAny(text, "factory", "manufacturing", "production", "quality control", "maintenance")) return "Manufacturing";
        if (containsAny(text, "java", "spring", "react", "frontend", "backend", "devops", "software", "developer", "qa", "data engineer")) return "Technology";
        return null;
    }

    private String normalizePosition(String aiPosition, String industry, String cvText) {
        List<String> allowedPositions = industry != null
                ? POSITIONS_BY_INDUSTRY.getOrDefault(industry, ALL_POSITIONS)
                : ALL_POSITIONS;

        String matchedFromAi = bestMatch(aiPosition, allowedPositions);
        if (matchedFromAi != null) {
            return matchedFromAi;
        }

        String text = normalizeText(cvText);
        if (industry == null) {
            if (containsAny(text, "backend developer", "backend engineer", "java developer", "spring boot")) return "Backend Developer";
            if (containsAny(text, "frontend developer", "frontend engineer", "react developer", "javascript developer")) return "Frontend Developer";
            if (containsAny(text, "fullstack", "full stack", "full-stack")) return "Fullstack Developer";
            if (containsAny(text, "devops", "kubernetes", "ci/cd", "infrastructure")) return "DevOps Engineer";
            if (containsAny(text, "data engineer", "etl", "pipeline")) return "Data Engineer";
            if (containsAny(text, "qa engineer", "quality assurance", "test automation", "tester")) return "QA Engineer";
            if (containsAny(text, "product manager", "product owner")) return "Product Manager";
        }

        if ("Technology".equals(industry)) {
            if (containsAny(text, "backend developer", "backend engineer", "java developer", "spring boot")) return "Backend Developer";
            if (containsAny(text, "frontend developer", "frontend engineer", "react developer", "javascript developer")) return "Frontend Developer";
            if (containsAny(text, "fullstack", "full stack", "full-stack")) return "Fullstack Developer";
            if (containsAny(text, "devops", "kubernetes", "ci/cd", "infrastructure")) return "DevOps Engineer";
            if (containsAny(text, "data engineer", "etl", "pipeline")) return "Data Engineer";
            if (containsAny(text, "qa engineer", "quality assurance", "test automation", "tester")) return "QA Engineer";
            if (containsAny(text, "product manager", "product owner")) return "Product Manager";
        } else if ("Finance".equals(industry)) {
            if (containsAny(text, "financial analyst")) return "Financial Analyst";
            if (containsAny(text, "credit risk", "risk specialist")) return "Credit Risk Specialist";
            if (containsAny(text, "internal auditor", "internal audit")) return "Internal Auditor";
            if (containsAny(text, "investment associate", "investment analyst")) return "Investment Associate";
            if (containsAny(text, "compliance officer", "compliance specialist")) return "Compliance Officer";
        } else if ("Healthcare".equals(industry)) {
            if (containsAny(text, "healthcare operations")) return "Healthcare Operations Specialist";
            if (containsAny(text, "medical sales")) return "Medical Sales Executive";
            if (containsAny(text, "clinical data")) return "Clinical Data Coordinator";
            if (containsAny(text, "patient service")) return "Patient Service Manager";
        } else if ("Education".equals(industry)) {
            if (containsAny(text, "training specialist", "trainer")) return "Training Specialist";
            if (containsAny(text, "academic advisor")) return "Academic Advisor";
            if (containsAny(text, "program coordinator")) return "Program Coordinator";
            if (containsAny(text, "education consultant")) return "Education Consultant";
        } else if ("Manufacturing".equals(industry)) {
            if (containsAny(text, "production supervisor")) return "Production Supervisor";
            if (containsAny(text, "supply chain planner")) return "Supply Chain Planner";
            if (containsAny(text, "quality control engineer")) return "Quality Control Engineer";
            if (containsAny(text, "maintenance manager")) return "Maintenance Manager";
        } else if ("Retail".equals(industry)) {
            if (containsAny(text, "store manager")) return "Store Manager";
            if (containsAny(text, "category executive")) return "Category Executive";
            if (containsAny(text, "merchandising specialist")) return "Merchandising Specialist";
            if (containsAny(text, "e-commerce operations")) return "E-commerce Operations Specialist";
        } else if ("Logistics".equals(industry)) {
            if (containsAny(text, "logistics coordinator")) return "Logistics Coordinator";
            if (containsAny(text, "warehouse supervisor")) return "Warehouse Supervisor";
            if (containsAny(text, "procurement specialist")) return "Procurement Specialist";
            if (containsAny(text, "transportation planner")) return "Transportation Planner";
        } else if ("Hospitality".equals(industry)) {
            if (containsAny(text, "guest relations")) return "Guest Relations Manager";
            if (containsAny(text, "food and beverage")) return "Food and Beverage Supervisor";
            if (containsAny(text, "event coordinator")) return "Event Coordinator";
            if (containsAny(text, "hotel operations")) return "Hotel Operations Executive";
        }

        return allowedPositions.contains(aiPosition) ? aiPosition : null;
    }

    private List<String> normalizeSkills(List<String> aiSkills, String industry, String cvText) {
        List<String> allowedSkills = industry != null
                ? SKILLS_BY_INDUSTRY.getOrDefault(industry, ALL_SKILLS)
                : ALL_SKILLS;

        LinkedHashSet<String> normalizedSkills = new LinkedHashSet<>();
        if (aiSkills != null) {
            for (String skill : aiSkills) {
                String matched = bestMatch(skill, allowedSkills);
                if (matched != null) {
                    normalizedSkills.add(matched);
                }
            }
        }

        String text = normalizeText(cvText);
        for (String allowedSkill : allowedSkills) {
            if (text.contains(normalizeText(allowedSkill))) {
                normalizedSkills.add(allowedSkill);
            }
        }

        if (industry == null || "Technology".equals(industry)) {
            addAliasSkill(text, normalizedSkills, "Spring Boot", "spring boot", "spring");
            addAliasSkill(text, normalizedSkills, "JavaScript", "javascript", "js");
            addAliasSkill(text, normalizedSkills, "TypeScript", "typescript", "ts");
            addAliasSkill(text, normalizedSkills, "Kubernetes", "kubernetes", "k8s");
            addAliasSkill(text, normalizedSkills, "REST API", "rest api", "restful api");
            addAliasSkill(text, normalizedSkills, "Microservices", "microservices", "microservice");
            addAliasSkill(text, normalizedSkills, "Node.js", "node.js", "nodejs");
            addAliasSkill(text, normalizedSkills, "SQL Server", "sql server", "mssql");
        }

        if ("Finance".equals(industry)) {
            addAliasSkill(text, normalizedSkills, "Excel", "excel");
            addAliasSkill(text, normalizedSkills, "Data Analysis", "data analysis", "analytics");
        }

        return normalizedSkills.stream().limit(8).toList();
    }

    private void addAliasSkill(String text, LinkedHashSet<String> skills, String canonicalSkill, String... aliases) {
        for (String alias : aliases) {
            if (text.contains(normalizeText(alias))) {
                skills.add(canonicalSkill);
                return;
            }
        }
    }

    private CandidateRequest mockParseCvText(String cvText) {
        CandidateRequest req = new CandidateRequest();

        String lower = normalizeText(cvText);
        if (containsAny(lower, "bank", "finance", "accounting", "audit")) {
            req.setIndustry("Finance");
            req.setPosition("Financial Analyst");
            req.setSkills(List.of("Financial Reporting", "Excel", "Risk Analysis"));
        } else if (containsAny(lower, "hospital", "clinic", "medical", "patient")) {
            req.setIndustry("Healthcare");
            req.setPosition("Healthcare Operations Specialist");
            req.setSkills(List.of("Healthcare Operations", "Patient Service", "Compliance"));
        } else if (containsAny(lower, "teacher", "education", "training", "academic")) {
            req.setIndustry("Education");
            req.setPosition("Training Specialist");
            req.setSkills(List.of("Curriculum Design", "Training Delivery", "Assessment"));
        } else if (containsAny(lower, "devops", "docker", "kubernetes", "ci/cd")) {
            req.setIndustry("Technology");
            req.setPosition("DevOps Engineer");
            req.setSkills(List.of("Docker", "Kubernetes", "REST API"));
        } else if (containsAny(lower, "react", "frontend", "javascript")) {
            req.setIndustry("Technology");
            req.setPosition("Frontend Developer");
            req.setSkills(List.of("React", "JavaScript", "TypeScript"));
        } else if (containsAny(lower, "fullstack", "full stack", "full-stack")) {
            req.setIndustry("Technology");
            req.setPosition("Fullstack Developer");
            req.setSkills(List.of("Java", "React", "Node.js"));
        } else if (containsAny(lower, "data engineer", "etl", "pipeline", "analytics")) {
            req.setIndustry("Technology");
            req.setPosition("Data Engineer");
            req.setSkills(List.of("SQL Server", "MongoDB", "Microservices"));
        } else if (containsAny(lower, "qa", "testing", "test automation", "quality assurance")) {
            req.setIndustry("Technology");
            req.setPosition("QA Engineer");
            req.setSkills(List.of("REST API", "Docker", "Java"));
        } else if (containsAny(lower, "warehouse", "logistics", "shipping", "procurement")) {
            req.setIndustry("Logistics");
            req.setPosition("Logistics Coordinator");
            req.setSkills(List.of("Supply Chain", "Warehouse Management", "Data Analysis"));
        } else if (containsAny(lower, "store", "retail", "merchand")) {
            req.setIndustry("Retail");
            req.setPosition("Store Manager");
            req.setSkills(List.of("Customer Service", "Sales Planning", "Inventory Management"));
        } else if (containsAny(lower, "hotel", "hospitality", "restaurant", "guest")) {
            req.setIndustry("Hospitality");
            req.setPosition("Guest Relations Manager");
            req.setSkills(List.of("Guest Service", "Event Coordination", "Communication"));
        } else if (containsAny(lower, "factory", "manufacturing", "production")) {
            req.setIndustry("Manufacturing");
            req.setPosition("Production Supervisor");
            req.setSkills(List.of("Quality Control", "Lean Manufacturing", "Safety Compliance"));
        } else {
            req.setIndustry("Technology");
            req.setPosition("Backend Developer");
            req.setSkills(List.of("Java", "Spring Boot", "SQL Server"));
        }

        req.setFullName(extractNameFromCvText(cvText));
        req.setYearsExperience(extractYearsExperience(cvText));

        Matcher emailMatcher = Pattern.compile("[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}").matcher(cvText);
        if (emailMatcher.find()) {
            req.setEmail(emailMatcher.group());
        }

        Matcher phoneMatcher = Pattern.compile("(?:\\+?\\d{1,3}[\\s.-]?)?\\(?\\d{2,4}\\)?[\\s.-]?\\d{3,4}[\\s.-]?\\d{3,4}").matcher(cvText);
        if (phoneMatcher.find()) {
            req.setPhone(phoneMatcher.group().trim());
        }

        return req;
    }

    private int extractYearsExperience(String cvText) {
        Matcher expMatcher = Pattern.compile("(\\d+)\\s*(?:years|year|nam)").matcher(normalizeText(cvText));
        if (expMatcher.find()) {
            return Integer.parseInt(expMatcher.group(1));
        }
        return 0;
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

    private String extractNameFromCvText(String cvText) {
        if (cvText == null || cvText.isBlank()) return null;

        String[] lines = cvText.split("\\r?\\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;
            if (trimmed.contains("@") || trimmed.contains("http") || trimmed.contains("www.")) continue;
            if (trimmed.matches(".*\\d{4,}.*")) continue;

            String[] words = trimmed.split("\\s+");
            if (words.length >= 2 && words.length <= 6) {
                boolean allAlpha = true;
                for (String word : words) {
                    if (!word.matches("[\\p{L}.'-]+")) {
                        allAlpha = false;
                        break;
                    }
                }
                if (allAlpha) {
                    return trimmed;
                }
            }
        }
        return null;
    }

    private String bestMatch(String rawValue, List<String> options) {
        if (rawValue == null || rawValue.isBlank()) {
            return null;
        }

        String normalizedRaw = normalizeText(rawValue);
        for (String option : options) {
            String normalizedOption = normalizeText(option);
            if (normalizedOption.equals(normalizedRaw)) {
                return option;
            }
        }

        for (String option : options) {
            String normalizedOption = normalizeText(option);
            if (normalizedOption.contains(normalizedRaw) || normalizedRaw.contains(normalizedOption)) {
                return option;
            }
        }

        return null;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(normalizeText(keyword))) {
                return true;
            }
        }
        return false;
    }

    private String normalizeText(String input) {
        if (input == null) {
            return "";
        }
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.toLowerCase(Locale.ROOT).replace('đ', 'd').trim();
    }
}
