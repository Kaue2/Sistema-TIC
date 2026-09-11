namespace SistemaTic.Application.Contracts;

public record PublishedDocumentTemplate(Guid DocumentTemplateId, Guid TemplateVersionId);
public record DocumentTemplateSummary(Guid Id, string Code, string Name);

public interface IDocumentTemplateRepository
{
    public Task<IEnumerable<PublishedDocumentTemplate>> GetActivePublishedAsync();
    public Task<DocumentTemplateSummary?> GetByIdAsync(Guid id);
}
