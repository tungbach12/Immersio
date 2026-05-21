using System;
using System.Collections.Generic;

namespace Immersio.Application.DTOs.Practice
{
    public sealed record PronunciationLogDto(
        Guid Id,
        string Phrase,
        string Transcript,
        int Score,
        DateTime PracticedAt
    );

    public sealed record CreatePronunciationLogRequest(
        string Phrase,
        string Transcript,
        int Score
    );

    public sealed record SkillScoreDto(
        string Name,
        int Score,
        string Description
    );

    public sealed record CefrAnalysisDto(
        string CurrentLevel,
        int OverallScore,
        string ColorTheme,
        string StatusMessage,
        List<SkillScoreDto> Skills,
        List<string> Suggestions
    );
}
