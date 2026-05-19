using Immersio.Application.DTOs.Srs;
using Immersio.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace Immersio.WebApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class FlashcardsController : ControllerBase
    {
        private readonly ISrsService _srsService;

        public FlashcardsController(ISrsService srsService)
        {
            _srsService = srsService;
        }

        [HttpPost("decks")]
        public async Task<IActionResult> CreateDeck(
            [FromBody] string name,
            CancellationToken cancellationToken)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized();

            var result = await _srsService.CreateDeckAsync(userId, name, cancellationToken);
            return CreatedAtAction(nameof(GetDecks), result);
        }

        [HttpGet("decks")]
        public async Task<IActionResult> GetDecks(CancellationToken cancellationToken)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized();

            var result = await _srsService.GetDecksAsync(userId, cancellationToken);
            return Ok(result);
        }

        [HttpDelete("decks/{deckId:guid}")]
        public async Task<IActionResult> DeleteDeck(
            Guid deckId,
            CancellationToken cancellationToken)
        {
            await _srsService.DeleteDeckAsync(deckId, cancellationToken);
            return NoContent();
        }

        [HttpGet("decks/{deckId:guid}/review")]
        public async Task<IActionResult> GetReviewCards(
            Guid deckId,
            CancellationToken cancellationToken)
        {
            var result = await _srsService.GetReviewCardsAsync(deckId, cancellationToken);
            return Ok(result);
        }

        [HttpPost("decks/{deckId:guid}/cards")]
        public async Task<IActionResult> AddCards(
            Guid deckId,
            [FromBody] IEnumerable<AddCardDto> cards,
            CancellationToken cancellationToken)
        {
            var addedCount = await _srsService.AddCardsAsync(deckId, cards, cancellationToken);
            return Ok(new { Count = addedCount });
        }

        [HttpPost("cards/{cardId:guid}/review")]
        public async Task<IActionResult> ReviewCard(
            Guid cardId,
            [FromBody] ReviewCardRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _srsService.ReviewCardAsync(cardId, request.Quality, cancellationToken);
            return Ok(result);
        }

        [HttpDelete("cards/{cardId:guid}")]
        public async Task<IActionResult> DeleteCard(
            Guid cardId,
            CancellationToken cancellationToken)
        {
            await _srsService.DeleteCardAsync(cardId, cancellationToken);
            return NoContent();
        }
    }
}
