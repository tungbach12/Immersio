using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Immersio.Application.DTOs.Srs;
using Immersio.Application.Interfaces;
using Immersio.Domain.Entities;
using Immersio.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Immersio.Application.Services
{
    public class SrsService : ISrsService
    {
        private readonly IApplicationDbContext _context;

        public SrsService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<DeckDto> CreateDeckAsync(Guid userId, string name, CancellationToken cancellationToken)
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken);
            if (!userExists)
                throw new NotFoundException("User", userId);

            var deck = new Deck(name, userId);
            _context.Decks.Add(deck);
            await _context.SaveChangesAsync(cancellationToken);

            return new DeckDto(deck.Id, deck.Name, 0, 0, deck.CreatedAt);
        }

        public async Task<IEnumerable<DeckDto>> GetDecksAsync(Guid userId, CancellationToken cancellationToken)
        {
            var decks = await _context.Decks
                .AsNoTracking()
                .Where(d => d.UserId == userId && !d.IsDeleted)
                .Select(d => new
                {
                    d.Id,
                    d.Name,
                    d.CreatedAt,
                    TotalCards = d.Cards.Count(c => !c.IsDeleted),
                    DueCardsCount = d.Cards.Count(c => !c.IsDeleted && c.NextReviewDate <= DateTime.UtcNow)
                })
                .ToListAsync(cancellationToken);

            return decks.Select(d => new DeckDto(d.Id, d.Name, d.TotalCards, d.DueCardsCount, d.CreatedAt));
        }

        public async Task<IEnumerable<CardDto>> GetReviewCardsAsync(Guid deckId, CancellationToken cancellationToken)
        {
            var deckExists = await _context.Decks.AnyAsync(d => d.Id == deckId && !d.IsDeleted, cancellationToken);
            if (!deckExists)
                throw new NotFoundException("Deck", deckId);

            var dueCards = await _context.Cards
                .AsNoTracking()
                .Where(c => c.DeckId == deckId && !c.IsDeleted && c.NextReviewDate <= DateTime.UtcNow)
                .OrderBy(c => c.NextReviewDate)
                .Select(c => new CardDto(
                    c.Id,
                    c.DeckId,
                    c.Front,
                    c.Back,
                    c.Explanation,
                    c.Repetitions,
                    c.EasinessFactor,
                    c.IntervalDays,
                    c.NextReviewDate,
                    c.LastReviewedAt
                ))
                .ToListAsync(cancellationToken);

            return dueCards;
        }

        public async Task<CardDto> AddCardAsync(Guid deckId, AddCardDto cardDto, CancellationToken cancellationToken)
        {
            var deck = await _context.Decks
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == deckId && !d.IsDeleted, cancellationToken);

            if (deck == null)
                throw new NotFoundException("Deck", deckId);

            var user = deck.User;
            if (user == null)
                throw new NotFoundException("User for this deck not found", deck.UserId);

            // Enforce flashcard limit for Basic tier
            var tier = user.ActiveSubscriptionTier;
            if (string.Equals(tier, "Basic", StringComparison.OrdinalIgnoreCase))
            {
                var today = DateTime.UtcNow.Date;
                var cardsCreatedToday = await _context.Cards
                    .CountAsync(c => c.Deck.UserId == user.Id && c.CreatedAt >= today && !c.IsDeleted, cancellationToken);

                if (cardsCreatedToday >= 10)
                {
                    throw new ConflictException("You have reached your daily flashcard limit of 10. Please upgrade your subscription to add more flashcards.");
                }
            }

            var card = new Card(deckId, cardDto.Front, cardDto.Back, cardDto.Explanation);
            _context.Cards.Add(card);
            await _context.SaveChangesAsync(cancellationToken);

            return new CardDto(
                card.Id,
                card.DeckId,
                card.Front,
                card.Back,
                card.Explanation,
                card.Repetitions,
                card.EasinessFactor,
                card.IntervalDays,
                card.NextReviewDate,
                card.LastReviewedAt
            );
        }

        public async Task<int> AddCardsAsync(Guid deckId, IEnumerable<AddCardDto> cardDtos, CancellationToken cancellationToken)
        {
            var deck = await _context.Decks
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == deckId && !d.IsDeleted, cancellationToken);

            if (deck == null)
                throw new NotFoundException("Deck", deckId);

            var user = deck.User;
            if (user == null)
                throw new NotFoundException("User for this deck not found", deck.UserId);

            var tier = user.ActiveSubscriptionTier;
            int cardsCreatedToday = 0;
            if (string.Equals(tier, "Basic", StringComparison.OrdinalIgnoreCase))
            {
                var today = DateTime.UtcNow.Date;
                cardsCreatedToday = await _context.Cards
                    .CountAsync(c => c.Deck.UserId == user.Id && c.CreatedAt >= today && !c.IsDeleted, cancellationToken);
            }

            var addedCount = 0;
            foreach (var cardDto in cardDtos)
            {
                if (string.Equals(tier, "Basic", StringComparison.OrdinalIgnoreCase) && (cardsCreatedToday + addedCount) >= 10)
                {
                    throw new ConflictException("You have reached your daily flashcard limit of 10. Please upgrade your subscription to add more flashcards.");
                }

                var card = new Card(deckId, cardDto.Front, cardDto.Back, cardDto.Explanation);
                _context.Cards.Add(card);
                addedCount++;
            }

            await _context.SaveChangesAsync(cancellationToken);
            return addedCount;
        }

        public async Task<CardDto> ReviewCardAsync(Guid cardId, int quality, CancellationToken cancellationToken)
        {
            var card = await _context.Cards
                .FirstOrDefaultAsync(c => c.Id == cardId && !c.IsDeleted, cancellationToken);
            
            if (card == null)
                throw new NotFoundException("Card", cardId);

            // Apply SM-2 Spaced Repetition logic encapsulated inside Domain Card Model
            card.Review(quality);

            await _context.SaveChangesAsync(cancellationToken);

            return new CardDto(
                card.Id,
                card.DeckId,
                card.Front,
                card.Back,
                card.Explanation,
                card.Repetitions,
                card.EasinessFactor,
                card.IntervalDays,
                card.NextReviewDate,
                card.LastReviewedAt
            );
        }

        public async Task DeleteDeckAsync(Guid deckId, CancellationToken cancellationToken)
        {
            var deck = await _context.Decks
                .Include(d => d.Cards)
                .FirstOrDefaultAsync(d => d.Id == deckId && !d.IsDeleted, cancellationToken);

            if (deck == null)
                throw new NotFoundException("Deck", deckId);

            deck.Delete();
            
            // Soft delete all child cards as well
            foreach (var card in deck.Cards)
            {
                card.Delete();
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteCardAsync(Guid cardId, CancellationToken cancellationToken)
        {
            var card = await _context.Cards
                .FirstOrDefaultAsync(c => c.Id == cardId && !c.IsDeleted, cancellationToken);

            if (card == null)
                throw new NotFoundException("Card", cardId);

            card.Delete();
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
