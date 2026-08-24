using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public interface IRoleRepository
{
    public Task<IEnumerable<Roles>> GetAllAsync();
    public Task<Roles?> GetByCodeAsync(string code);
}
