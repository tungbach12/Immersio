using System.Collections.Generic;

namespace Immersio.Application.DTOs.Admin
{
    public sealed record AdminDashboardStatsDto(
        int TotalUsers,
        int ActiveSessions,
        string AverageDuration,
        string Revenue,
        List<GrowthPoint> GrowthData,
        List<SessionPoint> SessionData
    );

    public sealed record GrowthPoint(string Name, int Users);
    public sealed record SessionPoint(string Name, int Sessions);

    public sealed record SystemSettingsDto(
        string SystemPrompt,
        int GrammarSensitivity,
        int VocabSensitivity,
        bool EnableSlang,
        string SpeedOfSpeech,
        string LlmEndpoint,
        string LlmApiKey,
        string ModelChat,
        string ModelGrammar,
        string ModelFeedback,
        string ModelFlashcard,
        string ModelPhrase,
        string ReasoningEffortChat,
        string ReasoningEffortGrammar,
        string ReasoningEffortFeedback,
        string ReasoningEffortFlashcard,
        string ReasoningEffortPhrase
    );
}
