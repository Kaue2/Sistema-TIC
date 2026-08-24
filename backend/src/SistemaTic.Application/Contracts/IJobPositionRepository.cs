using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public interface IJobPositionRepository
{
    public Task<IEnumerable<JobPosition>> GetActiveAsync();
}
