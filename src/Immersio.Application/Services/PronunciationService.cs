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

        public PronunciationService(IApplicationDbContext context)
        {
            _context = context;
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
                .ToListAsync(cancellationToken);

            double scenarioComprehension;
            if (!completedSessions.Any())
            {
                // Default user metrics to B2 (80 points) to honor current design templates
                scenarioComprehension = 80;
            }
            else
            {
                int totalComprehensionScore = 0;
                foreach (var session in completedSessions)
                {
                    if (session.Scenario?.Level == null)
                    {
                        totalComprehensionScore += 15; // fallback
                        continue;
                    }

                    var lvl = session.Scenario.Level.ToUpper();
                    if (lvl.Contains("C"))
                    {
                        totalComprehensionScore += 50; // Advanced scenarios are weighted highest
                    }
                    else if (lvl.Contains("B"))
                    {
                        totalComprehensionScore += 30; // Intermediate scenarios
                    }
                    else
                    {
                        totalComprehensionScore += 15; // Beginner scenarios
                    }
                }
                scenarioComprehension = Math.Min(100, totalComprehensionScore);
            }

            // 2. Speech Fluency (Vocal Lab) - 45%
            var allLogs = await _context.UserPronunciationLogs
                .Where(l => l.UserId == userId)
                .ToListAsync(cancellationToken);

            double speechFluency;
            double avgPronunciationScore = 0;

            if (!allLogs.Any())
            {
                // Default to 80 points to honor B2 templates if no speech logs exist yet
                speechFluency = 80;
                avgPronunciationScore = 80;
            }
            else
            {
                avgPronunciationScore = allLogs.Average(l => l.Score);
                speechFluency = avgPronunciationScore; // mapped 1-to-1 as score is already 0-100
            }

            // 3. Calculate Unified Score
            double unifiedScore = (0.55 * scenarioComprehension) + (0.45 * speechFluency);
            int overallScore = (int)Math.Round(unifiedScore);

            // 4. CEFR Level Mapping
            string currentLevel;
            if (overallScore <= 15) currentLevel = "A1";
            else if (overallScore <= 35) currentLevel = "A2";
            else if (overallScore <= 60) currentLevel = "B1";
            else if (overallScore <= 80) currentLevel = "B2";
            else if (overallScore <= 95) currentLevel = "C1";
            else currentLevel = "C2";

            // Cap overall CEFR level at A2 if average pronunciation score is below 50%
            bool isPronunciationCapped = false;
            if (allLogs.Any() && avgPronunciationScore < 50)
            {
                if (currentLevel != "A1" && currentLevel != "A2")
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

            if (currentLevel == "A1" || currentLevel == "A2")
            {
                colorTheme = "bronze";
                statusMessage = currentLevel == "A1" 
                    ? "Beginner - Great start on your language journey! Let's build up confidence." 
                    : "Elementary - You are starting to understand key expressions. Keep practicing.";
                suggestions.Add("Try completing at least 3 beginner scenarios to learn fundamental phrases.");
                suggestions.Add("Speak loudly and clearly during speech exercises to get higher clarity scores.");
            }
            else if (currentLevel == "B1" || currentLevel == "B2")
            {
                colorTheme = "silver";
                statusMessage = currentLevel == "B1"
                    ? "Intermediate - You handle daily conversations well. Let's aim for precision."
                    : "Upper Intermediate - natural dialogue flow and excellent sentence structure.";
                suggestions.Add("Challenge yourself with intermediate or advanced scenarios.");
                suggestions.Add("Expand your vocabulary by speaking diverse phrases in the Vocal Lab.");
            }
            else
            {
                colorTheme = "gold";
                statusMessage = currentLevel == "C1"
                    ? "Advanced - Excellent professional fluency and deep expression capability."
                    : "Mastery - Native-like bilingual command of syntax, idioms and pronunciation.";
                suggestions.Add("Maintain active verbal practice to preserve phonetical precision.");
                suggestions.Add("Try designing your own scenarios or exploring specialized business logs.");
            }

            if (isPronunciationCapped)
            {
                suggestions.Add("CRITICAL: Your average pronunciation accuracy is below 50%. Your level is capped at A2. Practice speaking slowly and articulating clearly to unlock higher tiers.");
            }

            if (completedSessions.Count < 3)
            {
                suggestions.Add("Complete more scenario sessions to boost your comprehension rating.");
            }
            if (allLogs.Count < 5)
            {
                suggestions.Add("Practice at least 5 different speech sentences in the Vocal Lab to refine your fluency score.");
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
