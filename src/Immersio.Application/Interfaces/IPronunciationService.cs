using Immersio.Application.DTOs.Practice;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Immersio.Application.Interfaces
{
    public interface IPronunciationService
    {
        Task<PronunciationLogDto> LogPronunciationAsync(
            Guid userId,
            CreatePronunciationLogRequest request,
            CancellationToken cancellationToken = default);

        Task<List<PronunciationLogDto>> GetUserLogsAsync(
            Guid userId,
            CancellationToken cancellationToken = default);

        Task<CefrAnalysisDto> AnalyzeCefrLevelAsync(
            Guid userId,
            CancellationToken cancellationToken = default);

        Task<PronunciationAssessmentResultDto> AssessPronunciationAsync(
            Guid userId,
            byte[] audioBytes,
            string filename,
            string targetPhrase,
            CancellationToken cancellationToken = default);

        Task<GeneratedPhraseDto> GeneratePhraseAsync(
            GeneratePhraseRequest request,
            CancellationToken cancellationToken = default);
    }
}
