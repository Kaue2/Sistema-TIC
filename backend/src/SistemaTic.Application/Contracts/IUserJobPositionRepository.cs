using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public interface IUserJobPositionRepository
{
    public Task<UserJobPosition?> GetCurrentAsync(Guid userId);
    public Task<IEnumerable<UserJobPosition>> GetHistoryAsync(Guid userId);
    public Task<UserJobPosition> AssignAsync(Guid userId, Guid jobPositionId, DateOnly startsOn, string? notes, Guid? createdByUserId);
}
