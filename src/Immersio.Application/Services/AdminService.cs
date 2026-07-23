using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Immersio.Application.DTOs.Admin;
using Immersio.Application.DTOs.Auth;
using Immersio.Application.Interfaces;
using Immersio.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Immersio.Application.Services
{
    public class AdminService : IAdminService
    {
        private readonly IApplicationDbContext _context;

        public AdminService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<AdminDashboardStatsDto> GetDashboardStatsAsync(CancellationToken cancellationToken)
        {
            var totalUsersTask = _context.Users.AsNoTracking().CountAsync(u => !u.IsDeleted, cancellationToken);
            var activeSessionsTask = _context.ScenarioSessions.AsNoTracking().CountAsync(s => s.FinishedAt == null, cancellationToken);
            var plusCountTask = _context.Users.AsNoTracking().CountAsync(u => !u.IsDeleted && u.SubscriptionTier == "Plus", cancellationToken);
            var premiumCountTask = _context.Users.AsNoTracking().CountAsync(u => !u.IsDeleted && u.SubscriptionTier == "Premium", cancellationToken);

            await Task.WhenAll(totalUsersTask, activeSessionsTask, plusCountTask, premiumCountTask);

            var totalUsers = await totalUsersTask;
            var activeSessions = await activeSessionsTask;
            var plusCount = await plusCountTask;
            var premiumCount = await premiumCountTask;

            var revenueVal = (plusCount * 69000) + (premiumCount * 199000);
            var revenueStr = $"{revenueVal / 1000:N0}.000đ";

            var averageDuration = "18m";
            var completedDurations = await _context.ScenarioSessions
                .AsNoTracking()
                .Where(s => s.FinishedAt != null)
                .Select(s => (s.FinishedAt!.Value - s.StartedAt).TotalMinutes)
                .ToListAsync(cancellationToken);
            if (completedDurations.Any())
            {
                averageDuration = $"{Math.Round(completedDurations.Average(), 1)}m";
            }

            var growthData = new List<GrowthPoint>();
            var sessionData = new List<SessionPoint>();
            var today = DateTime.UtcNow.Date;
            var sevenDaysAgo = today.AddDays(-6);

            var recentUsers = await _context.Users
                .AsNoTracking()
                .Where(u => !u.IsDeleted)
                .Select(u => u.CreatedAt)
                .ToListAsync(cancellationToken);

            var recentSessions = await _context.ScenarioSessions
                .AsNoTracking()
                .Where(s => s.StartedAt >= sevenDaysAgo)
                .Select(s => s.StartedAt)
                .ToListAsync(cancellationToken);

            for (int i = 6; i >= 0; i--)
            {
                var date = today.AddDays(-i);
                var nextDate = date.AddDays(1);
                var dayName = date.ToString("ddd");

                var usersCount = recentUsers.Count(u => u < nextDate);
                var sessionsCount = recentSessions.Count(s => s >= date && s < nextDate);

                growthData.Add(new GrowthPoint(dayName, usersCount));
                sessionData.Add(new SessionPoint(dayName, sessionsCount));
            }

            return new AdminDashboardStatsDto(
                totalUsers,
                activeSessions,
                averageDuration,
                revenueStr,
                growthData,
                sessionData
            );
        }

        public async Task<IEnumerable<PaymentTransactionDto>> GetTransactionsAsync(CancellationToken cancellationToken)
        {
            var list = await (from t in _context.PaymentTransactions.AsNoTracking()
                              join u in _context.Users.AsNoTracking() on t.UserId equals u.Id into usersGroup
                              from u in usersGroup.DefaultIfEmpty()
                              orderby t.CreatedAt descending
                              select new
                              {
                                  t.Id,
                                  t.TxnRef,
                                  t.UserId,
                                  Username = u != null ? u.Username : null,
                                  Email = u != null ? u.Email : null,
                                  t.Tier,
                                  t.BillingCycle,
                                  t.Amount,
                                  t.Status,
                                  t.CreatedAt,
                                  t.PaidAt
                              }).ToListAsync(cancellationToken);

            return list.Select(t => new PaymentTransactionDto(
                t.Id,
                t.TxnRef,
                t.UserId,
                t.Username ?? "Deleted User",
                t.Email ?? "N/A",
                t.Tier,
                t.BillingCycle,
                t.Amount,
                t.Status,
                t.CreatedAt,
                t.PaidAt
            ));
        }

        public async Task<IEnumerable<UserDto>> GetUsersAsync(CancellationToken cancellationToken)
        {
            var users = await _context.Users
                .Where(u => !u.IsDeleted)
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync(cancellationToken);

            return users.Select(u => new UserDto(
                u.Id,
                u.Username,
                u.Email,
                u.SubscriptionTier,
                u.SubscriptionExpiresAt,
                u.StreakCount,
                u.ExperiencePoints,
                u.LearningHours,
                u.CurrentLanguageLevel,
                u.Role,
                u.NotifEmail,
                u.NotifPush,
                u.NotifStreak,
                u.NotifTips,
                u.IsPublic,
                u.ProfilePictureUrl
            ));
        }

        public async Task<UserDto> UpdateUserSubscriptionAsync(Guid userId, string tier, string cycle, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken);
            if (user == null)
                throw new KeyNotFoundException("User not found.");

            var expiresAt = cycle.ToLower() == "free" ? (DateTime?)null : 
                            cycle.ToLower() == "yearly" ? DateTime.UtcNow.AddYears(1) : DateTime.UtcNow.AddMonths(1);

            user.UpdateSubscription(tier, expiresAt);
            await _context.SaveChangesAsync(cancellationToken);

            return new UserDto(
                user.Id,
                user.Username,
                user.Email,
                user.SubscriptionTier,
                user.SubscriptionExpiresAt,
                user.StreakCount,
                user.ExperiencePoints,
                user.LearningHours,
                user.CurrentLanguageLevel,
                user.Role,
                user.NotifEmail,
                user.NotifPush,
                user.NotifStreak,
                user.NotifTips,
                user.IsPublic,
                user.ProfilePictureUrl
            );
        }

        public async Task<bool> BanUserAsync(Guid userId, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken);
            if (user == null)
                return false;

            user.SoftDelete();
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<SystemSettingsDto> GetAiSettingsAsync(CancellationToken cancellationToken)
        {
            var prompt = await GetSettingValueAsync("SystemPrompt", "You are an expert language tutor in the IMMERSIO app. Your goal is to help users practice conversation in a natural, immersive way.", cancellationToken);
            var grammar = int.Parse(await GetSettingValueAsync("GrammarSensitivity", "75", cancellationToken));
            var vocab = int.Parse(await GetSettingValueAsync("VocabSensitivity", "50", cancellationToken));
            var slang = bool.Parse(await GetSettingValueAsync("EnableSlang", "true", cancellationToken));
            var speed = await GetSettingValueAsync("SpeedOfSpeech", "1.0x (Normal)", cancellationToken);
            var endpoint = await GetSettingValueAsync("LlmEndpoint", "https://integrate.api.nvidia.com/v1/chat/completions", cancellationToken);
            var apiKey = ""; // API Key is securely stored in env/appsettings, do not expose to frontend
            var modelChat = await GetSettingValueAsync("ModelChat", "meta/llama-4-maverick-17b-128e-instruct", cancellationToken);
            var modelGrammar = await GetSettingValueAsync("ModelGrammar", "nvidia/nemotron-mini-4b-instruct", cancellationToken);
            
            // Auto-heal/migrate deprecated 70B model which returns 404 on NVIDIA Integrate API
            if (modelGrammar == "nvidia/llama-3.1-nemotron-70b-instruct")
            {
                modelGrammar = "nvidia/nemotron-mini-4b-instruct";
                await SaveSettingValueAsync("ModelGrammar", modelGrammar, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
            }

            var modelFeedback = await GetSettingValueAsync("ModelFeedback", "mistralai/mistral-large-3-675b-instruct-2512", cancellationToken);
            var modelFlashcard = await GetSettingValueAsync("ModelFlashcard", "qwen/qwen3-coder-480b-a35b-instruct", cancellationToken);
            var modelPhrase = await GetSettingValueAsync("ModelPhrase", "nvidia/nemotron-mini-4b-instruct", cancellationToken);
            // Migrate legacy single ReasoningEffort key if present
            var legacyEffort = await GetSettingValueAsync("ReasoningEffort", "none", cancellationToken);
            var reasoningEffortChat = await GetSettingValueAsync("ReasoningEffortChat", legacyEffort, cancellationToken);
            var reasoningEffortGrammar = await GetSettingValueAsync("ReasoningEffortGrammar", legacyEffort, cancellationToken);
            var reasoningEffortFeedback = await GetSettingValueAsync("ReasoningEffortFeedback", legacyEffort, cancellationToken);
            var reasoningEffortFlashcard = await GetSettingValueAsync("ReasoningEffortFlashcard", legacyEffort, cancellationToken);
            var reasoningEffortPhrase = await GetSettingValueAsync("ReasoningEffortPhrase", legacyEffort, cancellationToken);

            return new SystemSettingsDto(prompt, grammar, vocab, slang, speed, endpoint, apiKey, modelChat, modelGrammar, modelFeedback, modelFlashcard, modelPhrase, reasoningEffortChat, reasoningEffortGrammar, reasoningEffortFeedback, reasoningEffortFlashcard, reasoningEffortPhrase);
        }

        public async Task SaveAiSettingsAsync(SystemSettingsDto settings, CancellationToken cancellationToken)
        {
            await SaveSettingValueAsync("SystemPrompt", settings.SystemPrompt, cancellationToken);
            await SaveSettingValueAsync("GrammarSensitivity", settings.GrammarSensitivity.ToString(), cancellationToken);
            await SaveSettingValueAsync("VocabSensitivity", settings.VocabSensitivity.ToString(), cancellationToken);
            await SaveSettingValueAsync("EnableSlang", settings.EnableSlang.ToString(), cancellationToken);
            await SaveSettingValueAsync("SpeedOfSpeech", settings.SpeedOfSpeech, cancellationToken);
            await SaveSettingValueAsync("LlmEndpoint", settings.LlmEndpoint ?? "https://api.groq.com/openai/v1/chat/completions", cancellationToken);
            // LlmApiKey is securely stored in env/appsettings, do not write to DB
            await SaveSettingValueAsync("ModelChat", settings.ModelChat ?? "llama-3.3-70b-versatile", cancellationToken);
            await SaveSettingValueAsync("ModelGrammar", settings.ModelGrammar ?? "llama-3.3-70b-versatile", cancellationToken);
            await SaveSettingValueAsync("ModelFeedback", settings.ModelFeedback ?? "llama-3.3-70b-versatile", cancellationToken);
            await SaveSettingValueAsync("ModelFlashcard", settings.ModelFlashcard ?? "llama-3.3-70b-versatile", cancellationToken);
            await SaveSettingValueAsync("ModelPhrase", settings.ModelPhrase ?? "llama-3.3-70b-versatile", cancellationToken);
            await SaveSettingValueAsync("ReasoningEffortChat", settings.ReasoningEffortChat ?? "none", cancellationToken);
            await SaveSettingValueAsync("ReasoningEffortGrammar", settings.ReasoningEffortGrammar ?? "none", cancellationToken);
            await SaveSettingValueAsync("ReasoningEffortFeedback", settings.ReasoningEffortFeedback ?? "none", cancellationToken);
            await SaveSettingValueAsync("ReasoningEffortFlashcard", settings.ReasoningEffortFlashcard ?? "none", cancellationToken);
            await SaveSettingValueAsync("ReasoningEffortPhrase", settings.ReasoningEffortPhrase ?? "none", cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);
        }

        private async Task<string> GetSettingValueAsync(string key, string defaultValue, CancellationToken cancellationToken)
        {
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == key, cancellationToken);
            if (setting == null)
            {
                setting = new SystemSetting(key, defaultValue);
                _context.SystemSettings.Add(setting);
                await _context.SaveChangesAsync(cancellationToken);
            }
            return setting.Value;
        }

        private async Task SaveSettingValueAsync(string key, string value, CancellationToken cancellationToken)
        {
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == key, cancellationToken);
            if (setting == null)
            {
                setting = new SystemSetting(key, value);
                _context.SystemSettings.Add(setting);
            }
            else
            {
                setting.Update(value);
            }
        }
    }
}
