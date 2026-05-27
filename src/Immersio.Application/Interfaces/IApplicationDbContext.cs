using Immersio.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Immersio.Application.Interfaces
{
    public interface IApplicationDbContext
    {
        DbSet<User> Users { get; }
        DbSet<RefreshToken> RefreshTokens { get; }
        DbSet<PasswordResetCode> PasswordResetCodes { get; }
        DbSet<Deck> Decks { get; }
        DbSet<Card> Cards { get; }
        DbSet<Scenario> Scenarios { get; }
        DbSet<ScenarioItem> ScenarioItems { get; }
        DbSet<ScenarioSession> ScenarioSessions { get; }
        DbSet<SessionMessage> SessionMessages { get; }
        DbSet<UserPronunciationLog> UserPronunciationLogs { get; }
        DbSet<SystemSetting> SystemSettings { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
