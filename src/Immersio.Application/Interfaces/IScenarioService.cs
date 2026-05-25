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
        Task<(Guid SessionId, string InitialMessage)> StartSessionAsync(Guid userId, Guid scenarioId, string? targetLanguage, CancellationToken cancellationToken);
        Task<ChatOutputResponse> SendMessageAsync(Guid sessionId, string userMessage, CancellationToken cancellationToken);
        Task<FinishSessionResponse> CompleteSessionAsync(Guid sessionId, CancellationToken cancellationToken);
        Task<List<AddCardDto>> GenerateCustomFlashcardsAsync(Guid sessionId, List<string> options, CancellationToken cancellationToken);
        Task SeedScenariosAsync(CancellationToken cancellationToken);
        Task<ScenarioDto> CreateScenarioAsync(CreateScenarioDto dto, CancellationToken cancellationToken);
        Task<ScenarioDto> UpdateScenarioAsync(Guid id, CreateScenarioDto dto, CancellationToken cancellationToken);
        Task<bool> DeleteScenarioAsync(Guid id, CancellationToken cancellationToken);
        Task<ScenarioItemDto> AddScenarioItemAsync(Guid scenarioId, CreateScenarioItemDto dto, CancellationToken cancellationToken);
    }
}
