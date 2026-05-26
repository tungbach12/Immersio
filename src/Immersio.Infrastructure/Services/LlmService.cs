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
        private readonly string _apiKey;
        private readonly IApplicationDbContext _context;
        private const string GroqEndpoint = "https://api.groq.com/openai/v1/chat/completions";
        private const string DefaultModel = "llama-3.3-70b-versatile";

        public LlmService(HttpClient httpClient, IConfiguration configuration, IApplicationDbContext context)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Groq:ApiKey"] ?? throw new ArgumentNullException("Groq API key is not configured.");
            _context = context;
        }

        private async Task<(string ModelName, string Endpoint, string ApiKey)> GetModelConfigAsync(string modelKey, CancellationToken cancellationToken)
        {
            try
            {
                var modelSetting = await _context.SystemSettings
                    .FirstOrDefaultAsync(s => s.Key == modelKey, cancellationToken);
                var endpointSetting = await _context.SystemSettings
                    .FirstOrDefaultAsync(s => s.Key == "LlmEndpoint", cancellationToken);
                var apiKeySetting = await _context.SystemSettings
                    .FirstOrDefaultAsync(s => s.Key == "LlmApiKey", cancellationToken);

                var modelName = !string.IsNullOrWhiteSpace(modelSetting?.Value) ? modelSetting.Value : DefaultModel;
                var endpoint = !string.IsNullOrWhiteSpace(endpointSetting?.Value) ? endpointSetting.Value : GroqEndpoint;
                var apiKey = !string.IsNullOrWhiteSpace(apiKeySetting?.Value) ? apiKeySetting.Value : _apiKey;

                return (modelName, endpoint, apiKey);
            }
            catch
            {
                return (DefaultModel, GroqEndpoint, _apiKey);
            }
        }

        private void SetJsonContent(HttpRequestMessage request, object requestBody)
        {
            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            request.Content = content;
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
            CancellationToken cancellationToken)
        {
            var systemInstructions = $"You are a roleplay character in a language learning app called IMMERSIO.\n\n" +
                                     $"SCENARIO CONTEXT:\n{contextPrompt}\n\n" +
                                     $"INSTRUCTIONS:\n" +
                                     $"1. Stay in character at all times.\n" +
                                     $"2. Keep responses concise (1-3 sentences).\n" +
                                     $"3. Prioritize natural conversation flow.\n" +
                                     $"4. Do not break character.";

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

            var (modelName, endpoint, apiKey) = await GetModelConfigAsync("ModelChat", cancellationToken);

            var requestBody = new
            {
                model = modelName,
                messages = messagesPayload,
                temperature = 0.7,
                max_tokens = 1024,
                stream = false
            };

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

            var (modelName, endpoint, apiKey) = await GetModelConfigAsync("ModelGrammar", cancellationToken);

            var requestBody = new
            {
                model = modelName,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userMessage }
                },
                temperature = 0.2,
                response_format = new { type = "json_object" },
                stream = false
            };

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

            var (modelName, endpoint, apiKey) = await GetModelConfigAsync("ModelFeedback", cancellationToken);

            var requestBody = new
            {
                model = modelName,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userPrompt }
                },
                temperature = 0.7,
                stream = false
            };

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

        public async Task<List<AddCardDto>> GenerateFlashcardsAsync(
            IEnumerable<SessionMessageDto> history, 
            string targetLanguage, 
            CancellationToken cancellationToken)
        {
            var systemPrompt = $"You are an expert language acquisition assistant. Analyze the conversation history between the language learner (USER) and the AI (ASSISTANT) in {targetLanguage}.\n" +
                               $"Identify 3 to 5 key vocabulary terms, grammar corrections, or useful idioms that the student struggled with, made mistakes on, or could benefit from reviewing based EXCLUSIVELY on the USER's turns and the corrections provided to them.\n\n" +
                               $"CRITICAL RULES:\n" +
                               $"1. SOURCE RESTRICTION: Every single flashcard must be directly derived from the actual words, phrases, or errors that occurred in the USER's dialog turns. DO NOT generate random vocabulary or make up unrelated words that were never in the conversation.\n" +
                               $"2. NO TRIVIAL CARDS: Do not create flashcards for extremely basic words (e.g., 'hello', 'yes', 'no', 'thank you', 'good', 'bye', 'I', 'you') unless the user specifically made a major error with them.\n" +
                               $"3. HIGH MEMORY RETRIEVAL FORMAT:\n" +
                               $"   - For vocabulary terms: \n" +
                               $"     * 'front': The target word/phrase with its IPA phonetic guide and context tag, followed by a fill-in-the-blank sentence where the word is replaced by a blank line (e.g. \"accomplish /əˈkʌm.plɪʃ/ [verb • Scenario Context]\\nWe can _______ anything if we work together. (Điền vào chỗ trống)\").\n" +
                               $"     * 'back': The precise translation or meaning in Vietnamese (Tiếng Việt).\n" +
                               $"     * 'explanation': A helpful definition in English, followed by the complete example sentence, its translation in Vietnamese, and synonyms (e.g. \"Definition: To succeed in doing something...\\n\\nExample: 'We can accomplish anything...'\\nTranslation: 'Chúng ta có thể...'\\n\\nSynonyms: achieve, fulfill\").\n" +
                               $"   - For grammar corrections: \n" +
                               $"     * 'front': The sentence containing the user's highlighted error (e.g. \"I *goes* to school yesterday. ❌ (Sửa lỗi sai) [Simple Past]\").\n" +
                               $"     * 'back': The corrected sentence in the target language (e.g. \"I went to school yesterday. (Corrected)\").\n" +
                               $"     * 'explanation': A clear, encouraging grammatical rule in Vietnamese explaining the mistake, the corrected form, and a short rule formula (e.g. \"Giải thích: Trạng từ 'yesterday' yêu cầu quá khứ đơn...\\n\\nCông thức: S + V2/ed\").\n" +
                               $"   - For natural improvements:\n" +
                               $"     * 'front': The flat/awkward sentence that the user said, marked with a warning sign (e.g. \"I want a cup of coffee. ⚠️ (Nói tự nhiên hơn?) [Polite Register]\").\n" +
                               $"     * 'back': The natural, native-level formulation in the target language (e.g. \"Could I get a cup of coffee, please? [Polite]\").\n" +
                               $"     * 'explanation': The Vietnamese translation of the user's intent, plus a short Vietnamese nuance note explaining why the native formulation is more appropriate or polite.\n\n" +
                               $"Return a JSON object with a \"flashcards\" key containing an array of objects. Each object must have \"front\", \"back\", and \"explanation\" keys.\n\n" +
                               $"The output must be strictly valid JSON. Example:\n" +
                               $"{{\n  \"flashcards\": [\n    {{\n      \"front\": \"accomplish /əˈkʌm.plɪʃ/ [verb]\\nWe can _______ anything if we work together. (Điền vào chỗ trống)\",\n      \"back\": \"hoàn thành, đạt được\",\n      \"explanation\": \"Definition: To succeed in doing something.\\n\\nExample: 'We can accomplish...'\\nTranslation: 'Chúng ta có thể...'\\n\\nSynonyms: achieve\"\n    }}\n  ]\n}}";

            var historyText = string.Join("\n", history.Select(m => $"{m.Role}: {m.Text}"));

            var (modelName, endpoint, apiKey) = await GetModelConfigAsync("ModelFlashcard", cancellationToken);

            var requestBody = new
            {
                model = modelName,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = historyText }
                },
                temperature = 0.5,
                response_format = new { type = "json_object" },
                stream = false
            };

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
                    using var doc = JsonDocument.Parse(contentJson);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("flashcards", out var listProp) && listProp.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in listProp.EnumerateArray())
                        {
                            var front = item.TryGetProperty("front", out var f) ? f.GetString() : null;
                            var back = item.TryGetProperty("back", out var b) ? b.GetString() : null;
                            var explanation = item.TryGetProperty("explanation", out var e) ? e.GetString() : null;

                            if (!string.IsNullOrWhiteSpace(front) && !string.IsNullOrWhiteSpace(back))
                            {
                                flashcards.Add(new AddCardDto(front, back, explanation));
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
            CancellationToken cancellationToken)
        {
            var optionsCsv = string.Join(", ", options);
            var systemPrompt = $"You are an expert language acquisition assistant. Analyze the conversation history between the language learner (USER) and the AI (ASSISTANT) in {targetLanguage}.\n" +
                               $"You must generate custom flashcards covering these selected categories: [{optionsCsv}] based EXCLUSIVELY on the USER's turns and the corrections provided.\n\n" +
                               $"CRITICAL RULES:\n" +
                               $"1. SOURCE RESTRICTION: Every single flashcard must be directly derived from the actual words, phrases, or errors that occurred in the USER's dialog turns in the session. Absolutely DO NOT generate cards for the AI character's messages, and do not make up arbitrary words that were never mentioned.\n" +
                               $"2. CATEGORY COMPLIANCE & HIGH MEMORY RETRIEVAL FORMAT:\n" +
                               $"   - 'grammar': Extract sentences where the user made grammatical errors. \n" +
                               $"     * 'front': The sentence containing the user's highlighted error (e.g. \"I *goes* to school yesterday. ❌ (Sửa lỗi sai) [Simple Past]\").\n" +
                               $"     * 'back': The corrected sentence in the target language (e.g. \"I went to school yesterday. (Corrected)\").\n" +
                               $"     * 'explanation': A clear, encouraging grammatical rule in Vietnamese explaining the mistake, the corrected form, and a short rule formula (e.g. \"Giải thích: Trạng từ 'yesterday' yêu cầu quá khứ đơn...\\n\\nCông thức: S + V2/ed\").\n" +
                               $"   - 'vocabulary': Extract key words, expressions, or idioms that the user struggled with or tried to use.\n" +
                               $"     * 'front': The target word/phrase with its IPA phonetic guide and context tag, followed by a fill-in-the-blank sentence where the word is replaced by a blank line (e.g. \"accomplish /əˈkʌm.plɪʃ/ [verb • Scenario Context]\\nWe can _______ anything if we work together. (Điền vào chỗ trống)\").\n" +
                               $"     * 'back': The precise translation or meaning in Vietnamese (Tiếng Việt).\n" +
                               $"     * 'explanation': A helpful definition in English, followed by the complete example sentence, its translation in Vietnamese, and synonyms (e.g. \"Definition: To succeed in doing something...\\n\\nExample: 'We can accomplish anything...'\\nTranslation: 'Chúng ta có thể...'\\n\\nSynonyms: achieve, fulfill\").\n" +
                               $"   - 'improvement': Propose more natural or idiomatic native alternatives for the ideas the user expressed.\n" +
                               $"     * 'front': The flat/awkward sentence that the user said, marked with a warning sign (e.g. \"I want a cup of coffee. ⚠️ (Nói tự nhiên hơn?) [Polite Register]\").\n" +
                               $"     * 'back': The natural, native-level formulation in the target language (e.g. \"Could I get a cup of coffee, please? [Polite]\").\n" +
                               $"     * 'explanation': The Vietnamese translation of the user's intent, plus a short Vietnamese nuance note explaining why the native formulation is more appropriate or polite.\n" +
                               $"3. NO TRIVIAL CARDS: Do not include basic words (e.g., 'hello', 'yes', 'no', 'good') unless they were corrected.\n" +
                               $"4. DYNAMIC CARD COUNT: Generate a dynamic number of cards (from 1 up to 10) depending on how many valid elements can be extracted from the user's turns. If the conversation was short and had no mistakes/key words, only generate 1-2 high-quality cards.\n\n" +
                               $"Return a JSON object with a \"flashcards\" key containing an array of objects. Each object must have \"front\", \"back\", and \"explanation\" keys.\n\n" +
                               $"The output must be strictly valid JSON. Example:\n" +
                               $"{{\n  \"flashcards\": [\n    {{\n      \"front\": \"accomplish /əˈkʌm.plɪʃ/ [verb]\\nWe can _______ anything if we work together. (Điền vào chỗ trống)\",\n      \"back\": \"hoàn thành, đạt được\",\n      \"explanation\": \"Definition: To succeed in doing something.\\n\\nExample: 'We can accomplish...'\\nTranslation: 'Chúng ta có thể...'\\n\\nSynonyms: achieve\"\n    }}\n  ]\n}}";

            var historyText = string.Join("\n", history.Select(m => $"{m.Role}: {m.Text}"));

            var (modelName, endpoint, apiKey) = await GetModelConfigAsync("ModelFlashcard", cancellationToken);

            var requestBody = new
            {
                model = modelName,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = historyText }
                },
                temperature = 0.5,
                response_format = new { type = "json_object" },
                stream = false
            };

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
                    using var doc = JsonDocument.Parse(contentJson);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("flashcards", out var listProp) && listProp.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in listProp.EnumerateArray())
                        {
                            var front = item.TryGetProperty("front", out var f) ? f.GetString() : null;
                            var back = item.TryGetProperty("back", out var b) ? b.GetString() : null;
                            var explanation = item.TryGetProperty("explanation", out var e) ? e.GetString() : null;

                            if (!string.IsNullOrWhiteSpace(front) && !string.IsNullOrWhiteSpace(back))
                            {
                                flashcards.Add(new AddCardDto(front, back, explanation));
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

            var (modelName, endpoint, apiKey) = await GetModelConfigAsync("ModelFeedback", cancellationToken);

            var requestBody = new
            {
                model = modelName,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userPrompt }
                },
                temperature = 0.5,
                response_format = new { type = "json_object" },
                stream = false
            };

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

            var (_, _, apiKey) = await GetModelConfigAsync("ModelChat", cancellationToken);

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

            var (modelName, endpoint, apiKey) = await GetModelConfigAsync("ModelPhrase", cancellationToken);

            var requestBody = new
            {
                model = modelName,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = $"Generate a phrase for {language} ({level}) about '{topic}'" }
                },
                temperature = 0.8,
                response_format = new { type = "json_object" },
                stream = false
            };

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

            var (modelName, endpoint, apiKey) = await GetModelConfigAsync("ModelChat", cancellationToken);

            var requestBody = new
            {
                model = modelName,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = $"Lookup details for the word/phrase: {word}" }
                },
                temperature = 0.3,
                response_format = new { type = "json_object" },
                stream = false
            };

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
