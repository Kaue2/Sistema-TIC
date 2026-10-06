# Relatórios Softex

Os oito DOCX são os modelos da exportação por meta. Capa, seções institucionais,
referências, logo, cabeçalhos, rodapés e orientações são preservados ao preencher o arquivo.
Uma meta produz um DOCX com todas as trilhas selecionadas; várias metas produzem um ZIP.

## Contrato dos controles de conteúdo

- `report:stage`: identificação institucional da entrega.
- `report:date`: cidade e data de geração no fuso `America/Sao_Paulo`.
- `report:overview`: apresentação das trilhas, quando prevista pelo modelo.
- `report:trails`: bloco repetido por documento/trilha, contendo `track:title` e a tabela.
- `label:M1.13_Q01`: pergunta identificada pelo código estável no catálogo.
- `answer:M1.13_Q01`: resposta editável cadastrada, ou `-` se estiver vazia.
- `fixed:M1.13_Q01`: resposta institucional; variáveis ausentes recebem `-`.
- `evidence:M1.13_Q01`: somente títulos dos anexos vinculados à pergunta.
- `report:annexes`: imagens dos anexos citados nessa meta, deduplicados por ID.

Cada linha deve conter um controle de pergunta, um de resposta e um de evidência com o
mesmo código. Os códigos devem coincidir com as perguntas ativas da meta no catálogo.
O exportador valida o modelo e o resultado com OpenXML, e falha se faltar qualquer imagem
citada. Não exporta arquivos parciais. A atualização do sumário e da paginação está
habilitada ao abrir o DOCX em um editor que atualize campos Word.

Os textos específicos foram extraídos dos PDFs de referência. Nomes, datas, quantidades
e resultados das trilhas de exemplo foram removidos. Os campos editáveis usam os vínculos
`softex_field_id` existentes; o seed `008_report_question_labels.sql` atualiza somente
os rótulos do catálogo do relatório. O importador e o formulário da planilha não são alterados.

## API e validação

`GET /api/reports/softex/stages` retorna `{ code, name, canExport }` para todas as metas
ativas para a seleção da exportação. A importação mantém as nove etapas fixas, com meta,
tipo e título predefinidos, e consulta os anexos de cada etapa em
`GET /api/documents/{documentId}/attachments/stages/{stageCode}`. O vínculo automático
com as perguntas continua usando a matriz existente. Apenas metas com modelo
válido podem ser exportadas. Os POSTs existentes preservam `stageCodes` e `documentIds`;
o nome do download vem de `Content-Disposition`, exposto no CORS.

Para reconstruir os modelos a partir das mesmas fontes (não é necessário para publicar):

```powershell
python backend/tools/build_softex_templates.py --references <pasta-dos-PDFs> --workbook <TRILHA_1.XLS>
```

O comando acima reconstrói os sete modelos baseados nos PDFs. O modelo M2.3 preserva o
DOCX original do relatório completo encontrado junto do descritivo Anexo 12:

```powershell
python backend/tools/build_m23_template.py --reference <relatorio-M2.3.docx> --workbook <TRILHA_1.XLS>
```

Na `TRILHA_1.XLS` enviada existem 14 metas. Possuem modelo M1.13, M1.14, M1.15,
M2.1, M2.2, M2.3, M2.4 e M2.6. Faltam modelos para M1.18, M1.19, M1.20,
M2.5, M2.9 e M2.10. As metas M2.9 e M2.10 também não estão no catálogo atual
do sistema; a planilha de detalhamento incluída na pasta de documentos contém
somente as outras 12 metas. Os arquivos `__MACOSX/._*.docx` são metadados AppleDouble,
e não documentos Word utilizáveis como modelo.

A configuração do projeto copia os DOCX para o build e a publicação da API.
Para ativar as mudanças na instância em execução, aplique os seeds pela rotina de migrations
do repositório e reinicie a API com o novo build.
