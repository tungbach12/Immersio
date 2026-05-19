using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Immersio.Application.DTOs.Scenario;
using Immersio.Application.DTOs.Srs;

namespace Immersio.Application.Interfaces
{
    public interface IScenarioService
    {
        Task<IEnumerable<ScenarioDto>> GetScenariosAsync(CancellationToken cancellationToken);
        Task<ScenarioDto> GetScenarioByIdAsync(Guid id, CancellationToken cancellationToken);
        Task<Guid> StartSessionAsync(Guid userId, Guid scenarioId, CancellationToken cancellationToken);
        Task<ChatOutputResponse> SendMessageAsync(Guid sessionId, string userMessage, CancellationToken cancellationToken);
        Task<FinishSessionResponse> CompleteSessionAsync(Guid sessionId, CancellationToken cancellationToken);
        Task<List<AddCardDto>> GenerateCustomFlashcardsAsync(Guid sessionId, List<string> options, CancellationToken cancellationToken);
        Task SeedScenariosAsync(CancellationToken cancellationToken);
    }
}
