using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Immersio.Application.DTOs.Admin;
using Immersio.Application.DTOs.Auth;

namespace Immersio.Application.Interfaces
{
    public interface IAdminService
    {
        Task<AdminDashboardStatsDto> GetDashboardStatsAsync(CancellationToken cancellationToken);
        Task<IEnumerable<UserDto>> GetUsersAsync(CancellationToken cancellationToken);
        Task<UserDto> UpdateUserSubscriptionAsync(Guid userId, string tier, string cycle, CancellationToken cancellationToken);
        Task<bool> BanUserAsync(Guid userId, CancellationToken cancellationToken);
        Task<SystemSettingsDto> GetAiSettingsAsync(CancellationToken cancellationToken);
        Task SaveAiSettingsAsync(SystemSettingsDto settings, CancellationToken cancellationToken);
    }
}
