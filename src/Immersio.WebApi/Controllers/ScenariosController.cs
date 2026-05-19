using Immersio.Application.DTOs.Scenario;
using Immersio.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace Immersio.WebApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ScenariosController : ControllerBase
    {
        private readonly IScenarioService _scenarioService;

        public ScenariosController(IScenarioService scenarioService)
        {
            _scenarioService = scenarioService;
        }

        [HttpGet]
        public async Task<IActionResult> GetScenarios(CancellationToken cancellationToken)
        {
            var result = await _scenarioService.GetScenariosAsync(cancellationToken);
            return Ok(result);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetScenario(Guid id, CancellationToken cancellationToken)
        {
            var result = await _scenarioService.GetScenarioByIdAsync(id, cancellationToken);
            return Ok(result);
        }

        [HttpPost("sessions/start")]
        public async Task<IActionResult> StartSession(
            [FromBody] StartSessionRequest request,
            CancellationToken cancellationToken)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized();

            var sessionId = await _scenarioService.StartSessionAsync(userId, request.ScenarioId, cancellationToken);
            return Ok(new { SessionId = sessionId });
        }

        [HttpPost("sessions/{sessionId:guid}/chat")]
        public async Task<IActionResult> SendMessage(
            Guid sessionId,
            [FromBody] ChatInputRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _scenarioService.SendMessageAsync(sessionId, request.Message, cancellationToken);
            return Ok(result);
        }

        [HttpPost("sessions/{sessionId:guid}/finish")]
        public async Task<IActionResult> CompleteSession(
            Guid sessionId,
            CancellationToken cancellationToken)
        {
            var result = await _scenarioService.CompleteSessionAsync(sessionId, cancellationToken);
            return Ok(result);
        }

        [HttpPost("sessions/{sessionId:guid}/flashcards")]
        public async Task<IActionResult> GenerateCustomFlashcards(
            Guid sessionId,
            [FromBody] GenerateFlashcardsRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _scenarioService.GenerateCustomFlashcardsAsync(sessionId, request.Options, cancellationToken);
            return Ok(result);
        }
    }
}
