using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Immersio.Application.DTOs.Scenario;
using Immersio.Application.DTOs.Srs;
using Immersio.Application.DTOs.Practice;
using Immersio.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Immersio.Infrastructure.Services
{
    public class LlmService : ILLMService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly IApplicationDbContext _context;
        private const string NvidiaEndpoint = "https://integrate.api.nvidia.com/v1/chat/completions";
        private const string DefaultModel = "meta/llama-4-maverick-17b-128e-instruct";

        public LlmService(HttpClient httpClient, IConfiguration configuration, IApplicationDbContext context)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _context = context;
        }

        private async Task<(string ModelName, string Endpoint, string ApiKey, string ReasoningEffort)> GetModelConfigAsync(string modelKey, CancellationToken cancellationToken)
        {
            try
            {
                var modelSetting = await _context.SystemSettings
                    .FirstOrDefaultAsync(s => s.Key == modelKey, cancellationToken);
                var endpointSetting = await _context.SystemSettings
                    .FirstOrDefaultAsync(s => s.Key == "LlmEndpoint", cancellationToken);
                var reasoningEffortSetting = await _context.SystemSettings
                    .FirstOrDefaultAsync(s => s.Key == "ReasoningEffort", cancellationToken);

                var modelName = !string.IsNullOrWhiteSpace(modelSetting?.Value) ? modelSetting.Value : DefaultModel;
                var endpoint = !string.IsNullOrWhiteSpace(endpointSetting?.Value) ? endpointSetting.Value : NvidiaEndpoint;
                var reasoningEffort = !string.IsNullOrWhiteSpace(reasoningEffortSetting?.Value) ? reasoningEffortSetting.Value : "none";

                string apiKey = "";
                if (endpoint.Contains("groq.com", StringComparison.OrdinalIgnoreCase))
                {
                    apiKey = _configuration["Groq:ApiKey"] ?? "";
                }
                else if (endpoint.Contains("nvidia.com", StringComparison.OrdinalIgnoreCase) || endpoint.Contains("nvidia", StringComparison.OrdinalIgnoreCase))
                {
                    apiKey = _configuration["Nvidia:ApiKey"] ?? "";
                }
                else if (endpoint.Contains("stepfun.com", StringComparison.OrdinalIgnoreCase) || endpoint.Contains("stepfun", StringComparison.OrdinalIgnoreCase))
                {
                    apiKey = _configuration["StepFun:ApiKey"] ?? "";
                }
                else if (endpoint.Contains("opencode.ai", StringComparison.OrdinalIgnoreCase))
                {
                    apiKey = _configuration["OpenCode:ApiKey"] ?? "";
                }
                else
                {
                    apiKey = _configuration["Groq:ApiKey"] ?? "";
                }

                Console.WriteLine($"\n[AI DIAGNOSTICS] {DateTime.Now:HH:mm:ss} | Triggering AI Service: '{modelKey}'");
                Console.WriteLine($"  -> Active Model:   {modelName}");
                Console.WriteLine($"  -> Target Server:  {endpoint}");
                if (reasoningEffort != "none")
                    Console.WriteLine($"  -> Reasoning:      {reasoningEffort}");

                return (modelName, endpoint, apiKey, reasoningEffort);
            }
            catch (Exception ex)
            {
                var defaultKey = _configuration["Nvidia:ApiKey"] ?? _configuration["Groq:ApiKey"] ?? "";
                Console.WriteLine($"\n[AI DIAGNOSTICS] Warning: Failed to resolve database AI settings (using fallback). Error: {ex.Message}");
                Console.WriteLine($"  -> Fallback Model: {DefaultModel}");
                Console.WriteLine($"  -> Fallback Server:{NvidiaEndpoint}");
                return (DefaultModel, NvidiaEndpoint, defaultKey, "none");
            }
        }

        private void SetJsonContent(HttpRequestMessage request, object requestBody)
        {
            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            request.Content = content;
        }

        private Dictionary<string, object> BuildRequestBody(
            string modelName,
            IEnumerable<object> messages,
            double temperature,
            string reasoningEffort,
            int maxTokens = 0,
            bool jsonMode = false)
        {
            var body = new Dictionary<string, object>
            {
                ["model"] = modelName,
                ["messages"] = messages,
                ["temperature"] = temperature,
                ["stream"] = false
            };

            if (maxTokens > 0)
                body["max_tokens"] = maxTokens;

            if (jsonMode)
                body["response_format"] = new { type = "json_object" };

            if (!string.IsNullOrWhiteSpace(reasoningEffort) && reasoningEffort != "none")
                body["reasoning_effort"] = reasoningEffort;

            return body;
        }

        private async Task LogErrorAsync(string operationName, string endpoint, string modelName, HttpResponseMessage response, CancellationToken cancellationToken)
        {
            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            Console.WriteLine($"\n==================================================");
            Console.WriteLine($"[LlmService ERROR - {operationName}]");
            Console.WriteLine($"Endpoint: {endpoint}");
            Console.WriteLine($"Model: {modelName}");
            Console.WriteLine($"Status: {(int)response.StatusCode} ({response.StatusCode})");
            Console.WriteLine($"Response Body: {errorContent}");
            Console.WriteLine($"==================================================\n");
        }

        public async Task<string> GenerateChatResponseAsync(
            string contextPrompt, 
            IEnumerable<SessionMessageDto> history, 
            string userMessage, 
            IEnumerable<string>? allowedEmotions,
            CancellationToken cancellationToken)
        {
            var emotionsListStr = allowedEmotions != null && allowedEmotions.Any()
                ? string.Join(", ", allowedEmotions.Select(e => $"'{e}'"))
                : null;

            var systemInstructions = $"You are a roleplay character in a language learning app called IMMERSIO.\n\n" +
                                     $"SCENARIO CONTEXT:\n{contextPrompt}\n\n" +
                                     $"INSTRUCTIONS:\n" +
                                     $"1. Stay in character at all times.\n" +
                                     $"2. Keep responses concise (1-3 sentences).\n" +
                                     $"3. Prioritize natural conversation flow.\n" +
                                     $"4. Do not break character.";

            if (emotionsListStr != null && allowedEmotions != null)
            {
                systemInstructions += $"\n5. You must choose one of the following emotions that fits your reply best: {emotionsListStr}. You MUST start your response with `[EMOTION: <emotion_name>]`. For example: `[EMOTION: {allowedEmotions.FirstOrDefault() ?? "happy"}] Hi! How can I help you today?` or similar.";
            }

            var messagesPayload = new List<object>
            {
                new { role = "system", content = systemInstructions }
            };

            foreach (var msg in history)
            {
                messagesPayload.Add(new
                {
                    role = msg.Role == "user" ? "user" : "assistant",
                    content = msg.Text
                });
            }

            // Include current user message if it's not already in history
            if (!history.Any() || history.Last().Text != userMessage || history.Last().Role != "user")
            {
                messagesPayload.Add(new { role = "user", content = userMessage });
            }

            var (modelName, endpoint, apiKey, reasoningEffort) = await GetModelConfigAsync("ModelChat", cancellationToken);

            var requestBody = BuildRequestBody(modelName, messagesPayload, 0.7, reasoningEffort, maxTokens: 1024);

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                SetJsonContent(request, requestBody);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    await LogErrorAsync("GenerateChatResponseAsync", endpoint, modelName, response, cancellationToken);
                    response.EnsureSuccessStatusCode();
                }

                var chatResponse = await response.Content.ReadFromJsonAsync<GroqChatResponse>(cancellationToken: cancellationToken);
                return chatResponse?.Choices?.FirstOrDefault()?.Message?.Content ?? "I am sorry, I couldn't understand that.";
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Failed to generate chat response: {ex.Message}");
                return "I am sorry, I am having trouble connecting to my mind right now. Please try again in a moment.";
            }
        }

        public async Task<CorrectionResultDto> AnalyzeGrammarAsync(
            string userMessage, 
            string targetLanguage, 
            CancellationToken cancellationToken)
        {
            var systemPrompt = $"You are an expert language teacher and a lenient speech-to-text grammar evaluator for language learners speaking {targetLanguage}.\n" +
                               $"Your primary task is to review the user's spoken sentence and determine if it has serious grammatical errors (e.g., incorrect tense, wrong verb conjugation, incorrect word order, or completely inappropriate word choice that distorts the meaning).\n\n" +
                               $"CRITICAL RULES:\n" +
                               $"1. STRICT LENIENCY FOR SPOKEN SPEECH: Spoken language is naturally informal and fragmented. NEVER correct minor punctuation, missing commas, periods, capitalization, or apostrophes (e.g., 'im' instead of 'I'm', or lack of question marks). These are NOT grammar errors.\n" +
                               $"2. NO OVER-CORRECTION: If the user's sentence is natural, understandable, and commonly used by native speakers in daily conversation (even if simple, colloquial, or using casual slang), you MUST mark it as correct. Do not rephrase it to sound like a formal book.\n" +
                               $"3. CORRECTION DIRECTION: If there is a genuine and serious error, correct it to be a natural spoken phrase in {targetLanguage} that preserves the user's original intent. Avoid complex or overly formal vocabulary in the correction.\n" +
                               $"4. EXPLANATION: If there is no error, the explanation MUST be exactly 'Perfect!'. If there is an error, write a short, encouraging explanation in Vietnamese (Tiếng Việt) describing the mistake clearly and how to avoid it (keep it under 2 sentences).\n" +
                               $"5. Output format: You must return a valid JSON object only, with no markdown wrappers or backticks. Example:\n" +
                               $"{{\n  \"corrected\": \"(corrected sentence if errors exist, otherwise the exact original input)\",\n  \"explanation\": \"(EXACTLY 'Perfect!' if correct, otherwise a short Vietnamese explanation of the error)\"\n}}";

            var (modelName, endpoint, apiKey, reasoningEffort) = await GetModelConfigAsync("ModelGrammar", cancellationToken);

            var requestBody = BuildRequestBody(modelName, new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userMessage }
            }, 0.2, reasoningEffort, jsonMode: true);

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                SetJsonContent(request, requestBody);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    await LogErrorAsync("AnalyzeGrammarAsync", endpoint, modelName, response, cancellationToken);
                    response.EnsureSuccessStatusCode();
                }

                var chatResponse = await response.Content.ReadFromJsonAsync<GroqChatResponse>(cancellationToken: cancellationToken);
                var contentJson = chatResponse?.Choices?.FirstOrDefault()?.Message?.Content;

                if (!string.IsNullOrWhiteSpace(contentJson))
                {
                    using var doc = JsonDocument.Parse(contentJson);
                    var root = doc.RootElement;
                    var corrected = root.TryGetProperty("corrected", out var corrProp) ? corrProp.GetString() : userMessage;
                    var explanation = root.TryGetProperty("explanation", out var expProp) ? expProp.GetString() : "Perfect!";
                    
                    return new CorrectionResultDto(corrected ?? userMessage, explanation ?? "Perfect!");
                }
            }
            catch (Exception ex)
            {
                // Fallback on network/parsing failure
                System.Diagnostics.Debug.WriteLine($"Grammar analysis failed: {ex.Message}");
            }

            return new CorrectionResultDto(userMessage, "Perfect!");
        }

        public async Task<string> GenerateSessionFeedbackAsync(
            string contextPrompt, 
            IEnumerable<SessionMessageDto> history, 
            CancellationToken cancellationToken)
        {
            var systemPrompt = "Analyze the conversation and provide encouraging feedback (2-3 paragraphs) for a language learner. Highlight strengths and areas for improvement. Speak directly to the student.";

            var historyText = string.Join("\n", history.Select(m => $"{m.Role}: {m.Text}"));
            var userPrompt = $"Context: {contextPrompt}\n\nHistory:\n{historyText}";

            var (modelName, endpoint, apiKey, reasoningEffort) = await GetModelConfigAsync("ModelFeedback", cancellationToken);

            var requestBody = BuildRequestBody(modelName, new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            }, 0.7, reasoningEffort);

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                SetJsonContent(request, requestBody);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    await LogErrorAsync("GenerateSessionFeedbackAsync", endpoint, modelName, response, cancellationToken);
                    response.EnsureSuccessStatusCode();
                }

                var chatResponse = await response.Content.ReadFromJsonAsync<GroqChatResponse>(cancellationToken: cancellationToken);
                return chatResponse?.Choices?.FirstOrDefault()?.Message?.Content ?? "Great job practicing today!";
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Failed to generate session feedback: {ex.Message}");
                return "Great job practicing today! I'm currently unable to generate detailed feedback, but keep up the good work!";
            }
        }

        public async Task<List<AddCardDto>> GenerateFlashcardsAsync(
            IEnumerable<SessionMessageDto> history,
            string targetLanguage,
            ScenarioContextDto scenario,
            CancellationToken cancellationToken)
        {
            var systemPrompt = $"You are an expert language acquisition assistant. Analyze the conversation history between the language learner (USER) and the AI character (ASSISTANT) in {targetLanguage}.\n\n" +
                               $"LESSON CONTEXT (this MUST anchor every flashcard you generate — off-topic cards are forbidden):\n" +
                               $"- Title: {scenario.Title}\n" +
                               $"- Category: {scenario.Category}\n" +
                               $"- CEFR level: {scenario.Level}\n" +
                               $"- Objective: {scenario.Description}\n" +
                               $"- Scene context: {scenario.ContextPrompt}\n\n" +
                               $"Identify between 3 and 15 flashcards that DIRECTLY support this lesson's learning goals.\n\n" +
                               $"CRITICAL RULES:\n" +
                               $"1. STAY ON TOPIC: Every flashcard must be relevant to \"{scenario.Title}\" ({scenario.Category}). Reject vocabulary, grammar or phrasing that — even if it appears in the dialog — is not useful for someone studying this specific scenario.\n" +
                               $"2. SOURCE PRIORITY (in this order):\n" +
                               $"   (a) Corrections of the USER's mistakes — highest priority.\n" +
                               $"   (b) NEW key vocabulary, collocations, or set phrases that the ASSISTANT (NPC) introduced in this scenario context — these are exactly the items the user is meant to learn by encountering them in dialog. Include them even if the user did not say them.\n" +
                               $"   (c) Useful idioms or collocations related to the scenario theme that the user could naturally use next time in this situation.\n" +
                               $"   Do NOT invent words that were not in the dialog and NOT relevant to the scenario.\n" +
                               $"3. LEVEL-APPROPRIATE: Target CEFR {scenario.Level} or one band above. Skip A1/A2 trivia (e.g., 'hello', 'yes', 'no') unless the user made a real error with them.\n" +
                               $"4. NO NITPICKY CORRECTIONS: Focus only on significant grammatical errors or unnatural phrasings. Skip pedantic minor things that would feel mechanical.\n" +
                               $"5. DYNAMIC CARD COUNT: More cards (up to 15) for longer/richer histories; minimum 3. Do not pad with filler — it is better to return 3 strong on-topic cards than 10 weak off-topic ones.\n" +
                               $"6. POLYMORPHIC JSON STRUCTURE: You must categorize every card into one of three exact types ('vocab', 'grammar', 'sentence') and output it adhering strictly to this schema:\n\n" +
                               $"   - TYPE 1: 'vocab' (For vocabulary terms the user struggled with or tried to use)\n" +
                               $"     * Schema:\n" +
                               $"       {{\n" +
                               $"         \"type\": \"vocab\",\n" +
                               $"         \"meta\": {{ \"tags\": [\"{targetLanguage.ToLower()}\", \"vocab\", \"academic\"] }},\n" +
                               $"         \"content\": {{\n" +
                               $"           \"word\": \"meticulous\",\n" +
                               $"           \"part_of_speech\": \"adj\",\n" +
                               $"           \"phonetic\": \"/məˈtɪk.jə.ləs/\",\n" +
                               $"           \"audio_url\": \"\",\n" +
                               $"           \"meaning\": \"Rất cẩn thận, tỉ mỉ, chú ý đến từng chi tiết nhỏ.\",\n" +
                               $"           \"definition_en\": \"Very careful and precise; showing great attention to detail.\",\n" +
                               $"           \"examples\": [\n" +
                               $"             {{ \"sentence\": \"Many hours of meticulous preparation have gone into writing the book.\", \"translation\": \"Nhiều giờ chuẩn bị tỉ mỉ đã được dành cho việc viết cuốn sách.\" }}\n" +
                               $"           ],\n" +
                               $"           \"synonyms\": [\"thorough\", \"scrupulous\", \"detailed\"],\n" +
                               $"           \"antonyms\": [\"careless\", \"negligent\"]\n" +
                               $"         }}\n" +
                               $"       }}\n\n" +
                               $"   - TYPE 2: 'grammar' (For sentences containing grammatical errors made by the user)\n" +
                               $"     * Schema:\n" +
                               $"       {{\n" +
                               $"         \"type\": \"grammar\",\n" +
                               $"         \"meta\": {{ \"tags\": [\"{targetLanguage.ToLower()}\", \"grammar\"] }},\n" +
                               $"         \"content\": {{\n" +
                               $"           \"title\": \"Simple Past vs Present Perfect (Thì Quá khứ đơn)\",\n" +
                               $"           \"formula\": [\n" +
                               $"             {{ \"form\": \"Khẳng định\", \"structure\": \"S + V2/ed\" }},\n" +
                               $"             {{ \"form\": \"Phủ định\", \"structure\": \"S + did + not + V_inf\" }}\n" +
                               $"           ],\n" +
                               $"           \"usage\": \"Diễn tả hành động đã xảy ra và chấm dứt hoàn toàn trong quá khứ.\",\n" +
                               $"           \"signal_words\": [\"yesterday\", \"ago\", \"last year\"],\n" +
                               $"           \"examples\": [\n" +
                               $"             {{ \"sentence\": \"I went to school yesterday.\", \"translation\": \"Tôi đã đi học ngày hôm qua.\", \"note\": \"Dùng động từ bất quy tắc 'went' thay vì 'goes'.\" }}\n" +
                               $"           ],\n" +
                               $"           \"common_mistakes\": \"Tránh nhầm lẫn với quá khứ đơn khi có mốc thời gian cụ thể (Ví dụ: KHÔNG dùng 'I have seen him yesterday').\"\n" +
                               $"         }}\n" +
                               $"       }}\n" +
                               $"       *Note: In grammar cards, the example sentence in 'content.examples' should be the corrected sentence.\"\n\n" +
                               $"   - TYPE 3: 'sentence' (For phrasings, idioms, or collocations that the user can improve or study, using Cloze deletion)\n" +
                               $"     * Schema:\n" +
                               $"       {{\n" +
                               $"         \"type\": \"sentence\",\n" +
                               $"         \"meta\": {{ \"tags\": [\"{targetLanguage.ToLower()}\", \"collocation\"] }},\n" +
                               $"         \"content\": {{\n" +
                               $"           \"full_sentence\": \"We need to take into account all the factors before making a decision.\",\n" +
                               $"           \"cloze_sentence\": \"We need to {{{{c1::take into account}}}} all the factors before making a decision.\",\n" +
                               $"           \"translation\": \"Chúng ta cần cân nhắc/tính đến tất cả các yếu tố trước khi đưa ra quyết định.\",\n" +
                               $"           \"target_phrase\": \"take into account\",\n" +
                               $"           \"phrase_meaning\": \"Cân nhắc, tính đến một yếu tố nào đó khi xem xét một tình huống.\",\n" +
                               $"           \"context_note\": \"Đồng nghĩa với 'take into consideration'.\"\n" +
                               $"         }}\n" +
                               $"       }}\n\n" +
                               $"Return a JSON object with a \"flashcards\" key containing an array of objects. Each object must strictly match one of the three structures above.\n\n" +
                               $"The output must be strictly valid JSON. Example:\n" +
                               $"{{\n  \"flashcards\": [\n    {{\n      \"type\": \"vocab\",\n      \"meta\": {{ \"tags\": [\"english\", \"vocab\"] }},\n      \"content\": {{\n        \"word\": \"meticulous\",\n        \"part_of_speech\": \"adj\",\n        \"phonetic\": \"/məˈtɪk.jə.ləs/\",\n        \"audio_url\": \"\",\n        \"meaning\": \"Rất cẩn thận, tỉ mỉ, chú ý đến từng chi tiết nhỏ.\",\n        \"definition_en\": \"Very careful and precise; showing great attention to detail.\",\n        \"examples\": [\n          {{ \"sentence\": \"Many hours of meticulous preparation have gone into writing the book.\", \"translation\": \"Nhiều giờ chuẩn bị tỉ mỉ đã được dành cho việc viết cuốn sách.\" }}\n        ],\n        \"synonyms\": [\"thorough\", \"scrupulous\"],\n        \"antonyms\": [\"careless\"]\n      }}\n    }}\n  ]\n}}";

            var historyText = string.Join("\n", history.Select(m => $"{m.Role}: {m.Text}"));

            var (modelName, endpoint, apiKey, reasoningEffort) = await GetModelConfigAsync("ModelFlashcard", cancellationToken);

            var requestBody = BuildRequestBody(modelName, new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = historyText }
            }, 0.2, reasoningEffort, jsonMode: true);

            var flashcards = new List<AddCardDto>();

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                SetJsonContent(request, requestBody);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    await LogErrorAsync("GenerateFlashcardsAsync", endpoint, modelName, response, cancellationToken);
                    response.EnsureSuccessStatusCode();
                }

                var chatResponse = await response.Content.ReadFromJsonAsync<GroqChatResponse>(cancellationToken: cancellationToken);
                var contentJson = chatResponse?.Choices?.FirstOrDefault()?.Message?.Content;

                if (!string.IsNullOrWhiteSpace(contentJson))
                {
                    contentJson = CleanJsonContent(contentJson);
                    using var doc = JsonDocument.Parse(contentJson);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("flashcards", out var listProp) && listProp.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in listProp.EnumerateArray())
                        {
                            var type = item.TryGetProperty("type", out var ty) ? ty.GetString() : "vocab";

                            string front = "";
                            string back = "";
                            string explanation = "";
                            string tag = type;

                            if (item.TryGetProperty("content", out var contentProp))
                            {
                                if (type == "vocab")
                                {
                                    var word = contentProp.TryGetProperty("word", out var w) ? w.GetString() : "";
                                    var meaning = contentProp.TryGetProperty("meaning", out var m) ? m.GetString() : "";
                                    front = word ?? "";
                                    back = meaning ?? "";

                                    var def = contentProp.TryGetProperty("definition_en", out var d) ? d.GetString() : "";
                                    explanation = $"Definition: {def}\nWord: {word}";
                                }
                                else if (type == "grammar")
                                {
                                    var title = contentProp.TryGetProperty("title", out var t) ? t.GetString() : "";
                                    var usage = contentProp.TryGetProperty("usage", out var u) ? u.GetString() : "";
                                    front = title ?? "";
                                    back = usage ?? "";
                                    explanation = $"Usage: {usage}";
                                }
                                else if (type == "sentence")
                                {
                                    var translation = contentProp.TryGetProperty("translation", out var tr) ? tr.GetString() : "";
                                    var full = contentProp.TryGetProperty("full_sentence", out var f) ? f.GetString() : "";
                                    front = full ?? "";
                                    back = translation ?? "";
                                    explanation = $"Sentence: {full}";
                                }
                            }

                            // Fallbacks so a card is never built from raw JSON.
                            if (string.IsNullOrWhiteSpace(front))
                            {
                                front = string.IsNullOrWhiteSpace(back) ? "Review" : back;
                            }
                            if (string.IsNullOrWhiteSpace(back))
                            {
                                back = "Review";
                            }

                            if (!string.IsNullOrWhiteSpace(front))
                            {
                                flashcards.Add(new AddCardDto(front, back, explanation, tag));
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Flashcard extraction failed: {ex.Message}");
            }

            return flashcards;
        }

        public async Task<List<AddCardDto>> GenerateCustomFlashcardsAsync(
            IEnumerable<SessionMessageDto> history,
            string targetLanguage,
            List<string> options,
            ScenarioContextDto scenario,
            CancellationToken cancellationToken)
        {
            var optionsCsv = string.Join(", ", options);
            var systemPrompt = $"You are an expert language acquisition assistant. Analyze the conversation history between the language learner (USER) and the AI character (ASSISTANT) in {targetLanguage}.\n\n" +
                               $"LESSON CONTEXT (must anchor every card; off-topic cards are forbidden):\n" +
                               $"- Title: {scenario.Title}\n" +
                               $"- Category: {scenario.Category}\n" +
                               $"- CEFR level: {scenario.Level}\n" +
                               $"- Objective: {scenario.Description}\n" +
                               $"- Scene context: {scenario.ContextPrompt}\n\n" +
                               $"Generate flashcards covering ONLY these selected categories: [{optionsCsv}], anchored to this scenario.\n\n" +
                               $"CRITICAL RULES:\n" +
                               $"1. STAY ON TOPIC: Every flashcard must be relevant to \"{scenario.Title}\" ({scenario.Category}). Skip dialog material that is off-topic for this scenario.\n" +
                               $"2. SOURCE PRIORITY (in this order): (a) corrections of USER mistakes; (b) NEW key vocabulary, collocations, or set phrases the ASSISTANT (NPC) introduced in this scenario context — include them even if the user did not say them, since they are exactly what the user is meant to learn by encountering them; (c) idioms/collocations the user could naturally use next time in this situation. Do NOT invent items that were absent from the dialog and not relevant to the scenario.\n" +
                               $"3. LEVEL-APPROPRIATE: Target CEFR {scenario.Level} or one band above. Skip trivial A1/A2 items (e.g., 'hello', 'yes', 'no') unless the user made a real error with them.\n" +
                               $"4. NO NITPICKY CORRECTIONS: Focus only on significant grammatical errors or unnatural phrasings. Skip pedantic minor issues that feel mechanical.\n" +
                               $"5. CATEGORY COMPLIANCE & POLYMORPHIC JSON STRUCTURE: You must categorize every card into one of three exact types ('vocab', 'grammar', 'sentence') and output it adhering strictly to this schema, depending on the requested categories:\n\n" +
                               $"   - If 'grammar' is selected, generate 'grammar' cards (For sentences containing grammatical errors made by the user):\n" +
                               $"     * Schema:\n" +
                               $"       {{\n" +
                               $"         \"type\": \"grammar\",\n" +
                               $"         \"meta\": {{ \"tags\": [\"{targetLanguage.ToLower()}\", \"grammar\"] }},\n" +
                               $"         \"content\": {{\n" +
                               $"           \"title\": \"Simple Past vs Present Perfect (Thì Quá khứ đơn)\",\n" +
                               $"           \"formula\": [\n" +
                               $"             {{ \"form\": \"Khẳng định\", \"structure\": \"S + V2/ed\" }},\n" +
                               $"             {{ \"form\": \"Phủ định\", \"structure\": \"S + did + not + V_inf\" }}\n" +
                               $"           ],\n" +
                               $"           \"usage\": \"Diễn tả hành động đã xảy ra và chấm dứt hoàn toàn trong quá khứ.\",\n" +
                               $"           \"signal_words\": [\"yesterday\", \"ago\", \"last year\"],\n" +
                               $"           \"examples\": [\n" +
                               $"             {{ \"sentence\": \"I went to school yesterday.\", \"translation\": \"Tôi đã đi học ngày hôm qua.\", \"note\": \"Dùng động từ bất quy tắc 'went' thay vì 'goes'.\" }}\n" +
                               $"           ],\n" +
                               $"           \"common_mistakes\": \"Tránh nhầm lẫn với quá khứ đơn khi có mốc thời gian cụ thể (Ví dụ: KHÔNG dùng 'I have seen him yesterday').\"\n" +
                               $"         }}\n" +
                               $"       }}\n\n" +
                               $"   - If 'vocabulary' is selected, generate 'vocab' cards (For vocabulary terms the user struggled with or tried to use):\n" +
                               $"     * Schema:\n" +
                               $"       {{\n" +
                               $"         \"type\": \"vocab\",\n" +
                               $"         \"meta\": {{ \"tags\": [\"{targetLanguage.ToLower()}\", \"vocab\", \"academic\"] }},\n" +
                               $"         \"content\": {{\n" +
                               $"           \"word\": \"meticulous\",\n" +
                               $"           \"part_of_speech\": \"adj\",\n" +
                               $"           \"phonetic\": \"/məˈtɪk.jə.ləs/\",\n" +
                               $"           \"audio_url\": \"\",\n" +
                               $"           \"meaning\": \"Rất cẩn thận, tỉ mỉ, chú ý đến từng chi tiết nhỏ.\",\n" +
                               $"           \"definition_en\": \"Very careful and precise; showing great attention to detail.\",\n" +
                               $"           \"examples\": [\n" +
                               $"             {{ \"sentence\": \"Many hours of meticulous preparation have gone into writing the book.\", \"translation\": \"Nhiều giờ chuẩn bị tỉ mỉ đã được dành cho việc viết cuốn sách.\" }}\n" +
                               $"           ],\n" +
                               $"           \"synonyms\": [\"thorough\", \"scrupulous\", \"detailed\"],\n" +
                               $"           \"antonyms\": [\"careless\", \"negligent\"]\n" +
                               $"         }}\n" +
                               $"       }}\n\n" +
                               $"   - If 'improvement' is selected, generate 'sentence' cards (For phrasings, idioms, or collocations that the user can improve or study, using Cloze deletion):\n" +
                               $"     * Schema:\n" +
                               $"       {{\n" +
                               $"         \"type\": \"sentence\",\n" +
                               $"         \"meta\": {{ \"tags\": [\"{targetLanguage.ToLower()}\", \"collocation\"] }},\n" +
                               $"         \"content\": {{\n" +
                               $"           \"full_sentence\": \"We need to take into account all the factors before making a decision.\",\n" +
                               $"           \"cloze_sentence\": \"We need to {{{{c1::take into account}}}} all the factors before making a decision.\",\n" +
                               $"           \"translation\": \"Chúng ta cần cân nhắc/tính đến tất cả các yếu tố trước khi đưa ra quyết định.\",\n" +
                               $"           \"target_phrase\": \"take into account\",\n" +
                               $"           \"phrase_meaning\": \"Cân nhắc, tính đến một yếu tố nào đó khi xem xét một tình huống.\",\n" +
                               $"           \"context_note\": \"Đồng nghĩa với 'take into consideration'.\"\n" +
                               $"         }}\n" +
                               $"       }}\n\n" +
                               $"6. NO TRIVIAL CARDS: Do not include basic words (e.g., 'hello', 'yes', 'no', 'good') unless they were corrected.\n" +
                               $"7. DYNAMIC CARD COUNT: Generate 3 to 15 cards. Quality over quantity — better to return 3 strong on-topic cards than 10 weak off-topic ones.\n\n" +
                               $"Return a JSON object with a \"flashcards\" key containing an array of objects. Each object must strictly match one of the three structures above.\n\n" +
                               $"The output must be strictly valid JSON.";

            var historyText = string.Join("\n", history.Select(m => $"{m.Role}: {m.Text}"));

            var (modelName, endpoint, apiKey, reasoningEffort) = await GetModelConfigAsync("ModelFlashcard", cancellationToken);

            var requestBody = BuildRequestBody(modelName, new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = historyText }
            }, 0.2, reasoningEffort, jsonMode: true);

            var flashcards = new List<AddCardDto>();

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                SetJsonContent(request, requestBody);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    await LogErrorAsync("GenerateCustomFlashcardsAsync", endpoint, modelName, response, cancellationToken);
                    response.EnsureSuccessStatusCode();
                }

                var chatResponse = await response.Content.ReadFromJsonAsync<GroqChatResponse>(cancellationToken: cancellationToken);
                var contentJson = chatResponse?.Choices?.FirstOrDefault()?.Message?.Content;

                if (!string.IsNullOrWhiteSpace(contentJson))
                {
                    contentJson = CleanJsonContent(contentJson);
                    using var doc = JsonDocument.Parse(contentJson);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("flashcards", out var listProp) && listProp.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in listProp.EnumerateArray())
                        {
                            var type = item.TryGetProperty("type", out var ty) ? ty.GetString() : "vocab";

                            string front = "";
                            string back = "";
                            string explanation = "";
                            string tag = type;

                            if (item.TryGetProperty("content", out var contentProp))
                            {
                                if (type == "vocab")
                                {
                                    var word = contentProp.TryGetProperty("word", out var w) ? w.GetString() : "";
                                    var meaning = contentProp.TryGetProperty("meaning", out var m) ? m.GetString() : "";
                                    front = word ?? "";
                                    back = meaning ?? "";

                                    var def = contentProp.TryGetProperty("definition_en", out var d) ? d.GetString() : "";
                                    explanation = $"Definition: {def}\nWord: {word}";
                                }
                                else if (type == "grammar")
                                {
                                    var title = contentProp.TryGetProperty("title", out var t) ? t.GetString() : "";
                                    var usage = contentProp.TryGetProperty("usage", out var u) ? u.GetString() : "";
                                    front = title ?? "";
                                    back = usage ?? "";
                                    explanation = $"Usage: {usage}";
                                }
                                else if (type == "sentence")
                                {
                                    var translation = contentProp.TryGetProperty("translation", out var tr) ? tr.GetString() : "";
                                    var full = contentProp.TryGetProperty("full_sentence", out var f) ? f.GetString() : "";
                                    front = full ?? "";
                                    back = translation ?? "";
                                    explanation = $"Sentence: {full}";
                                }
                            }

                            // Fallbacks so a card is never built from raw JSON.
                            if (string.IsNullOrWhiteSpace(front))
                            {
                                front = string.IsNullOrWhiteSpace(back) ? "Review" : back;
                            }
                            if (string.IsNullOrWhiteSpace(back))
                            {
                                back = "Review";
                            }

                            if (!string.IsNullOrWhiteSpace(front))
                            {
                                flashcards.Add(new AddCardDto(front, back, explanation, tag));
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Flashcard extraction failed: {ex.Message}");
            }

            return flashcards;
        }

        public async Task<AiCefrFeedbackDto> GenerateCefrFeedbackAsync(
            string currentLevel,
            int overallScore,
            List<string> completedScenarios,
            List<int> recentSpeechScores,
            int activeWordsCount,
            CancellationToken cancellationToken)
        {
            var completedScenariosCsv = completedScenarios.Any() 
                ? string.Join(", ", completedScenarios) 
                : "None";
            var speechScoresCsv = recentSpeechScores.Any() 
                ? string.Join(", ", recentSpeechScores.Select(s => $"{s}%")) 
                : "None";

            var systemPrompt = "You are a professional, premium CEFR language assessment advisor.\n" +
                               "Your task is to analyze the learner's study data and provide a highly personalized, encouraging CEFR evaluation report.\n\n" +
                               "Return a JSON object containing:\n" +
                               "- \"statusMessage\": A professional one-sentence diagnostic overview of their current language level and conversational fluency (in Vietnamese or mixed English/Vietnamese like 'Upper Intermediate - ...').\n" +
                               "- \"suggestions\": A list of exactly 3 or 4 personalized suggestions/bullet points in Tiếng Việt. The bullet points MUST follow this exact structure:\n" +
                               "  1. **Điểm mạnh**: [Analysis of their strengths, e.g. stable pronunciation at 85%+ or brave scenario attempts]\n" +
                               "  2. **Điểm cần cải thiện**: [Analysis of pronunciation fluctuations or grammar complexity needed]\n" +
                               "  3. **Hành động tiếp theo**: [Concrete learning recommendation, e.g. practice advanced scenarios or speak louder]\n\n" +
                               "The output MUST be strictly valid JSON. Example:\n" +
                               "{\n" +
                               "  \"statusMessage\": \"Upper Intermediate - Khả năng phản xạ hội thoại tự nhiên và phát âm có độ chuẩn xác ổn định.\",\n" +
                               "  \"suggestions\": [\n" +
                               "    \"**Điểm mạnh**: Bạn phát âm rất rõ ràng và chuẩn xác trong các bài Vocal Lab (đạt trung bình trên 80%).\",\n" +
                               "    \"**Điểm cần cải thiện**: Nên thử sức thêm ở các scenario có độ phức tạp cao hơn (C1/C2) để mở rộng cấu trúc câu.\",\n" +
                               "    \"**Hành động tiếp theo**: Hãy luyện nói tối thiểu 3 bài nói tự do khác nhau để tăng cường vốn từ vựng chủ động.\"\n" +
                               "  ]\n" +
                               "}";

            var userPrompt = $"Student Current CEFR Level: {currentLevel}\n" +
                             $"Overall Score (out of 100): {overallScore}\n" +
                             $"Completed Scenarios: [{completedScenariosCsv}]\n" +
                             $"Recent Pronunciation Scores: [{speechScoresCsv}]\n" +
                             $"Active Vocabulary Count: {activeWordsCount} words\n";

            var (modelName, endpoint, apiKey, reasoningEffort) = await GetModelConfigAsync("ModelFeedback", cancellationToken);

            var requestBody = BuildRequestBody(modelName, new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            }, 0.2, reasoningEffort, jsonMode: true);

            var defaultSuggestions = new List<string>
            {
                "**Điểm mạnh**: Bạn đang có tiến trình học tập rất tốt, hãy duy trì nhịp độ này nhé!",
                "**Điểm cần cải thiện**: Chú ý thực hành đều đặn cả phần phát âm và hội thoại để nâng cao phản xạ.",
                "**Hành động tiếp theo**: Luyện tập tối thiểu 1 scenario hội thoại mới và luyện phát âm thêm 5 câu mỗi ngày."
            };
            var defaultStatus = $"{currentLevel} - Khởi đầu rất tốt, hãy duy trì để nâng cao khả năng giao tiếp.";

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                SetJsonContent(request, requestBody);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    await LogErrorAsync("GenerateCefrFeedbackAsync", endpoint, modelName, response, cancellationToken);
                    response.EnsureSuccessStatusCode();
                }

                var chatResponse = await response.Content.ReadFromJsonAsync<GroqChatResponse>(cancellationToken: cancellationToken);
                var contentJson = chatResponse?.Choices?.FirstOrDefault()?.Message?.Content;

                if (!string.IsNullOrWhiteSpace(contentJson))
                {
                    using var doc = JsonDocument.Parse(contentJson);
                    var root = doc.RootElement;
                    var status = root.TryGetProperty("statusMessage", out var statusProp) ? statusProp.GetString() : defaultStatus;
                    
                    var suggestionsList = new List<string>();
                    if (root.TryGetProperty("suggestions", out var sugProp) && sugProp.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in sugProp.EnumerateArray())
                        {
                            var sugText = item.GetString();
                            if (!string.IsNullOrWhiteSpace(sugText))
                            {
                                suggestionsList.Add(sugText);
                            }
                        }
                    }

                    if (suggestionsList.Any())
                    {
                        return new AiCefrFeedbackDto(status ?? defaultStatus, suggestionsList);
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"AI CEFR diagnostic analysis failed: {ex.Message}");
            }

            return new AiCefrFeedbackDto(defaultStatus, defaultSuggestions);
        }

        public async Task<string> TranscribeAudioAsync(
            byte[] audioBytes,
            string filename,
            CancellationToken cancellationToken)
        {
            const string GroqAudioEndpoint = "https://api.groq.com/openai/v1/audio/transcriptions";

            using var form = new MultipartFormDataContent();
            
            // Add file content
            var fileContent = new ByteArrayContent(audioBytes);
            var contentType = filename.EndsWith(".webm") ? "audio/webm" 
                            : filename.EndsWith(".wav") ? "audio/wav" 
                            : "application/octet-stream";
            fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
            form.Add(fileContent, "file", filename);

            // Add model parameter
            form.Add(new StringContent("whisper-large-v3"), "model");
            form.Add(new StringContent("en"), "language");

            var (_, _, apiKey, _) = await GetModelConfigAsync("ModelChat", cancellationToken);

            var request = new HttpRequestMessage(HttpMethod.Post, GroqAudioEndpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = form;

            try
            {
                var response = await _httpClient.SendAsync(request, cancellationToken);
                response.EnsureSuccessStatusCode();

                var jsonResult = await response.Content.ReadFromJsonAsync<GroqTranscriptionResponse>(cancellationToken: cancellationToken);
                return jsonResult?.Text ?? string.Empty;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Groq Audio Transcription failed: {ex.Message}");
                throw;
            }
        }

        public async Task<GeneratedPhraseDto> GeneratePronunciationPhraseAsync(
            string language,
            string level,
            string topic,
            CancellationToken cancellationToken)
        {
            var systemPrompt = $"You are a language teacher creating pronunciation speaking exercises for a language learner.\n" +
                               $"Create a single natural and interesting phrase in {language} for a learner at the {level} difficulty level, focused on the topic/context of '{topic}'.\n\n" +
                               $"INSTRUCTIONS:\n" +
                               $"- The phrase must be completely in {language}.\n" +
                               $"- It should be natural and common in conversations.\n" +
                               $"- The length should match the level: Beginner (1 short simple sentence), Intermediate (1-2 sentences), Advanced (2 sentences or a slightly complex/idiomatic expression).\n" +
                               $"- Provide the meaning/translation in Tiếng Việt.\n" +
                               $"- Provide a brief grammatical or cultural explanation or vocabulary tip in Tiếng Việt.\n\n" +
                               $"Return a JSON object with strictly these keys:\n" +
                               $"- \"phrase\": The generated phrase in {language}.\n" +
                               $"- \"translation\": The Vietnamese translation.\n" +
                               $"- \"explanation\": The brief tip/note in Vietnamese.\n\n" +
                               $"The output must be strictly valid JSON. Example:\n" +
                               $"{{\n  \"phrase\": \"I'd like to reserve a table for two, please.\",\n  \"translation\": \"Tôi muốn đặt trước một bàn cho hai người.\",\n  \"explanation\": \"Sử dụng 'I'd like to' là cách lịch sự để đưa ra yêu cầu.\"\n}}";

            var (modelName, endpoint, apiKey, reasoningEffort) = await GetModelConfigAsync("ModelPhrase", cancellationToken);

            var requestBody = BuildRequestBody(modelName, new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = $"Generate a phrase for {language} ({level}) about '{topic}'" }
            }, 0.8, reasoningEffort, jsonMode: true);

            var defaultPhrase = language.ToLower().Contains("ja") ? "こんにちは、元気ですか？"
                             : language.ToLower().Contains("zh") ? "你好，你怎么样？"
                             : "The quick brown fox jumps over the lazy dog.";
            var defaultTranslation = language.ToLower().Contains("ja") ? "Xin chào, bạn khỏe không?"
                                  : language.ToLower().Contains("zh") ? "Xin chào, bạn thế nào?"
                                  : "Chú cáo nâu nhanh nhẹn nhảy qua con chó lười biếng.";
            var defaultExplanation = "Một câu nói thông dụng.";

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                SetJsonContent(request, requestBody);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    await LogErrorAsync("GeneratePronunciationPhraseAsync", endpoint, modelName, response, cancellationToken);
                    response.EnsureSuccessStatusCode();
                }

                var chatResponse = await response.Content.ReadFromJsonAsync<GroqChatResponse>(cancellationToken: cancellationToken);
                var contentJson = chatResponse?.Choices?.FirstOrDefault()?.Message?.Content;

                if (!string.IsNullOrWhiteSpace(contentJson))
                {
                    using var doc = JsonDocument.Parse(contentJson);
                    var root = doc.RootElement;
                    var phrase = root.TryGetProperty("phrase", out var p) ? p.GetString() : defaultPhrase;
                    var translation = root.TryGetProperty("translation", out var t) ? t.GetString() : defaultTranslation;
                    var explanation = root.TryGetProperty("explanation", out var e) ? e.GetString() : defaultExplanation;

                    return new GeneratedPhraseDto(phrase ?? defaultPhrase, translation ?? defaultTranslation, explanation ?? defaultExplanation);
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Failed to generate pronunciation phrase: {ex.Message}");
            }

            return new GeneratedPhraseDto(defaultPhrase, defaultTranslation, defaultExplanation);
        }

        public async Task<DictionaryEntryDto> LookupWordAsync(
            string word,
            string targetLanguage,
            CancellationToken cancellationToken)
        {
            var systemPrompt = $"You are an advanced bilingual dictionary service for language learners. " +
                               $"Provide a highly detailed and accurate dictionary entry for the queried word/phrase in the target language '{targetLanguage}'.\n\n" +
                               $"INSTRUCTIONS:\n" +
                               $"- The output must be strictly in Vietnamese (Tiếng Việt) for the translation and example translation, and English for the definition.\n" +
                               $"- Provide the international phonetic alphabet (IPA) representation for the phonetic property.\n" +
                               $"- Choose the most common part of speech and definition for the word/phrase.\n" +
                               $"- Provide a high-quality example sentence in '{targetLanguage}' demonstrating its typical conversational usage, followed by its Vietnamese translation.\n\n" +
                               $"Return a JSON object with strictly these keys:\n" +
                               $"- \"word\": The exact word/phrase queried.\n" +
                               $"- \"translation\": The standard Vietnamese translation/meaning of the word/phrase.\n" +
                               $"- \"phonetic\": The international phonetic alphabet (IPA) representation (e.g. /haʊ/, /kəˈmit/).\n" +
                               $"- \"partOfSpeech\": The part of speech (e.g. noun, verb, adjective, adverb, phrase, idiom).\n" +
                               $"- \"definition\": A clear, concise English definition of the word/phrase.\n" +
                               $"- \"example\": A natural, common example sentence using the word in {targetLanguage}.\n" +
                               $"- \"exampleTranslation\": The Vietnamese translation of the example sentence.\n\n" +
                               $"The output must be strictly valid JSON. Example:\n" +
                               $"{{\n  \"word\": \"accomplish\",\n  \"translation\": \"hoàn thành, đạt được\",\n  \"phonetic\": \"/əˈkʌm.plɪʃ/\",\n  \"partOfSpeech\": \"verb\",\n  \"definition\": \"To succeed in doing something, especially after a lot of effort.\",\n  \"example\": \"We can accomplish anything if we work together.\",\n  \"exampleTranslation\": \"Chúng ta có thể đạt được bất cứ điều gì nếu làm việc cùng nhau.\"\n}}";

            var (modelName, endpoint, apiKey, reasoningEffort) = await GetModelConfigAsync("ModelChat", cancellationToken);

            var requestBody = BuildRequestBody(modelName, new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = $"Lookup details for the word/phrase: {word}" }
            }, 0.3, reasoningEffort, jsonMode: true);

            var defaultPhonetic = "/.../";
            var defaultTranslation = "Nghĩa của từ.";
            var defaultPartOfSpeech = "noun";
            var defaultDefinition = "Definition of the word.";
            var defaultExample = "An example sentence.";
            var defaultExampleTranslation = "Câu ví dụ.";

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                SetJsonContent(request, requestBody);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    await LogErrorAsync("LookupWordAsync", endpoint, modelName, response, cancellationToken);
                    response.EnsureSuccessStatusCode();
                }

                var chatResponse = await response.Content.ReadFromJsonAsync<GroqChatResponse>(cancellationToken: cancellationToken);
                var contentJson = chatResponse?.Choices?.FirstOrDefault()?.Message?.Content;

                if (!string.IsNullOrWhiteSpace(contentJson))
                {
                    using var doc = JsonDocument.Parse(contentJson);
                    var root = doc.RootElement;
                    
                    var trans = root.TryGetProperty("translation", out var t) ? t.GetString() : defaultTranslation;
                    var phone = root.TryGetProperty("phonetic", out var p) ? p.GetString() : defaultPhonetic;
                    var pos = root.TryGetProperty("partOfSpeech", out var ps) ? ps.GetString() : defaultPartOfSpeech;
                    var def = root.TryGetProperty("definition", out var d) ? d.GetString() : defaultDefinition;
                    var ex = root.TryGetProperty("example", out var e) ? e.GetString() : defaultExample;
                    var exTrans = root.TryGetProperty("exampleTranslation", out var et) ? et.GetString() : defaultExampleTranslation;

                    return new DictionaryEntryDto(
                        Word: word,
                        Translation: trans ?? defaultTranslation,
                        Phonetic: phone ?? defaultPhonetic,
                        PartOfSpeech: pos ?? defaultPartOfSpeech,
                        Definition: def ?? defaultDefinition,
                        Example: ex ?? defaultExample,
                        ExampleTranslation: exTrans ?? defaultExampleTranslation
                    );
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Failed to lookup dictionary entry: {ex.Message}");
            }

            return new DictionaryEntryDto(
                Word: word,
                Translation: defaultTranslation,
                Phonetic: defaultPhonetic,
                PartOfSpeech: defaultPartOfSpeech,
                Definition: defaultDefinition,
                Example: defaultExample,
                ExampleTranslation: defaultExampleTranslation
            );
        }

        private static string CleanJsonContent(string content)
        {
            if (string.IsNullOrWhiteSpace(content)) return content;
            content = content.Trim();
            if (content.StartsWith("```"))
            {
                var lines = content.Split('\n');
                var cleanLines = lines.Where(l => !l.Trim().StartsWith("```")).ToArray();
                content = string.Join("\n", cleanLines).Trim();
            }
            return content;
        }
    }

    // Helper classes for standard OpenAI / Groq JSON serialization
    public class GroqChatResponse
    {
        [JsonPropertyName("choices")]
        public List<GroqChoice>? Choices { get; set; }
    }

    public class GroqChoice
    {
        [JsonPropertyName("message")]
        public GroqMessage? Message { get; set; }
    }

    public class GroqMessage
    {
        [JsonPropertyName("role")]
        public string? Role { get; set; }

        [JsonPropertyName("content")]
        public string? Content { get; set; }
    }

    public class GroqTranscriptionResponse
    {
        [JsonPropertyName("text")]
        public string? Text { get; set; }
    }
}
