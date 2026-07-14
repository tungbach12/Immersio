using Immersio.Application.DTOs.Practice;
using Immersio.Application.Interfaces;
using Immersio.Domain.Entities;
using Immersio.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace Immersio.Application.Services
{
    public class PronunciationService : IPronunciationService
    {
        private readonly IApplicationDbContext _context;
        private readonly ILLMService _llmService;
        private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;

        public PronunciationService(
            IApplicationDbContext context, 
            ILLMService llmService,
            Microsoft.Extensions.Configuration.IConfiguration configuration)
        {
            _context = context;
            _llmService = llmService;
            _configuration = configuration;
        }

        public async Task<PronunciationLogDto> LogPronunciationAsync(
            Guid userId,
            CreatePronunciationLogRequest request,
            CancellationToken cancellationToken = default)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user == null)
                throw new NotFoundException("User", userId);

            var log = new UserPronunciationLog(userId, request.Phrase, request.Transcript, request.Score);
            _context.UserPronunciationLogs.Add(log);

            // Award 50 Experience Points
            user.AddExperience(50);

            // Add 0.1 Learning Hours
            user.AddLearningHours(0.1);

            // Save the log first so it is included in calculations
            await _context.SaveChangesAsync(cancellationToken);

            // Recalculate CEFR Level and update user record
            var analysis = await AnalyzeCefrLevelAsync(userId, cancellationToken);
            user.SetLanguageLevel(analysis.CurrentLevel);

            // Save the updated user level
            await _context.SaveChangesAsync(cancellationToken);

            return new PronunciationLogDto(log.Id, log.Phrase, log.Transcript, log.Score, log.PracticedAt);
        }

        public async Task<List<PronunciationLogDto>> GetUserLogsAsync(
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            var logs = await _context.UserPronunciationLogs
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.PracticedAt)
                .Select(l => new PronunciationLogDto(l.Id, l.Phrase, l.Transcript, l.Score, l.PracticedAt))
                .ToListAsync(cancellationToken);

            return logs;
        }

        public async Task<CefrAnalysisDto> AnalyzeCefrLevelAsync(
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user == null)
                throw new NotFoundException("User", userId);

            // 1. Interactive Comprehension (Scenarios) - 55%
            var completedSessions = await _context.ScenarioSessions
                .Include(s => s.Scenario)
                .Where(s => s.UserId == userId && s.IsFinished)
                .OrderBy(s => s.FinishedAt) // Chronological order for decay weights
                .ToListAsync(cancellationToken);

            double scenarioComprehension;
            if (!completedSessions.Any())
            {
                scenarioComprehension = 0;
            }
            else
            {
                // Time-Decay model: newest completed sessions carry significantly more weight
                double totalScoreWithWeights = 0;
                double totalWeights = 0;
                double lambda = 0.25;

                for (int i = 0; i < completedSessions.Count; i++)
                {
                    var session = completedSessions[i];
                    double baselineScore = 20; // Default fallback (Beginner)
                    if (session.Scenario?.Level != null)
                    {
                        var lvl = session.Scenario.Level.ToUpper();
                        if (lvl.Contains("C2")) baselineScore = 100;
                        else if (lvl.Contains("C1")) baselineScore = 95;
                        else if (lvl.Contains("B2")) baselineScore = 80;
                        else if (lvl.Contains("B1")) baselineScore = 60;
                        else if (lvl.Contains("A2")) baselineScore = 40;
                        else if (lvl.Contains("A1")) baselineScore = 20;
                    }

                    // Weight decay: newer is higher weight
                    double weight = Math.Exp(-lambda * (completedSessions.Count - 1 - i));
                    totalScoreWithWeights += baselineScore * weight;
                    totalWeights += weight;
                }

                scenarioComprehension = totalScoreWithWeights / totalWeights;
            }

            // 2. Speech Fluency (Vocal Lab) - 45%
            var allLogs = await _context.UserPronunciationLogs
                .Where(l => l.UserId == userId)
                .OrderBy(l => l.PracticedAt) // Chronological order
                .ToListAsync(cancellationToken);

            double speechFluency;
            double avgPronunciationScore = 0;

            if (!allLogs.Any())
            {
                speechFluency = 0;
                avgPronunciationScore = 0;
            }
            else
            {
                avgPronunciationScore = allLogs.Average(l => l.Score);

                // Time-Decay model for speech fluency: newer speaking attempts reflect actual progress
                double totalSpeechWithWeights = 0;
                double totalSpeechWeights = 0;
                double gamma = 0.15; // slightly lower decay to capture a broader voice history

                for (int j = 0; j < allLogs.Count; j++)
                {
                    var log = allLogs[j];
                    double weight = Math.Exp(-gamma * (allLogs.Count - 1 - j));
                    totalSpeechWithWeights += log.Score * weight;
                    totalSpeechWeights += weight;
                }

                speechFluency = totalSpeechWithWeights / totalSpeechWeights;
            }

            // 3. Calculate Unified Score
            double unifiedScore = (0.55 * scenarioComprehension) + (0.45 * speechFluency);
            int overallScore = (int)Math.Round(unifiedScore);

            // 4. CEFR Level Mapping
            string currentLevel;
            if (!completedSessions.Any() && !allLogs.Any())
            {
                currentLevel = "Unassigned";
            }
            else
            {
                if (overallScore <= 15) currentLevel = "A1";
                else if (overallScore <= 35) currentLevel = "A2";
                else if (overallScore <= 60) currentLevel = "B1";
                else if (overallScore <= 80) currentLevel = "B2";
                else if (overallScore <= 95) currentLevel = "C1";
                else currentLevel = "C2";
            }

            // Cap overall CEFR level at A2 if average pronunciation score is below 50%
            bool isPronunciationCapped = false;
            if (allLogs.Any() && avgPronunciationScore < 50)
            {
                if (currentLevel != "A1" && currentLevel != "A2" && currentLevel != "Unassigned")
                {
                    currentLevel = "A2";
                    isPronunciationCapped = true;
                }
            }

            // 5. Active Vocabulary (Unique matched spoken words)
            var activeWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var log in allLogs)
            {
                var phraseWords = GetCleanWords(log.Phrase);
                var transcriptWords = GetCleanWords(log.Transcript);
                foreach (var w in phraseWords)
                {
                    if (transcriptWords.Contains(w))
                    {
                        activeWords.Add(w);
                    }
                }
            }
            int activeVocabularyCount = activeWords.Count;

            // 6. Build Skills Breakdown
            var skills = new List<SkillScoreDto>
            {
                new SkillScoreDto(
                    "Interactive Comprehension",
                    (int)Math.Round(scenarioComprehension),
                    $"Completed {completedSessions.Count} real-time scenario dialogue paths."
                ),
                new SkillScoreDto(
                    "Speech Fluency",
                    (int)Math.Round(speechFluency),
                    $"Evaluated over {allLogs.Count} spoken sentences."
                ),
                new SkillScoreDto(
                    "Active Spoken Vocabulary",
                    Math.Min(100, (activeVocabularyCount * 100) / 150), // Normalize against a target of 150 words
                    $"Mastered {activeVocabularyCount} conversational words."
                )
            };

            // 7. Suggestions & Status Themes
            string colorTheme;
            string statusMessage;
            var suggestions = new List<string>();

            if (currentLevel == "Unassigned")
            {
                colorTheme = "slate";
                statusMessage = "Not yet assessed - Start your language learning journey to get analyzed!";
                suggestions.Add("Challenge yourself with intermediate or advanced scenarios.");
                suggestions.Add("Expand your vocabulary by speaking diverse phrases in the Vocal Lab.");
                suggestions.Add("Complete more scenario sessions to boost your comprehension rating.");
                suggestions.Add("Practice at least 5 different speech sentences in the Vocal Lab to refine your fluency score.");
            }
            else
            {
                if (currentLevel == "A1" || currentLevel == "A2") colorTheme = "bronze";
                else if (currentLevel == "B1" || currentLevel == "B2") colorTheme = "silver";
                else colorTheme = "gold";

                // AI personalization setup
                var completedScenarioTitles = completedSessions
                    .Select(s => $"{s.Scenario?.Title} ({s.Scenario?.Level})")
                    .Where(t => !string.IsNullOrEmpty(t))
                    .ToList();

                var recentSpeechScores = allLogs
                    .TakeLast(5)
                    .Select(l => l.Score)
                    .ToList();

                try
                {
                    var aiFeedback = await _llmService.GenerateCefrFeedbackAsync(
                        currentLevel,
                        overallScore,
                        completedScenarioTitles,
                        recentSpeechScores,
                        activeVocabularyCount,
                        cancellationToken);

                    statusMessage = aiFeedback.StatusMessage;
                    suggestions = aiFeedback.Suggestions;
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"Failed to generate AI CEFR feedback: {ex.Message}");
                    
                    statusMessage = currentLevel.StartsWith("A") 
                        ? $"Beginner - Great start on your language journey! Let's build up confidence." 
                        : currentLevel.StartsWith("B")
                        ? $"Intermediate - natural dialogue flow and excellent sentence structure."
                        : $"Advanced - Excellent professional fluency and deep expression capability.";

                    suggestions.Add("Challenge yourself with intermediate or advanced scenarios.");
                    suggestions.Add("Expand your vocabulary by speaking diverse phrases in the Vocal Lab.");
                    suggestions.Add("Complete more scenario sessions to boost your comprehension rating.");
                    suggestions.Add("Practice at least 5 different speech sentences in the Vocal Lab to refine your fluency score.");
                }
            }

            if (isPronunciationCapped)
            {
                suggestions.Add("CRITICAL: Your average pronunciation accuracy is below 50%. Your level is capped at A2. Practice speaking slowly and articulating clearly to unlock higher tiers.");
            }

            return new CefrAnalysisDto(
                CurrentLevel: currentLevel,
                OverallScore: overallScore,
                ColorTheme: colorTheme,
                StatusMessage: statusMessage,
                Skills: skills,
                Suggestions: suggestions
            );
        }

        public async Task<PronunciationAssessmentResultDto> AssessPronunciationAsync(
            Guid userId,
            byte[] audioBytes,
            string filename,
            string targetPhrase,
            CancellationToken cancellationToken = default)
        {
            // 1. Retrieve Azure configuration settings
            var apiKey = _configuration["Azure:Speech:ApiKey"];
            var region = _configuration["Azure:Speech:Region"] ?? "centralindia";
            var customEndpoint = _configuration["Azure:Speech:Endpoint"];

            // If Key is not configured or placeholder remains, fallback to a friendly mock score!
            if (string.IsNullOrWhiteSpace(apiKey) || apiKey.Contains("YOUR_AZURE"))
            {
                var mockTranscript = targetPhrase;
                var mockScore = 95;
                var mockMsg = "Perfect accent! (Azure Sandbox Mock Mode - Key not set yet).";

                var mockLog = new UserPronunciationLog(userId, targetPhrase, mockTranscript, mockScore);
                _context.UserPronunciationLogs.Add(mockLog);
                
                var mockUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
                if (mockUser != null)
                {
                    mockUser.AddExperience(50);
                    mockUser.AddLearningHours(0.1);
                    await _context.SaveChangesAsync(cancellationToken);
                    
                    var cefr = await AnalyzeCefrLevelAsync(userId, cancellationToken);
                    mockUser.SetLanguageLevel(cefr.CurrentLevel);
                    await _context.SaveChangesAsync(cancellationToken);
                }

                var mockWords = targetPhrase.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                var mockWordsList = new List<WordAssessmentDto>();
                var rnd = new Random();
                foreach (var w in mockWords)
                {
                    var cleanW = new string(w.Where(c => !char.IsPunctuation(c)).ToArray());
                    if (string.IsNullOrEmpty(cleanW)) continue;

                    var phonemes = new List<PhonemeAssessmentDto>();
                    foreach (var ch in cleanW)
                    {
                        var scoreVal = rnd.Next(85, 100);
                        phonemes.Add(new PhonemeAssessmentDto(ch.ToString().ToLowerInvariant(), scoreVal));
                    }

                    mockWordsList.Add(new WordAssessmentDto(cleanW, rnd.Next(85, 100), "None", phonemes));
                }

                return new PronunciationAssessmentResultDto(mockTranscript, mockScore, mockMsg, mockWordsList);
            }

            // 2. Build the Azure Speech STT REST Endpoint (e.g. for centralindia)
            string endpoint;
            if (!string.IsNullOrWhiteSpace(customEndpoint) && !customEndpoint.Contains("api.cognitive.microsoft.com"))
            {
                var baseUri = customEndpoint.Trim();
                if (!baseUri.EndsWith("/"))
                {
                    baseUri += "/";
                }
                endpoint = $"{baseUri}speech/recognition/conversation/cognitiveservices/v1?language=en-US";
            }
            else
            {
                var host = $"https://{region}.stt.speech.microsoft.com";
                endpoint = $"{host}/speech/recognition/conversation/cognitiveservices/v1?language=en-US";
            }

            // 3. Define Azure Pronunciation Assessment configuration parameters
            var assessmentParams = new
            {
                ReferenceText = targetPhrase,
                GradingSystem = "HundredMark",
                Granularity = "Phoneme",
                Dimension = "Comprehensive"
            };

            var jsonParams = JsonSerializer.Serialize(assessmentParams);
            var base64Params = Convert.ToBase64String(Encoding.UTF8.GetBytes(jsonParams));

            using var httpClient = new HttpClient();
            using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);

            // 4. Set required HTTP headers for Azure
            request.Headers.Add("Ocp-Apim-Subscription-Key", apiKey);
            request.Headers.Add("Pronunciation-Assessment", base64Params);

            // 5. Package WAV audio bytes (16 kHz, Mono, PCM)
            var content = new ByteArrayContent(audioBytes);
            content.Headers.ContentType = new MediaTypeHeaderValue("audio/wav")
            {
                Parameters =
                {
                    new NameValueHeaderValue("codecs", "audio/pcm"),
                    new NameValueHeaderValue("samplerate", "16000")
                }
            };
            request.Content = content;

            string actualTranscript = string.Empty;
            Task<string>? whisperTask = null;
            try
            {
                whisperTask = _llmService.TranscribeAudioAsync(audioBytes, filename, cancellationToken);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PronunciationService] Failed to start Whisper task: {ex.Message}");
            }

            try
            {
                var response = await httpClient.SendAsync(request, cancellationToken);
                response.EnsureSuccessStatusCode();

                var responseString = await response.Content.ReadAsStringAsync(cancellationToken);
                
                if (whisperTask != null)
                {
                    try
                    {
                        actualTranscript = await whisperTask;
                        Console.WriteLine($"[PronunciationService] Whisper Transcript: '{actualTranscript}'");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[PronunciationService] Whisper transcription failed: {ex.Message}");
                    }
                }

                Console.WriteLine($"[PronunciationService] Raw Azure Response: {responseString}");
                
                // 6. Parse response to extract overall score and actual transcript
                using var jsonDoc = JsonDocument.Parse(responseString);
                var root = jsonDoc.RootElement;

                var recognitionStatus = TryGetPropertyInsensitive(root, "RecognitionStatus", out var statusProp) 
                    ? statusProp.GetString() 
                    : "Failure";

                if (recognitionStatus != "Success")
                {
                    return new PronunciationAssessmentResultDto(
                        Transcript: string.Empty,
                        Score: 0,
                        Message: "Azure Speech failed to recognize your voice. Please speak clearly.",
                        Words: new List<WordAssessmentDto>()
                    );
                }

                string transcript = TryGetPropertyInsensitive(root, "DisplayText", out var textProp) 
                    ? textProp.GetString() ?? string.Empty 
                    : string.Empty;

                int score = 0;
                var wordsList = new List<WordAssessmentDto>();

                if (TryGetPropertyInsensitive(root, "NBest", out var nbestProp) && nbestProp.ValueKind == JsonValueKind.Array)
                {
                    var firstBest = nbestProp.EnumerateArray().FirstOrDefault();
                    if (firstBest.ValueKind == JsonValueKind.Object)
                    {
                        // 1. Overall Score
                        if (TryGetPropertyInsensitive(firstBest, "PronScore", out var scoreProp))
                        {
                            score = (int)Math.Round(GetDoubleSafe(scoreProp));
                        }
                        else if (TryGetPropertyInsensitive(firstBest, "AccuracyScore", out var scorePropAcc))
                        {
                            score = (int)Math.Round(GetDoubleSafe(scorePropAcc));
                        }
                        else if (TryGetPropertyInsensitive(firstBest, "PronunciationAssessment", out var pronAssessmentProp))
                        {
                            if (TryGetPropertyInsensitive(pronAssessmentProp, "PronScore", out var scorePropFallback))
                            {
                                score = (int)Math.Round(GetDoubleSafe(scorePropFallback));
                            }
                        }

                        // 2. Words list
                        if (TryGetPropertyInsensitive(firstBest, "Words", out var wordsProp) && wordsProp.ValueKind == JsonValueKind.Array)
                        {
                            var transcriptWords = GetNormalizedWordsList(string.IsNullOrWhiteSpace(actualTranscript) ? transcript : actualTranscript);
                            var referenceWords = GetNormalizedWordsList(targetPhrase);

                            int tPointer = 0;
                            int lastSpokenRefIndex = -1;
                            for (int r = 0; r < referenceWords.Count; r++)
                            {
                                for (int t = tPointer; t < transcriptWords.Count; t++)
                                {
                                    bool isMatch = string.Equals(referenceWords[r], transcriptWords[t], StringComparison.OrdinalIgnoreCase) ||
                                                   ComputeCharEditDistance(referenceWords[r], transcriptWords[t]) <= (referenceWords[r].Length > 4 ? 2 : 1);
                                    if (isMatch)
                                    {
                                        lastSpokenRefIndex = r;
                                        tPointer = t + 1;
                                        break;
                                    }
                                }
                            }

                            int wordIdx = 0;
                            foreach (var wEl in wordsProp.EnumerateArray())
                            {
                                var wordText = TryGetPropertyInsensitive(wEl, "Word", out var wtProp) ? wtProp.GetString() ?? string.Empty : string.Empty;
                                var wordAccuracy = 0;
                                var wordError = "None";

                                // Parse Word Accuracy Score
                                if (TryGetPropertyInsensitive(wEl, "AccuracyScore", out var wAccProp))
                                {
                                    wordAccuracy = (int)Math.Round(GetDoubleSafe(wAccProp));
                                }
                                else if (TryGetPropertyInsensitive(wEl, "PronunciationAssessment", out var wPronProp))
                                {
                                    if (TryGetPropertyInsensitive(wPronProp, "AccuracyScore", out var wAccPropFallback))
                                    {
                                        wordAccuracy = (int)Math.Round(GetDoubleSafe(wAccPropFallback));
                                    }
                                }

                                // Parse Word Error Type
                                if (TryGetPropertyInsensitive(wEl, "ErrorType", out var wErrProp))
                                {
                                    wordError = wErrProp.GetString() ?? "None";
                                }
                                else if (TryGetPropertyInsensitive(wEl, "PronunciationAssessment", out var wPronProp2))
                                {
                                    if (TryGetPropertyInsensitive(wPronProp2, "ErrorType", out var wErrPropFallback))
                                    {
                                        wordError = wErrPropFallback.GetString() ?? "None";
                                    }
                                }

                                // If this word index is beyond the last spoken index, override to Omission
                                if (wordIdx > lastSpokenRefIndex)
                                {
                                    wordError = "Omission";
                                    wordAccuracy = 0;
                                }
                                else if (string.Equals(wordError, "Omission", StringComparison.OrdinalIgnoreCase))
                                {
                                    wordAccuracy = 0;
                                }

                                // 3. Phonemes list
                                var phonemesList = new List<PhonemeAssessmentDto>();
                                if (TryGetPropertyInsensitive(wEl, "Phonemes", out var phonemesProp) && phonemesProp.ValueKind == JsonValueKind.Array)
                                {
                                    foreach (var pEl in phonemesProp.EnumerateArray())
                                    {
                                        var phSymbol = TryGetPropertyInsensitive(pEl, "Phoneme", out var phProp) ? phProp.GetString() ?? string.Empty : string.Empty;
                                        var phAccuracy = 0;

                                        // Parse Phoneme Accuracy Score
                                        if (TryGetPropertyInsensitive(pEl, "AccuracyScore", out var pAccProp))
                                        {
                                            phAccuracy = (int)Math.Round(GetDoubleSafe(pAccProp));
                                        }
                                        else if (TryGetPropertyInsensitive(pEl, "PronunciationAssessment", out var pPronProp))
                                        {
                                            if (TryGetPropertyInsensitive(pPronProp, "AccuracyScore", out var pAccPropFallback))
                                            {
                                                phAccuracy = (int)Math.Round(GetDoubleSafe(pAccPropFallback));
                                            }
                                        }

                                        // Force phoneme score to 0 if word is omitted
                                        if (string.Equals(wordError, "Omission", StringComparison.OrdinalIgnoreCase))
                                        {
                                            phAccuracy = 0;
                                        }

                                        if (!string.IsNullOrEmpty(phSymbol))
                                        {
                                            phonemesList.Add(new PhonemeAssessmentDto(phSymbol, phAccuracy));
                                        }
                                    }
                                }

                                if (!string.IsNullOrEmpty(wordText))
                                {
                                    wordsList.Add(new WordAssessmentDto(wordText, wordAccuracy, wordError, phonemesList));
                                }
                                wordIdx++;
                            }
                        }
                    }
                }

                // 7. Log standard gamification updates
                var log = new UserPronunciationLog(userId, targetPhrase, transcript, score);
                _context.UserPronunciationLogs.Add(log);

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
                if (user != null)
                {
                    user.AddExperience(50);
                    user.AddLearningHours(0.1);
                    await _context.SaveChangesAsync(cancellationToken);

                    var cefrAnalysis = await AnalyzeCefrLevelAsync(userId, cancellationToken);
                    user.SetLanguageLevel(cefrAnalysis.CurrentLevel);
                    await _context.SaveChangesAsync(cancellationToken);
                }

                // 8. Generate feedback message
                string message;
                if (score >= 90) message = "Perfect accent! Microsoft AI grades you as elite.";
                else if (score >= 70) message = "Great pronunciation and flow, keep practicing.";
                else if (score >= 40) message = "A bit off. Try articulating clearly and speaking louder.";
                else message = "Speak slowly, enunciate each syllable, and try again.";

                return new PronunciationAssessmentResultDto(transcript, score, message, wordsList);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Azure Pronunciation Assessment failed: {ex.Message}");
                
                var mockWords = targetPhrase.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                var mockWordsList = new List<WordAssessmentDto>();
                var rnd = new Random();
                foreach (var w in mockWords)
                {
                    var cleanW = new string(w.Where(c => !char.IsPunctuation(c)).ToArray());
                    if (string.IsNullOrEmpty(cleanW)) continue;
                    var phonemes = new List<PhonemeAssessmentDto>();
                    foreach (var ch in cleanW)
                    {
                        phonemes.Add(new PhonemeAssessmentDto(ch.ToString().ToLowerInvariant(), 90));
                    }
                    mockWordsList.Add(new WordAssessmentDto(cleanW, 90, "None", phonemes));
                }

                // Log the fallback attempt to the database so it appears in history and counts towards stats!
                try
                {
                    var fallbackScore = 85;
                    var log = new UserPronunciationLog(userId, targetPhrase, targetPhrase, fallbackScore);
                    _context.UserPronunciationLogs.Add(log);

                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
                    if (user != null)
                    {
                        user.AddExperience(50);
                        user.AddLearningHours(0.1);
                        await _context.SaveChangesAsync(cancellationToken);

                        var cefrAnalysis = await AnalyzeCefrLevelAsync(userId, cancellationToken);
                        user.SetLanguageLevel(cefrAnalysis.CurrentLevel);
                        await _context.SaveChangesAsync(cancellationToken);
                    }
                }
                catch (Exception dbEx)
                {
                    System.Diagnostics.Debug.WriteLine($"Failed to save fallback pronunciation log: {dbEx.Message}");
                }

                return new PronunciationAssessmentResultDto(
                    Transcript: targetPhrase,
                    Score: 85,
                    Message: "Connection failed. Fallback simulation active: Great effort!",
                    Words: mockWordsList
                );
            }
        }

        private static List<string> GetNormalizedWordsList(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return new List<string>();

            var cleaned = new string(input.Select(c => (char.IsPunctuation(c) && c != '\'' && c != '’') ? ' ' : c).ToArray());
            return cleaned.Split(new[] { ' ', '\r', '\n', '\t' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(w => w.ToLowerInvariant().Replace("’", "'"))
                .ToList();
        }

        private static int ComputeWordEditDistance(List<string> sWords, List<string> tWords)
        {
            int n = sWords.Count;
            int m = tWords.Count;
            int[,] d = new int[n + 1, m + 1];

            if (n == 0) return m;
            if (m == 0) return n;

            for (int i = 0; i <= n; d[i, 0] = i++) { }
            for (int j = 0; j <= m; d[0, j] = j++) { }

            for (int i = 1; i <= n; i++)
            {
                for (int j = 1; j <= m; j++)
                {
                    int cost = (tWords[j - 1] == sWords[i - 1]) ? 0 : 1;
                    d[i, j] = Math.Min(
                        Math.Min(d[i - 1, j] + 1, d[i, j - 1] + 1),
                        d[i - 1, j - 1] + cost);
                }
            }
            return d[n, m];
        }

        private static int ComputeCharEditDistance(string s, string t)
        {
            if (string.IsNullOrEmpty(s)) return t?.Length ?? 0;
            if (string.IsNullOrEmpty(t)) return s.Length;

            int n = s.Length;
            int m = t.Length;
            int[,] d = new int[n + 1, m + 1];

            for (int i = 0; i <= n; d[i, 0] = i++) { }
            for (int j = 0; j <= m; d[0, j] = j++) { }

            for (int i = 1; i <= n; i++)
            {
                for (int j = 1; j <= m; j++)
                {
                    int cost = (t[j - 1] == s[i - 1]) ? 0 : 1;
                    d[i, j] = Math.Min(
                        Math.Min(d[i - 1, j] + 1, d[i, j - 1] + 1),
                        d[i - 1, j - 1] + cost);
                }
            }
            return d[n, m];
        }

        private static HashSet<string> GetCleanWords(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var cleaned = new string(input.Select(c => char.IsPunctuation(c) ? ' ' : c).ToArray());
            return cleaned.Split(new[] { ' ', '\r', '\n', '\t' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(w => w.ToLowerInvariant())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
        }

        public async Task<GeneratedPhraseDto> GeneratePhraseAsync(
            GeneratePhraseRequest request,
            CancellationToken cancellationToken = default)
        {
            var language = string.IsNullOrWhiteSpace(request.Language) ? "English" : request.Language;
            var level = string.IsNullOrWhiteSpace(request.Level) ? "Intermediate" : request.Level;
            var topic = string.IsNullOrWhiteSpace(request.Topic) ? "General" : request.Topic;

            return await _llmService.GeneratePronunciationPhraseAsync(language, level, topic, cancellationToken);
        }

        private static bool TryGetPropertyInsensitive(JsonElement element, string name, out JsonElement value)
        {
            value = default;
            if (element.ValueKind != JsonValueKind.Object)
                return false;

            foreach (var property in element.EnumerateObject())
            {
                if (string.Equals(property.Name, name, StringComparison.OrdinalIgnoreCase))
                {
                    value = property.Value;
                    return true;
                }
            }

            return false;
        }

        private static double GetDoubleSafe(JsonElement element)
        {
            if (element.ValueKind == JsonValueKind.Number)
            {
                return element.GetDouble();
            }
            if (element.ValueKind == JsonValueKind.String && double.TryParse(element.GetString(), out double val))
            {
                return val;
            }
            return 0;
        }
    }
}
