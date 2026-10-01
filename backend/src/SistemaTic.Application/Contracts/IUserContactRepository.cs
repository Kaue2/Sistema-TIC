using SistemaTic.Domain.Entities;
using SistemaTic.Application.DTO;

namespace SistemaTic.Application.Contracts;

public interface IUserContactRepository
{
    public Task<IEnumerable<UserContact>> GetByUserIdAsync(Guid userId);
    public Task<IReadOnlyDictionary<Guid, List<UserContact>>> GetByUserIdsAsync(IEnumerable<Guid> userIds);
    public Task<UserContact> CreateAsync(Guid userId, string contactType, string contactValue, string label, bool isPrimary);
    public Task<UserContact> UpsertPrimaryAsync(Guid userId, string contactType, string contactValue, string label);
    public Task ClearPrimaryAsync(Guid userId, string contactType);
}
