using System;

namespace Immersio.Application.DTOs.Srs
{
    public sealed record DeckDto(Guid Id, string Name, int TotalCards, int DueCardsCount, DateTime CreatedAt);
    
    public sealed record CardDto(
        Guid Id, 
        Guid DeckId, 
        string Front, 
        string Back, 
        string? Explanation, 
        string? Tag,
        int Repetitions, 
        double EasinessFactor, 
        int IntervalDays, 
        DateTime NextReviewDate,
        DateTime? LastReviewedAt
    );

    public sealed record AddCardDto(string Front, string Back, string? Explanation, string? Tag = null);

    public sealed record ReviewCardRequest(int Quality);
}
