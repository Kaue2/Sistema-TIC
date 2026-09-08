using Npgsql;
using SistemaTic.Application.Contracts;

namespace SistemaTic.Infrastructure.Repositories;

public class DocumentTemplateRepository : IDocumentTemplateRepository
{
    private readonly NpgsqlDataSource _dataSource;
    public DocumentTemplateRepository(NpgsqlDataSource dataSource)
    {
        this._dataSource = dataSource;
    }

    public async Task<IEnumerable<PublishedDocumentTemplate>> GetActivePublishedAsync()
    {
        List<PublishedDocumentTemplate> templates = new List<PublishedDocumentTemplate>();

        await using var cmd = _dataSource.CreateCommand();
        cmd.CommandText = """
            SELECT DISTINCT ON (dtv.document_template_id)
                   dtv.document_template_id,
                   dtv.id
              FROM document_template_versions dtv
              JOIN document_templates dt ON dt.id = dtv.document_template_id
             WHERE dt.is_active
               AND dtv.is_published
             ORDER BY dtv.document_template_id, dtv.version DESC;
        """;

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            templates.Add(new PublishedDocumentTemplate(reader.GetGuid(0), reader.GetGuid(1)));
        }
        return templates;
    }
}
