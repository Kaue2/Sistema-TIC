using SistemaTic.Domain.Entities;
using SistemaTic.Application.DTO;

namespace SistemaTic.Application.Contracts;

public interface IUserContactRepository
{
    public Task<IEnumerable<UserContact>> GetByUserIdAsync(Guid userId);
    public Task<UserContact> CreateAsync(Guid userId, string contactType, string contactValue, string label, bool isPrimary);
}
