package dev.zeroday.health.nutrition.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.zeroday.health.nutrition.dto.FoodAnalysisResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class OpenAiFoodAnalyzer {

    private final RestClient openAiRestClient;
    private final ObjectMapper objectMapper;
    private final boolean enabled;

    @Value("${openai.model}")
    private String model;

    public OpenAiFoodAnalyzer(@Qualifier("openAiRestClient") RestClient openAiRestClient,
                               @Value("${openai.api-key:}") String apiKey,
                               ObjectMapper objectMapper) {
        this.openAiRestClient = openAiRestClient;
        this.objectMapper = objectMapper;
        this.enabled = apiKey != null && !apiKey.isBlank();
    }

    public boolean isEnabled() {
        return enabled;
    }

    private static final String SYSTEM_PROMPT = """
            You are a nutritional analysis assistant for a health tracking app.

            RULES:
            1. ONLY analyze real, edible food and beverages that humans normally consume.
            2. If the input describes non-food items, inedible objects, inappropriate content, \
               or anything that is not a real food/drink, respond with:
               {"foods":[],"totals":{"calories":0,"proteinG":0,"carbsG":0,"fatG":0},"confidence":"none","notes":"Unable to determine nutritional values. Please enter a valid food description."}
            3. CRITICAL — QUANTITIES: When the user says a number, that IS the quantity. \
               "3 hard boiled eggs" means servingSize="3 eggs" and ALL nutritional values must be for 3 eggs, not 1. \
               "10 crackers" means servingSize="10 crackers" with nutrition for all 10. \
               "2 slices of pizza" means servingSize="2 slices" with nutrition for both slices. \
               NEVER return servingSize="1 egg" when the user said "3 eggs". The servingSize MUST match the stated quantity.
            4. If no quantity is specified, assume a standard single serving.
            5. Account for cooking methods: fried adds oil/fat, grilled is leaner, sautéed includes butter/oil.
            6. Include condiments, sauces, dressings, and toppings if mentioned.
            7. List each food item separately, even within one meal.

            Return ONLY valid JSON with this exact structure:
            {
              "foods": [
                {
                  "name": "food name",
                  "servingSize": "amount with unit",
                  "calories": 0,
                  "proteinG": 0.0,
                  "carbsG": 0.0,
                  "fatG": 0.0,
                  "fiberG": 0.0,
                  "sugarG": 0.0,
                  "sodiumMg": 0.0,
                  "cholesterolMg": 0.0,
                  "saturatedFatG": 0.0,
                  "transFatG": 0.0,
                  "potassiumMg": 0.0
                }
              ],
              "totals": {
                "calories": 0,
                "proteinG": 0.0,
                "carbsG": 0.0,
                "fatG": 0.0
              },
              "confidence": "high",
              "notes": "any relevant notes"
            }

            Always return numeric values, never null. Be accurate with USDA-based nutritional data.
            """;

    public FoodAnalysisResponse analyzeWithKey(String description, String apiKey) {
        RestClient client = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
        Map<String, Object> req = Map.of(
                "model", model,
                "temperature", 0.1,
                "messages", List.of(
                        Map.of("role", "system", "content", SYSTEM_PROMPT),
                        Map.of("role", "user", "content", description)
                )
        );
        String responseBody = client.post().uri("/chat/completions").body(req).retrieve().body(String.class);
        return parseResponse(responseBody);
    }

    public FoodAnalysisResponse analyze(String description) {
        Map<String, Object> request = Map.of(
                "model", model,
                "temperature", 0.1,
                "messages", List.of(
                        Map.of("role", "system", "content", SYSTEM_PROMPT),
                        Map.of("role", "user", "content", description)
                )
        );

        String responseBody = openAiRestClient.post()
                .uri("/chat/completions")
                .body(request)
                .retrieve()
                .body(String.class);

        return parseResponse(responseBody);
    }

    public String getRawResponse(String description) {
        Map<String, Object> request = Map.of(
                "model", model,
                "temperature", 0.1,
                "messages", List.of(
                        Map.of("role", "system", "content", SYSTEM_PROMPT),
                        Map.of("role", "user", "content", description)
                )
        );

        return openAiRestClient.post()
                .uri("/chat/completions")
                .body(request)
                .retrieve()
                .body(String.class);
    }

    private static final String IMAGE_SYSTEM_PROMPT = """
            You are a nutritional analysis assistant for a health tracking app. Analyze the food in this image.

            RULES:
            1. ONLY analyze real, edible food and beverages visible in the image.
            2. If the image does NOT contain food (objects, people, text, non-food items, \
               inappropriate content), respond with:
               {"foods":[],"totals":{"calories":0,"proteinG":0,"carbsG":0,"fatG":0},"confidence":"none","notes":"No food detected in the image. Please upload a photo of food."}
            3. PORTION ESTIMATION — use visual cues:
               - Compare food to plate size (standard dinner plate ~10 inches)
               - Look for utensils, hands, cups, or bottles as size references
               - Estimate pasta/rice by how much of the plate it fills
               - Account for depth/height of food piles
            4. IDENTIFY EVERYTHING visible:
               - Main protein (chicken, steak, fish, tofu, etc.)
               - Sides (rice, vegetables, bread, salad, fries, etc.)
               - Sauces, dressings, gravies, condiments
               - Oils/butter visible (shiny = oil, golden edges = fried)
               - Toppings: cheese, nuts, seeds, croutons, herbs
               - Beverages if visible
            5. List EACH item separately with its estimated portion.
            6. Account for cooking method: fried, grilled, baked, steamed, raw.

            Return ONLY valid JSON with this exact structure:
            {
              "foods": [
                {
                  "name": "food name",
                  "servingSize": "estimated amount with unit",
                  "calories": 0,
                  "proteinG": 0.0,
                  "carbsG": 0.0,
                  "fatG": 0.0,
                  "fiberG": 0.0,
                  "sugarG": 0.0,
                  "sodiumMg": 0.0,
                  "cholesterolMg": 0.0,
                  "saturatedFatG": 0.0,
                  "transFatG": 0.0,
                  "potassiumMg": 0.0
                }
              ],
              "totals": {
                "calories": 0,
                "proteinG": 0.0,
                "carbsG": 0.0,
                "fatG": 0.0
              },
              "confidence": "high",
              "notes": "description of what was identified and any assumptions made about portions"
            }

            Always return numeric values, never null. Be thorough — users rely on this for health tracking.
            """;


    public FoodAnalysisResponse analyzeImage(byte[] imageBytes, String apiKey) {
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);
        RestClient client = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();

        Map<String, Object> req = Map.of(
                "model", "gpt-4o",
                "temperature", 0.1,
                "max_tokens", 2000,
                "messages", List.of(
                        Map.of("role", "system", "content", IMAGE_SYSTEM_PROMPT),
                        Map.of("role", "user", "content", List.of(
                                Map.of("type", "image_url", "image_url",
                                        Map.of("url", "data:image/jpeg;base64," + base64Image, "detail", "high"))
                        ))
                )
        );
        String responseBody = client.post().uri("/chat/completions").body(req).retrieve().body(String.class);
        return parseResponse(responseBody);
    }


    public FoodAnalysisResponse analyzeImageWithDefaultKey(byte[] imageBytes) {
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        Map<String, Object> req = Map.of(
                "model", "gpt-4o",
                "temperature", 0.1,
                "max_tokens", 2000,
                "messages", List.of(
                        Map.of("role", "system", "content", IMAGE_SYSTEM_PROMPT),
                        Map.of("role", "user", "content", List.of(
                                Map.of("type", "image_url", "image_url",
                                        Map.of("url", "data:image/jpeg;base64," + base64Image, "detail", "high"))
                        ))
                )
        );
        String responseBody = openAiRestClient.post()
                .uri("/chat/completions")
                .body(req)
                .retrieve()
                .body(String.class);
        return parseResponse(responseBody);
    }

    private FoodAnalysisResponse parseResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String content = root.path("choices").get(0).path("message").path("content").asText();

            content = content.strip();
            if (content.startsWith("```json")) {
                content = content.substring(7);
            } else if (content.startsWith("```")) {
                content = content.substring(3);
            }
            if (content.endsWith("```")) {
                content = content.substring(0, content.length() - 3);
            }
            content = content.strip();

            JsonNode analysisNode = objectMapper.readTree(content);
            return mapToResponse(analysisNode);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse OpenAI response", e);
            throw new RuntimeException("Failed to parse food analysis response", e);
        }
    }

    private FoodAnalysisResponse mapToResponse(JsonNode node) {
        List<FoodAnalysisResponse.AnalyzedFood> foods = new ArrayList<>();
        JsonNode foodsNode = node.path("foods");
        if (foodsNode.isArray()) {
            for (JsonNode foodNode : foodsNode) {
                foods.add(FoodAnalysisResponse.AnalyzedFood.builder()
                        .name(foodNode.path("name").asText())
                        .servingSize(foodNode.path("servingSize").asText())
                        .calories(foodNode.path("calories").asInt(0))
                        .proteinG(toBigDecimal(foodNode, "proteinG"))
                        .carbsG(toBigDecimal(foodNode, "carbsG"))
                        .fatG(toBigDecimal(foodNode, "fatG"))
                        .fiberG(toBigDecimal(foodNode, "fiberG"))
                        .sugarG(toBigDecimal(foodNode, "sugarG"))
                        .sodiumMg(toBigDecimal(foodNode, "sodiumMg"))
                        .cholesterolMg(toBigDecimal(foodNode, "cholesterolMg"))
                        .saturatedFatG(toBigDecimal(foodNode, "saturatedFatG"))
                        .transFatG(toBigDecimal(foodNode, "transFatG"))
                        .potassiumMg(toBigDecimal(foodNode, "potassiumMg"))
                        .build());
            }
        }

        JsonNode totalsNode = node.path("totals");
        FoodAnalysisResponse.Totals totals = FoodAnalysisResponse.Totals.builder()
                .calories(totalsNode.path("calories").asInt(0))
                .proteinG(toBigDecimal(totalsNode, "proteinG"))
                .carbsG(toBigDecimal(totalsNode, "carbsG"))
                .fatG(toBigDecimal(totalsNode, "fatG"))
                .build();

        return FoodAnalysisResponse.builder()
                .foods(foods)
                .totals(totals)
                .confidence(node.path("confidence").asText("medium"))
                .notes(node.path("notes").asText(null))
                .build();
    }

    private BigDecimal toBigDecimal(JsonNode parent, String field) {
        JsonNode value = parent.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(value.asDouble(0.0));
    }
}
