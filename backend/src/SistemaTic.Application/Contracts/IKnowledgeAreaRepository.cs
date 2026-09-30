using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public interface IKnowledgeAreaRepository
{
    public Task<IEnumerable<KnowledgeArea>> GetActiveAsync();
    public Task<KnowledgeArea?> GetByIdAsync(Guid id);
    public Task<IEnumerable<KnowledgeArea>> GetByIdsAsync(IEnumerable<Guid> ids);
}
