using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Immersio.Application.DTOs.Scenario;
using Immersio.Application.DTOs.Srs;
using Immersio.Application.Interfaces;
using Immersio.Domain.Entities;
using Immersio.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Immersio.Application.Services
{
    public class ScenarioService : IScenarioService
    {
        private readonly IApplicationDbContext _context;
        private readonly ILLMService _llmService;

        public ScenarioService(IApplicationDbContext context, ILLMService llmService)
        {
            _context = context;
            _llmService = llmService;
        }

        public async Task<IEnumerable<ScenarioDto>> GetScenariosAsync(CancellationToken cancellationToken)
        {
            var scenarios = await _context.Scenarios
                .AsNoTracking()
                .Include(s => s.Items)
                .Where(s => !s.IsDeleted)
                .ToListAsync(cancellationToken);

            return scenarios.Select(MapToDto);
        }

        public async Task<ScenarioDto> GetScenarioByIdAsync(Guid id, CancellationToken cancellationToken)
        {
            var scenario = await _context.Scenarios
                .AsNoTracking()
                .Include(s => s.Items)
                .FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, cancellationToken);

            if (scenario == null)
                throw new NotFoundException("Scenario", id);

            return MapToDto(scenario);
        }

        public async Task<Guid> StartSessionAsync(Guid userId, Guid scenarioId, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken);
            if (user == null)
                throw new NotFoundException("User", userId);

            var scenario = await _context.Scenarios.FirstOrDefaultAsync(s => s.Id == scenarioId && !s.IsDeleted, cancellationToken);
            if (scenario == null)
                throw new NotFoundException("Scenario", scenarioId);

            // Subscription/daily-limit checks temporarily disabled for development.
            /*
            // Enforce daily scenario limit based on subscription tier
            var today = DateTime.UtcNow.Date;
            var sessionCountToday = await _context.ScenarioSessions
                .CountAsync(s => s.UserId == userId && s.StartedAt >= today, cancellationToken);

            var tier = user.ActiveSubscriptionTier;
            if (string.Equals(tier, "Basic", StringComparison.OrdinalIgnoreCase) && sessionCountToday >= 5)
            {
                throw new ConflictException("You have reached your daily scenario limit of 5. Please upgrade your subscription to get more scenarios.");
            }
            else if (string.Equals(tier, "Plus", StringComparison.OrdinalIgnoreCase) && sessionCountToday >= 20)
            {
                throw new ConflictException("You have reached your daily scenario limit of 20. Please upgrade your subscription to get unlimited scenarios.");
            }
            */

            // Create new session
            var session = new ScenarioSession(userId, scenarioId);
            
            // Auto-append model's initial message
            session.AddMessage("model", scenario.InitialMessage);

            _context.ScenarioSessions.Add(session);
            await _context.SaveChangesAsync(cancellationToken);

            return session.Id;
        }

        public async Task<ChatOutputResponse> SendMessageAsync(Guid sessionId, string userMessage, CancellationToken cancellationToken)
        {
            var session = await _context.ScenarioSessions
                .Include(s => s.Scenario)
                .Include(s => s.Messages)
                .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

            if (session == null)
                throw new NotFoundException("ScenarioSession", sessionId);

            if (session.IsFinished)
                throw new ConflictException("Cannot send messages to a completed session.");

            // 1. Core Evaluation: real-time accent / spelling / grammar analyzer
            var correction = await _llmService.AnalyzeGrammarAsync(userMessage, session.Scenario.Language, cancellationToken);

            // 2. Append User message
            var isCorrect = string.Equals(correction.Corrected.Trim(), userMessage.Trim(), StringComparison.OrdinalIgnoreCase) 
                            || correction.Explanation.Contains("Perfect", StringComparison.OrdinalIgnoreCase);

            var userMsg = new SessionMessage(
                session.Id, 
                "user", 
                userMessage, 
                isCorrect ? null : correction.Corrected, 
                isCorrect ? null : correction.Explanation);
            
            _context.SessionMessages.Add(userMsg);
            session.Messages.Add(userMsg);

            // 3. Collect dialogue history for character prompt kịch bản
            var history = session.Messages
                .OrderBy(m => m.SentAt)
                .Select(m => new SessionMessageDto(m.SenderRole, m.Text, m.CorrectionText, m.CorrectionExplanation, m.SentAt))
                .ToList();

            // 4. Generate AI character reply based on contextual roleplay
            var reply = await _llmService.GenerateChatResponseAsync(session.Scenario.ContextPrompt, history, userMessage, cancellationToken);
            
            // 5. Append AI reply
            var modelMsg = new SessionMessage(session.Id, "model", reply);
            _context.SessionMessages.Add(modelMsg);
            session.Messages.Add(modelMsg);

            await _context.SaveChangesAsync(cancellationToken);

            return new ChatOutputResponse(reply, isCorrect ? null : correction);
        }

        public async Task<FinishSessionResponse> CompleteSessionAsync(Guid sessionId, CancellationToken cancellationToken)
        {
            var session = await _context.ScenarioSessions
                .Include(s => s.Scenario)
                .Include(s => s.Messages)
                .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

            if (session == null)
                throw new NotFoundException("ScenarioSession", sessionId);

            if (session.IsFinished)
                throw new ConflictException("Session is already completed.");

            // 1. Prepare history
            var history = session.Messages
                .OrderBy(m => m.SentAt)
                .Select(m => new SessionMessageDto(m.SenderRole, m.Text, m.CorrectionText, m.CorrectionExplanation, m.SentAt))
                .ToList();

            // 2. Generate comprehensive performance feedback
            var feedback = await _llmService.GenerateSessionFeedbackAsync(session.Scenario.ContextPrompt, history, cancellationToken);

            // 3. Generate suggested flashcard deck candidates
            var flashcards = await _llmService.GenerateFlashcardsAsync(history, session.Scenario.Language, cancellationToken);

            // 4. Complete session
            session.Complete(feedback);
            await _context.SaveChangesAsync(cancellationToken);

            return new FinishSessionResponse(feedback, flashcards);
        }

        public async Task<List<AddCardDto>> GenerateCustomFlashcardsAsync(Guid sessionId, List<string> options, CancellationToken cancellationToken)
        {
            var session = await _context.ScenarioSessions
                .Include(s => s.Scenario)
                .Include(s => s.Messages)
                .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

            if (session == null)
                throw new NotFoundException("ScenarioSession", sessionId);

            var history = session.Messages
                .OrderBy(m => m.SentAt)
                .Select(m => new SessionMessageDto(m.SenderRole, m.Text, m.CorrectionText, m.CorrectionExplanation, m.SentAt))
                .ToList();

            return await _llmService.GenerateCustomFlashcardsAsync(history, session.Scenario.Language, options, cancellationToken);
        }

        public async Task SeedScenariosAsync(CancellationToken cancellationToken)
        {
            var hasScenarios = await _context.Scenarios.AnyAsync(cancellationToken);
            if (hasScenarios) return;

            var scenariosToSeed = new List<Scenario>
            {
                new Scenario(
                    title: "Discovery: Shibuya Navigation",
                    language: "English",
                    level: "Beginner",
                    category: "Navigation",
                    description: "Learn to navigate Tokyo's busiest district using AR directions and interactive maps.",
                    rating: 5.0,
                    duration: "15 mins",
                    imageUrl: "/ScenariosImage/Discovery shibuya navigation background.jpg",
                    contextPrompt: "You are a tourist lost in Shibuya, Tokyo. You are looking for Shibuya Crossing. Ask the user for directions. The user is a local who will provide directions. Respond naturally to their instructions and ask follow-up questions if needed (e.g., about Hachiko Statue). Keep responses brief (1-3 sentences).",
                    initialMessage: "Excuse me! Could you tell me how to get to Shibuya Crossing?",
                    avatarUrl: "/ScenariosImage/Discovery shibuya navigation character.png",
                    isNavigation: true
                ),
                new Scenario(
                    title: "Konbini Late Night Run",
                    language: "Japanese",
                    level: "Intermediate",
                    category: "Travel",
                    description: "Navigate a Japanese convenience store interaction. Ask for heated bento, chopsticks, and handle payment.",
                    rating: 4.7,
                    duration: "8 mins",
                    imageUrl: "/ScenariosImage/Konbini late night run Background.jpg",
                    contextPrompt: "あなたは日本のコンビニの店員です。ユーザーがお弁当と飲み物を買っています。お弁当を温めるか（「お弁当温めますか？」）、お箸が必要か（「お箸はお使いになりますか？」）を尋ね、支払いを担当してください。最後は「ありがとうございました」で締めてください。返答は短く1〜3文にしてください。",
                    initialMessage: "いらっしゃいませ！コンビニへようこそ。ポイントカードはお持ちですか？",
                    avatarUrl: "/ScenariosImage/Konbini late night run character.png",
                    isNavigation: false
                ),
                new Scenario(
                    title: "Ordering Coffee (English)",
                    language: "English",
                    level: "Beginner",
                    category: "Travel",
                    description: "Practice ordering coffee in English with Shinji at a coffee shop.",
                    rating: 4.9,
                    duration: "10 mins",
                    imageUrl: "/ScenariosImage/Ordering coffee background.jpg",
                    contextPrompt: "You are Shinji, a barista at a friendly coffee shop. The user is a customer ordering coffee. Be polite, suggest milk or syrup options, and process the order. Keep responses short (1-2 sentences).",
                    initialMessage: "Hi there! What can I get for you today?",
                    avatarUrl: "/ScenariosImage/Ordering coffee character.png",
                    isNavigation: false
                ),
                new Scenario(
                    title: "Ordering Dim Sum in Shanghai",
                    language: "Chinese",
                    level: "Beginner",
                    category: "Travel",
                    description: "Practice ordering delicious dim sum at a traditional restaurant in Shanghai.",
                    rating: 4.7,
                    duration: "12 mins",
                    imageUrl: "/ScenariosImage/Ordering dim sum in shanghai background.jpg",
                    contextPrompt: "You are a friendly waiter at a famous traditional dim sum restaurant in Shanghai. The user is a customer. Recommend some popular dishes like Xiao Long Bao (小笼包) and Har Gow (虾饺). Ask how many people are in their party and if they want tea. Keep responses brief (1-3 sentences).",
                    initialMessage: "您好！欢迎光临。请问几位？要喝什么茶？",
                    avatarUrl: "/ScenariosImage/Ordering dim sum in shanghai character.png",
                    isNavigation: false
                )
            };

            // Seed items for Konbini Run (Scenario 1)
            scenariosToSeed[1].AddItem("Salmon Bento (鮭弁当)", 540m, "https://images.unsplash.com/photo-1580442151529-343f2f5e0e37?q=80&w=2670&auto=format&fit=crop", "Utensils");
            scenariosToSeed[1].AddItem("Tuna Mayo Onigiri (ツナマヨおにぎり)", 120m, "https://images.unsplash.com/photo-1604328701720-3de131014e76?q=80&w=2670&auto=format&fit=crop", "Triangle");
            scenariosToSeed[1].AddItem("Green Tea (お茶)", 150m, "https://images.unsplash.com/photo-1594631252845-29fc4586216c?q=80&w=2574&auto=format&fit=crop", "Coffee");
            scenariosToSeed[1].AddItem("Famichiki (ファミチキ)", 220m, "https://upload.wikimedia.org/wikipedia/commons/e/ea/Famichiki_of_FamilyMart.jpg", "Flame");
            scenariosToSeed[1].AddItem("Cup Noodles (カップヌードル)", 180m, "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=2100&auto=format&fit=crop", "Bowl");

            _context.Scenarios.AddRange(scenariosToSeed);
            await _context.SaveChangesAsync(cancellationToken);
        }

        private ScenarioDto MapToDto(Scenario s)
        {
            return new ScenarioDto(
                s.Id,
                s.Title,
                s.Language,
                s.Level,
                s.Category,
                s.Description,
                s.Rating,
                s.Duration,
                s.ImageUrl,
                s.InitialMessage,
                s.AvatarUrl,
                s.IsNavigation,
                s.Items.Select(i => new ScenarioItemDto(i.Id, i.Name, i.Price, i.ImageUrl, i.Icon))
            );
        }
    }
}
