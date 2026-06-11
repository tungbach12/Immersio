using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Immersio.Application.DTOs.Scenario;
using Immersio.Application.DTOs.Srs;
using Immersio.Application.DTOs.Practice;

namespace Immersio.Application.Interfaces
{
    public interface ILLMService
    {
        Task<string> GenerateChatResponseAsync(
            string contextPrompt, 
            IEnumerable<SessionMessageDto> history, 
            string userMessage, 
            IEnumerable<string>? allowedEmotions,
            CancellationToken cancellationToken);

        Task<CorrectionResultDto> AnalyzeGrammarAsync(
            string userMessage, 
            string targetLanguage, 
            CancellationToken cancellationToken);

        Task<string> GenerateSessionFeedbackAsync(
            string contextPrompt, 
            IEnumerable<SessionMessageDto> history, 
            CancellationToken cancellationToken);

        Task<List<AddCardDto>> GenerateFlashcardsAsync(
            IEnumerable<SessionMessageDto> history, 
            string targetLanguage, 
            CancellationToken cancellationToken);

        Task<List<AddCardDto>> GenerateCustomFlashcardsAsync(
            IEnumerable<SessionMessageDto> history, 
            string targetLanguage,
            List<string> options,
            CancellationToken cancellationToken);

        Task<AiCefrFeedbackDto> GenerateCefrFeedbackAsync(
            string currentLevel,
            int overallScore,
            List<string> completedScenarios,
            List<int> recentSpeechScores,
            int activeWordsCount,
            CancellationToken cancellationToken);

        Task<string> TranscribeAudioAsync(
            byte[] audioBytes,
            string filename,
            CancellationToken cancellationToken);

        Task<GeneratedPhraseDto> GeneratePronunciationPhraseAsync(
            string language,
            string level,
            string topic,
            CancellationToken cancellationToken);

        Task<DictionaryEntryDto> LookupWordAsync(
            string word,
            string targetLanguage,
            CancellationToken cancellationToken);
    }
}
