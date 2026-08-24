using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public interface IKnowledgeAreaRepository
{
    public Task<IEnumerable<KnowledgeArea>> GetActiveAsync();
}
