namespace SistemaTic.Application.Contracts;

public record PublishedDocumentTemplate(Guid DocumentTemplateId, Guid TemplateVersionId);

public interface IDocumentTemplateRepository
{
    public Task<IEnumerable<PublishedDocumentTemplate>> GetActivePublishedAsync();
}
