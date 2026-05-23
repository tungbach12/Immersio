using Immersio.Application.DTOs.Practice;
using Immersio.Application.Interfaces;
using Immersio.Domain.Entities;
using Immersio.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Immersio.Application.Services
{
    public class PronunciationService : IPronunciationService
    {
        private readonly IApplicationDbContext _context;
        private readonly ILLMService _llmService;

        public PronunciationService(IApplicationDbContext context, ILLMService llmService)
        {
            _context = context;
            _llmService = llmService;
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
            // 1. Transcribe audio using backend Groq Whisper service
            var transcript = await _llmService.TranscribeAudioAsync(audioBytes, filename, cancellationToken);
            
            if (string.IsNullOrWhiteSpace(transcript))
            {
                return new PronunciationAssessmentResultDto(
                    Transcript: string.Empty,
                    Score: 0,
                    Message: "No speech detected. Please speak louder and clearer."
                );
            }

            // 2. Compute Levenshtein distance at word-level for robust evaluation
            var targetWords = GetNormalizedWordsList(targetPhrase);
            var spokenWords = GetNormalizedWordsList(transcript);

            int distance = ComputeWordEditDistance(targetWords, spokenWords);

            int score = 0;
            if (targetWords.Count > 0)
            {
                double ratio = (double)(targetWords.Count - distance) / targetWords.Count;
                score = Math.Max(0, (int)Math.Round(ratio * 100));
            }

            // 3. Log the pronunciation practice attempt
            var log = new UserPronunciationLog(userId, targetPhrase, transcript, score);
            _context.UserPronunciationLogs.Add(log);

            // 4. Award Gamification Credits (50 XP, 0.1 Learning Hours)
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user != null)
            {
                user.AddExperience(50);
                user.AddLearningHours(0.1);
                await _context.SaveChangesAsync(cancellationToken);

                // 5. Update CEFR Level
                var cefrAnalysis = await AnalyzeCefrLevelAsync(userId, cancellationToken);
                user.SetLanguageLevel(cefrAnalysis.CurrentLevel);
                await _context.SaveChangesAsync(cancellationToken);
            }

            // 6. Generate detailed motivational feedback message
            string message;
            if (score >= 90) message = "Perfect accent! Linguistic Precision.";
            else if (score >= 70) message = "Great pronunciation and flow, keep refining.";
            else if (score >= 40) message = "A bit off. Practice articulating clearly.";
            else message = "Speak slowly and clearly, then try again.";

            return new PronunciationAssessmentResultDto(transcript, score, message);
        }

        private static List<string> GetNormalizedWordsList(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return new List<string>();

            var cleaned = new string(input.Select(c => char.IsPunctuation(c) ? ' ' : c).ToArray());
            return cleaned.Split(new[] { ' ', '\r', '\n', '\t' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(w => w.ToLowerInvariant())
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

        private static HashSet<string> GetCleanWords(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var cleaned = new string(input.Select(c => char.IsPunctuation(c) ? ' ' : c).ToArray());
            return cleaned.Split(new[] { ' ', '\r', '\n', '\t' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(w => w.ToLowerInvariant())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
        }
    }
}
