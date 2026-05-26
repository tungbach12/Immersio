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

    public sealed record AiCefrFeedbackDto(
        string StatusMessage,
        List<string> Suggestions
    );

    public sealed record PhonemeAssessmentDto(
        string Phoneme,
        int AccuracyScore
    );

    public sealed record WordAssessmentDto(
        string Word,
        int AccuracyScore,
        string ErrorType,
        List<PhonemeAssessmentDto> Phonemes
    );

    public sealed record PronunciationAssessmentResultDto(
        string Transcript,
        int Score,
        string Message,
        List<WordAssessmentDto> Words
    );

    public sealed record GeneratePhraseRequest(
        string Language,
        string Level,
        string Topic
    );

    public sealed record GeneratedPhraseDto(
        string Phrase,
        string Translation,
        string Explanation
    );

    public sealed record DictionaryLookupRequest(
        string Word,
        string TargetLanguage
    );

    public sealed record DictionaryEntryDto(
        string Word,
        string Translation,
        string Phonetic,
        string PartOfSpeech,
        string Definition,
        string Example,
        string ExampleTranslation
    );
}
