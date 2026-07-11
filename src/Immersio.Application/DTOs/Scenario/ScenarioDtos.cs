using System;
using System.Collections.Generic;
using Immersio.Application.DTOs.Srs;

namespace Immersio.Application.DTOs.Scenario
{
    public sealed record ScenarioItemDto(Guid Id, string Name, decimal Price, string ImageUrl, string? Icon);

    public sealed record ScenarioDto(
        Guid Id,
        string Title,
        string Language,
        string Level,
        string Category,
        string Description,
        double Rating,
        string Duration,
        string ImageUrl,
        string InitialMessage,
        string AvatarUrl,
        bool IsNavigation,
        string? VoiceId,
        IEnumerable<ScenarioItemDto> Items,
        string? EmotionsJson = null,
        string? Gender = null,
        string? DefaultEmotion = null
    );

    public sealed record StartSessionRequest(Guid ScenarioId, string? TargetLanguage = null);

    public sealed record SessionMessageDto(string Role, string Text, string? CorrectionText, string? CorrectionExplanation, DateTime SentAt);

    public sealed record ScenarioContextDto(string Title, string Level, string Category, string Description, string ContextPrompt);

    public sealed record ChatInputRequest(string Message);

    public sealed record CorrectionResultDto(string Corrected, string Explanation);

    public sealed record ChatOutputResponse(string Reply, CorrectionResultDto? Correction, string? Emotion = "idle");

    public sealed record FinishSessionResponse(string Feedback, List<AddCardDto> SuggestedFlashcards);

    public sealed record GenerateFlashcardsRequest(List<string> Options);

    public sealed record CreateScenarioDto(
        string Title,
        string Language,
        string Level,
        string Category,
        string Description,
        double Rating,
        string Duration,
        string ImageUrl,
        string ContextPrompt,
        string InitialMessage,
        string AvatarUrl,
        bool IsNavigation,
        string? VoiceId,
        string? EmotionsJson = null,
        string? Gender = null,
        string? DefaultEmotion = null
    );

    public sealed record CreateScenarioItemDto(string Name, decimal Price, string ImageUrl, string? Icon);
}
