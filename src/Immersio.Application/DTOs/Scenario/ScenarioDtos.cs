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
        IEnumerable<ScenarioItemDto> Items
    );

    public sealed record StartSessionRequest(Guid ScenarioId);

    public sealed record SessionMessageDto(string Role, string Text, string? CorrectionText, string? CorrectionExplanation, DateTime SentAt);

    public sealed record ChatInputRequest(string Message);

    public sealed record CorrectionResultDto(string Corrected, string Explanation);

    public sealed record ChatOutputResponse(string Reply, CorrectionResultDto? Correction);

    public sealed record FinishSessionResponse(string Feedback, List<AddCardDto> SuggestedFlashcards);

    public sealed record GenerateFlashcardsRequest(List<string> Options);
}
