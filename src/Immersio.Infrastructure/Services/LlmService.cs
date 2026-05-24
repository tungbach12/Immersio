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
using Microsoft.Extensions.Configuration;

namespace Immersio.Infrastructure.Services
{
    public class LlmService : ILLMService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private const string GroqEndpoint = "https://api.groq.com/openai/v1/chat/completions";
        private const string DefaultModel = "llama-3.3-70b-versatile";

        public LlmService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Groq:ApiKey"] ?? throw new ArgumentNullException("Groq API key is not configured.");
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

            var requestBody = new
            {
                model = DefaultModel,
                messages = messagesPayload,
                temperature = 0.7,
                max_completion_tokens = 1024,
                stream = false
            };

            var request = new HttpRequestMessage(HttpMethod.Post, GroqEndpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            request.Content = JsonContent.Create(requestBody);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();

            var chatResponse = await response.Content.ReadFromJsonAsync<GroqChatResponse>(cancellationToken: cancellationToken);
            return chatResponse?.Choices?.FirstOrDefault()?.Message?.Content ?? "I am sorry, I couldn't understand that.";
        }

        public async Task<CorrectionResultDto> AnalyzeGrammarAsync(
            string userMessage, 
            string targetLanguage, 
            CancellationToken cancellationToken)
        {
            var systemPrompt = $"Analyze the sentence spoken by a language learner in {targetLanguage}.\n" +
                               $"Return a JSON object with \"corrected\" (natural version) and \"explanation\" (brief note explaining why or \"Perfect!\").\n" +
                               $"The output must be strictly valid JSON. Example:\n" +
                               $"{{\n  \"corrected\": \"Good morning, how are you?\",\n  \"explanation\": \"Added a comma for natural phrasing.\"\n}}";

            var requestBody = new
            {
                model = DefaultModel,
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
                var request = new HttpRequestMessage(HttpMethod.Post, GroqEndpoint);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
                request.Content = JsonContent.Create(requestBody);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                response.EnsureSuccessStatusCode();

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

            var requestBody = new
            {
                model = DefaultModel,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userPrompt }
                },
                temperature = 0.7,
                stream = false
            };

            var request = new HttpRequestMessage(HttpMethod.Post, GroqEndpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            request.Content = JsonContent.Create(requestBody);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();

            var chatResponse = await response.Content.ReadFromJsonAsync<GroqChatResponse>(cancellationToken: cancellationToken);
            return chatResponse?.Choices?.FirstOrDefault()?.Message?.Content ?? "Great job practicing today!";
        }

        public async Task<List<AddCardDto>> GenerateFlashcardsAsync(
            IEnumerable<SessionMessageDto> history, 
            string targetLanguage, 
            CancellationToken cancellationToken)
        {
            var systemPrompt = $"Analyze the conversation between a language learner and an AI in {targetLanguage}.\n" +
                               $"Identify 3 to 5 key vocabulary terms, grammar corrections, or useful idioms that the student struggled with or could benefit from reviewing.\n" +
                               $"Return a JSON object with a \"flashcards\" key containing an array of objects. Each object must have:\n" +
                               $"- \"front\": The word, phrase or sentence in {targetLanguage}\n" +
                               $"- \"back\": The translation or definition in Vietnamese (Tiếng Việt)\n" +
                               $"- \"explanation\": A brief explanation or grammatical tip\n\n" +
                               $"The output must be strictly valid JSON. Example:\n" +
                               $"{{\n  \"flashcards\": [\n    {{\n      \"front\": \"Famichiki\",\n      \"back\": \"Gà rán của FamilyMart\",\n      \"explanation\": \"Món ăn nổi tiếng tại chuỗi tiện lợi Nhật Bản.\"\n    }}\n  ]\n}}";

            var historyText = string.Join("\n", history.Select(m => $"{m.Role}: {m.Text}"));

            var requestBody = new
            {
                model = DefaultModel,
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
                var request = new HttpRequestMessage(HttpMethod.Post, GroqEndpoint);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
                request.Content = JsonContent.Create(requestBody);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                response.EnsureSuccessStatusCode();

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
            var systemPrompt = $"Analyze the language learning session history in {targetLanguage}.\n" +
                               $"Focus EXCLUSIVELY on the USER's messages, corrections, and sentence improvements. DO NOT generate cards for the AI character's messages.\n\n" +
                               $"You must generate custom flashcards covering these selected categories: [{optionsCsv}].\n\n" +
                               $"CATEGORY INSTRUCTIONS:\n" +
                               $"- 'grammar': Look at the user's messages that had grammatical/spelling errors and corrections. Create cards where Front is the corrected sentence/phrase in {targetLanguage}, Back is the translation/meaning in Vietnamese, and Explanation details what error was made and why the correction is correct.\n" +
                               $"- 'vocabulary': Extract key vocabulary words, phrases, or idioms that the user used or attempted to use during their turns. Front is the word/phrase in {targetLanguage}, Back is the Vietnamese definition.\n" +
                               $"- 'improvement': Look at the user's sentences (even correct ones) and propose more natural, idiomatic, or native ways to express those ideas. Front is the advanced/natural expression in {targetLanguage}, Back is the Vietnamese translation of the user's original intent.\n\n" +
                               $"DETERMINATION OF CARD COUNT:\n" +
                               $"Do not limit yourself to a fixed count. Generate a dynamic number of cards (from 1 up to 10+) based purely on the depth of the user's conversation and the number of mistakes, words, or improvements identified.\n\n" +
                               $"Return a JSON object with a \"flashcards\" key containing an array of objects. Each object must have:\n" +
                               $"- \"front\": The phrase, sentence, or word in {targetLanguage}\n" +
                               $"- \"back\": The definition or translation in Vietnamese (Tiếng Việt)\n" +
                               $"- \"explanation\": A helpful grammatical tip or context note in Vietnamese\n\n" +
                               $"The output must be strictly valid JSON. Example:\n" +
                               $"{{\n  \"flashcards\": [\n    {{\n      \"front\": \"Famichiki\",\n      \"back\": \"Gà rán của FamilyMart\",\n      \"explanation\": \"Từ vựng phổ biến khi mua sắm tại Nhật.\"\n    }}\n  ]\n}}";

            var historyText = string.Join("\n", history.Select(m => $"{m.Role}: {m.Text}"));

            var requestBody = new
            {
                model = DefaultModel,
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
                var request = new HttpRequestMessage(HttpMethod.Post, GroqEndpoint);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
                request.Content = JsonContent.Create(requestBody);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                response.EnsureSuccessStatusCode();

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

            var requestBody = new
            {
                model = DefaultModel,
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
                var request = new HttpRequestMessage(HttpMethod.Post, GroqEndpoint);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
                request.Content = JsonContent.Create(requestBody);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                response.EnsureSuccessStatusCode();

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

            var request = new HttpRequestMessage(HttpMethod.Post, GroqAudioEndpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
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

            var requestBody = new
            {
                model = DefaultModel,
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
                var request = new HttpRequestMessage(HttpMethod.Post, GroqEndpoint);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
                request.Content = JsonContent.Create(requestBody);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                response.EnsureSuccessStatusCode();

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
