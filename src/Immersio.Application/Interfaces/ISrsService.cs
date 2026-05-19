using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Immersio.Application.DTOs.Srs;

namespace Immersio.Application.Interfaces
{
    public interface ISrsService
    {
        Task<DeckDto> CreateDeckAsync(Guid userId, string name, CancellationToken cancellationToken);
        Task<IEnumerable<DeckDto>> GetDecksAsync(Guid userId, CancellationToken cancellationToken);
        Task<IEnumerable<CardDto>> GetReviewCardsAsync(Guid deckId, CancellationToken cancellationToken);
        Task<CardDto> AddCardAsync(Guid deckId, AddCardDto cardDto, CancellationToken cancellationToken);
        Task<int> AddCardsAsync(Guid deckId, IEnumerable<AddCardDto> cardDtos, CancellationToken cancellationToken);
        Task<CardDto> ReviewCardAsync(Guid cardId, int quality, CancellationToken cancellationToken);
        Task DeleteDeckAsync(Guid deckId, CancellationToken cancellationToken);
        Task DeleteCardAsync(Guid cardId, CancellationToken cancellationToken);
    }
}
