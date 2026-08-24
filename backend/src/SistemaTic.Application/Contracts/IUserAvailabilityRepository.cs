using SistemaTic.Domain.Entities;
using SistemaTic.Application.DTO;

namespace SistemaTic.Application.Contracts;

public interface IUserAvailabilityRepository
{
    public Task<IEnumerable<UserAvailability>> GetByUserIdAsync(Guid userId);
    public Task<UserAvailability> CreateAsync(Guid userId, short weekday, TimeOnly startsAt, TimeOnly endsAt);
    public Task<UserAvailability?> UpdateAsync(Guid id, UserAvailabilityDTO dto);
    public Task<bool> DeleteAsync(Guid id);
}
