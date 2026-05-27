using Immersio.Application.Interfaces;
using Immersio.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Immersio.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext, IApplicationDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<PasswordResetCode> PasswordResetCodes => Set<PasswordResetCode>();
        public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
        public DbSet<Deck> Decks => Set<Deck>();
        public DbSet<Card> Cards => Set<Card>();
        public DbSet<Scenario> Scenarios => Set<Scenario>();
        public DbSet<ScenarioItem> ScenarioItems => Set<ScenarioItem>();
        public DbSet<ScenarioSession> ScenarioSessions => Set<ScenarioSession>();
        public DbSet<SessionMessage> SessionMessages => Set<SessionMessage>();
        public DbSet<UserPronunciationLog> UserPronunciationLogs => Set<UserPronunciationLog>();
        public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        }
    }
}
