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
        private static readonly System.Collections.Concurrent.ConcurrentDictionary<Guid, string> SessionLanguages = new();

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

        public async Task<(Guid SessionId, string InitialMessage)> StartSessionAsync(Guid userId, Guid scenarioId, string? targetLanguage, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken);
            if (user == null)
                throw new NotFoundException("User", userId);

            var scenario = await _context.Scenarios.FirstOrDefaultAsync(s => s.Id == scenarioId && !s.IsDeleted, cancellationToken);
            if (scenario == null)
                throw new NotFoundException("Scenario", scenarioId);

            // Create new session
            var session = new ScenarioSession(userId, scenarioId);
            
            var language = string.IsNullOrWhiteSpace(targetLanguage) ? scenario.Language : targetLanguage;
            SessionLanguages[session.Id] = language;

            var initialMessage = scenario.InitialMessage;
            if (!string.Equals(language, scenario.Language, StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    initialMessage = await _llmService.GenerateChatResponseAsync(
                        $"You are a professional language translator. Translate the following opening roleplay dialog sentence of a scenario into {language}. Return ONLY the direct translation, with absolutely no other comments, explanations or markdown quotation: \"{scenario.InitialMessage}\"",
                        Enumerable.Empty<SessionMessageDto>(),
                        "Translate",
                        cancellationToken);
                }
                catch
                {
                    // Fallback to original initialMessage if translation fails
                }
            }

            // Auto-append model's initial message
            session.AddMessage("model", initialMessage);

            _context.ScenarioSessions.Add(session);
            await _context.SaveChangesAsync(cancellationToken);

            return (session.Id, initialMessage);
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

            var language = SessionLanguages.TryGetValue(sessionId, out var lang) ? lang : session.Scenario.Language;

            // 1. Core Evaluation: real-time accent / spelling / grammar analyzer
            var correction = await _llmService.AnalyzeGrammarAsync(userMessage, language, cancellationToken);

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
            var prompt = session.Scenario.ContextPrompt;
            if (!string.Equals(language, session.Scenario.Language, StringComparison.OrdinalIgnoreCase))
            {
                prompt += $"\n\nCRITICAL INSTRUCTION: The conversation target language is '{language}'. You must respond in '{language}' only. Keep the character style and scenario context consistent.";
            }
            var reply = await _llmService.GenerateChatResponseAsync(prompt, history, userMessage, cancellationToken);
            
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

            var language = SessionLanguages.TryGetValue(sessionId, out var lang) ? lang : session.Scenario.Language;

            // 1. Prepare history
            var history = session.Messages
                .OrderBy(m => m.SentAt)
                .Select(m => new SessionMessageDto(m.SenderRole, m.Text, m.CorrectionText, m.CorrectionExplanation, m.SentAt))
                .ToList();

            // 2. Generate comprehensive performance feedback
            var feedback = await _llmService.GenerateSessionFeedbackAsync(session.Scenario.ContextPrompt, history, cancellationToken);

            // 3. Generate suggested flashcard deck candidates
            var flashcards = await _llmService.GenerateFlashcardsAsync(history, language, cancellationToken);

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

            var language = SessionLanguages.TryGetValue(sessionId, out var lang) ? lang : session.Scenario.Language;
            return await _llmService.GenerateCustomFlashcardsAsync(history, language, options, cancellationToken);
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

        public async Task<ScenarioDto> CreateScenarioAsync(CreateScenarioDto dto, CancellationToken cancellationToken)
        {
            var scenario = new Scenario(
                dto.Title,
                dto.Language,
                dto.Level,
                dto.Category,
                dto.Description,
                dto.Rating,
                dto.Duration,
                dto.ImageUrl,
                dto.ContextPrompt,
                dto.InitialMessage,
                dto.AvatarUrl,
                dto.IsNavigation,
                dto.VoiceId
            );

            _context.Scenarios.Add(scenario);
            await _context.SaveChangesAsync(cancellationToken);

            return MapToDto(scenario);
        }

        public async Task<ScenarioDto> UpdateScenarioAsync(Guid id, CreateScenarioDto dto, CancellationToken cancellationToken)
        {
            var scenario = await _context.Scenarios
                .Include(s => s.Items)
                .FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, cancellationToken);

            if (scenario == null)
                throw new NotFoundException("Scenario", id);

            scenario.Update(
                dto.Title,
                dto.Language,
                dto.Level,
                dto.Category,
                dto.Description,
                dto.Rating,
                dto.Duration,
                dto.ImageUrl,
                dto.ContextPrompt,
                dto.InitialMessage,
                dto.AvatarUrl,
                dto.IsNavigation,
                dto.VoiceId
            );

            await _context.SaveChangesAsync(cancellationToken);
            return MapToDto(scenario);
        }

        public async Task<bool> DeleteScenarioAsync(Guid id, CancellationToken cancellationToken)
        {
            var scenario = await _context.Scenarios.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, cancellationToken);
            if (scenario == null) return false;

            scenario.Delete();
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<ScenarioItemDto> AddScenarioItemAsync(Guid scenarioId, CreateScenarioItemDto dto, CancellationToken cancellationToken)
        {
            var scenario = await _context.Scenarios
                .Include(s => s.Items)
                .FirstOrDefaultAsync(s => s.Id == scenarioId && !s.IsDeleted, cancellationToken);

            if (scenario == null)
                throw new NotFoundException("Scenario", scenarioId);

            scenario.AddItem(dto.Name, dto.Price, dto.ImageUrl, dto.Icon);
            await _context.SaveChangesAsync(cancellationToken);

            var item = scenario.Items.Last();
            return new ScenarioItemDto(item.Id, item.Name, item.Price, item.ImageUrl, item.Icon);
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
                s.VoiceId,
                s.Items.Select(i => new ScenarioItemDto(i.Id, i.Name, i.Price, i.ImageUrl, i.Icon))
            );
        }
    }
}
