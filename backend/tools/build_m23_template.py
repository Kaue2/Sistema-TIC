"""Create M2.3 from its original DOCX, preserving untouched package parts.

Uses the existing question/field mapping; does not change imports or the database.
"""
import argparse
import copy
import hashlib
import json
import posixpath
import re
import unicodedata
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

from lxml import etree as ET
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[2]
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}


def w(name):
    return '{' + NS['w'] + '}' + name


def text(element):
    return ''.join(element.xpath('.//w:t/text()', namespaces=NS))


def label_key(value):
    value = unicodedata.normalize('NFKD', value.casefold())
    return re.sub(r'[^a-z0-9]', '', value)


def paragraph_text(paragraph, value):
    properties = paragraph.find(w('pPr'))
    run_properties = paragraph.find('.//' + w('rPr'))
    for child in list(paragraph):
        if child is not properties:
            paragraph.remove(child)
    run = ET.SubElement(paragraph, w('r'))
    if run_properties is not None:
        run.append(copy.deepcopy(run_properties))
    node = ET.SubElement(run, w('t'))
    node.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    node.text = value


def wrap(element, tag):
    parent = element.getparent()
    index = parent.index(element)
    parent.remove(element)
    control = ET.Element(w('sdt'))
    properties = ET.SubElement(control, w('sdtPr'))
    ET.SubElement(properties, w('tag')).set(w('val'), tag)
    content = ET.SubElement(control, w('sdtContent'))
    content.append(element)
    parent.insert(index, control)
    return control


def xml_bytes(root):
    return ET.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)


def build(reference, workbook_path, output):
    original_hash = hashlib.sha256(reference.read_bytes()).hexdigest()
    with ZipFile(reference) as package:
        parts = {name: package.read(name) for name in package.namelist()}
    original_parts = dict(parts)
    document = ET.fromstring(parts['word/document.xml'])
    body = document.find(w('body'))
    paragraphs = lambda: body.findall(w('p'))
    with workbook_path.open('rb') as stream:
        sheet = load_workbook(stream, data_only=True)['2.3']
    labels = {str(row[1].value).strip(): str(row[2].value).strip()
              for row in sheet if row[1].value and row[2].value}
    mapping_sql = (ROOT / 'database/seeds/007_report_remaining_stages.sql').read_text(encoding='utf-8')
    mapping = dict(re.findall(r"\('(M2\.3_Q\d+)', '(2\.3 -\d+)'\)", mapping_sql))
    if len(mapping) != 17:
        raise ValueError('M2.3 must retain its existing 17 question mappings.')
    codes_by_label = {label_key(labels[field]): code for code, field in mapping.items()}

    stage = next(p for p in paragraphs() if text(p).strip().startswith('M2.3 -'))
    wrap(stage, 'report:stage')
    date = next(p for p in paragraphs() if text(p).startswith('São Paulo,'))
    paragraph_text(date, '{{report_date}}')
    wrap(date, 'report:date')

    # Replace cached source page numbers with a genuine, refreshable TOC field.
    summary = next(p for p in paragraphs() if text(p).strip() == 'SUMÁRIO')
    abstract_heading = next(p for p in paragraphs() if text(p).strip() == 'RESUMO')
    start, end = body.index(summary) + 1, body.index(abstract_heading)
    cached = list(body)[start:end]
    for element in cached:
        body.remove(element)
    for heading in paragraphs():
        if text(heading).strip() in ('SUMÁRIO', 'RESUMO', 'INTRODUÇÃO', 'OBJETIVOS', 'REFERÊNCIAS BIBLIOGRÁFICAS'):
            properties = heading.find(w('pPr'))
            if properties is None:
                properties = ET.Element(w('pPr'))
                heading.insert(0, properties)
            if properties.find(w('pageBreakBefore')) is None:
                position = 0
                while position < len(properties) and properties[position].tag in (w('pStyle'), w('keepNext'), w('keepLines')):
                    position += 1
                properties.insert(position, ET.Element(w('pageBreakBefore')))
    toc = ET.Element(w('p'))
    for kind in ('begin', 'instruction', 'separate', 'cache', 'end'):
        run = ET.SubElement(toc, w('r'))
        if kind == 'instruction':
            ET.SubElement(run, w('instrText')).text = ' TOC \\o "1-2" \\h \\z \\u '
        elif kind == 'cache':
            ET.SubElement(run, w('t')).text = 'RESUMO · INTRODUÇÃO · OBJETIVOS · DESENVOLVIMENTO · CONCLUSÃO · REFERÊNCIAS BIBLIOGRÁFICAS · ANEXOS'
        else:
            field = ET.SubElement(run, w('fldChar'))
            field.set(w('fldCharType'), kind)
            if kind == 'begin':
                field.set(w('dirty'), 'true')
    body.insert(start, toc)

    # Keep the institutional scope, without claiming results from the sample offer.
    abstract = body[body.index(abstract_heading) + 1]
    while not text(abstract).strip():
        abstract = body[body.index(abstract) + 1]
    paragraph_text(abstract, 'O relatório apresentado integra a Meta M2.3 – Acompanhar os estudantes (frequência, desempenho e aprendizagem), conforme diretrizes da Nota Técnica nº 52/2024/GT PPI/SOFTEX. Seu objetivo é registrar o progresso dos estudantes nas trilhas selecionadas, reunindo os dados cadastrados sobre frequência, desempenho acadêmico, participação, avaliações e acompanhamento pedagógico. As informações apresentadas apoiam a identificação de dificuldades e o planejamento de melhorias nas capacitações.')

    table = body.find(w('tbl'))
    # Keep the encoded appearance while removing redundant Office 2010 hints.
    for look in table.findall('.//' + w('tblLook')):
        for attribute in list(look.attrib):
            if attribute != w('val'):
                del look.attrib[attribute]
    development = next(p for p in paragraphs() if text(p).strip() == 'DESENVOLVIMENTO')
    introduction = body[body.index(development) + 1]
    trail_source = body[body.index(table) - 1]
    trail_title = copy.deepcopy(trail_source)
    # The paragraphs between the general introduction and table name sample offers.
    for element in list(body)[body.index(introduction) + 1:body.index(table)]:
        body.remove(element)
    body.insert(body.index(table), trail_title)
    paragraph_text(trail_title, '{{track_title}}')
    properties = trail_title.find(w('pPr'))
    if properties is None:
        properties = ET.SubElement(trail_title, w('pPr'))
    style = properties.find(w('pStyle'))
    if style is None:
        style = ET.Element(w('pStyle'))
        properties.insert(0, style)
    style.set(w('val'), 'Heading2')
    title_control = wrap(trail_title, 'track:title')
    repeating = wrap(title_control, 'report:trails')
    repeating.find(w('sdtContent')).append(table)
    # Reserve space below the source logo on continued landscape table pages.
    for section in document.findall('.//' + w('sectPr')):
        size = section.find(w('pgSz'))
        if size is not None and size.get(w('orient')) == 'landscape':
            section.find(w('pgMar')).set(w('top'), '2041')  # 3.6 cm
    rows = table.findall(w('tr'))
    header_properties = rows[0].find(w('trPr'))
    if header_properties is None:
        header_properties = ET.SubElement(rows[0], w('trPr'))
    ET.SubElement(header_properties, w('tblHeader'))
    for cell, value in zip(rows[0].findall(w('tc')), ('Pergunta Softex', 'Resposta cadastrada', 'Evidência')):
        paragraph_text(cell.find(w('p')), value)
    found = set()
    for row in rows[1:]:
        row_properties = row.find(w('trPr'))
        if row_properties is None:
            row_properties = ET.Element(w('trPr'))
            row.insert(0, row_properties)
        if row_properties.find(w('cantSplit')) is None:
            row_properties.insert(0, ET.Element(w('cantSplit')))
        cells = row.findall(w('tc'))
        code = codes_by_label[label_key(text(cells[0]))]
        if code in found:
            raise ValueError('Duplicate question: ' + code)
        found.add(code)
        for cell, tag, value in zip(cells, ('label:', 'answer:', 'evidence:'), (labels[mapping[code]], '-', '')):
            paragraph = cell.find(w('p'))
            for child in list(cell):
                if child.tag != w('tcPr') and child is not paragraph:
                    cell.remove(child)
            paragraph_text(paragraph, value)
            wrap(paragraph, tag + code)
    if found != set(mapping):
        raise ValueError('Missing source questions: ' + str(set(mapping) - found))
    # Source bookmark identifiers must not be cloned for multiple selected trails.
    for node in repeating.xpath('.//w:bookmarkStart | .//w:bookmarkEnd', namespaces=NS):
        node.getparent().remove(node)

    conclusion_heading = next(p for p in paragraphs() if text(p).strip() == 'CONCLUSÃO')
    conclusion = body[body.index(conclusion_heading) + 1]
    paragraph_text(conclusion, 'As trilhas selecionadas são apresentadas em seus respectivos blocos de descrição. Os registros de frequência, desempenho, participação e acompanhamento pedagógico cadastrados no sistema constituem a base deste relatório. Essas informações apoiam a análise do processo de aprendizagem e a definição de ações de melhoria, conforme os dados apresentados em cada trilha.')

    annex_heading = next(p for p in paragraphs() if text(p).strip() == 'Anexos')
    # Remove sample annexes, including their section breaks and embedded pictures.
    for element in list(body)[body.index(annex_heading) + 1:]:
        if element.tag != w('sectPr'):
            body.remove(element)
    annex_placeholder = ET.Element(w('p'))
    body.insert(body.index(annex_heading) + 1, annex_placeholder)
    wrap(annex_placeholder, 'report:annexes')
    parts['word/document.xml'] = xml_bytes(document)
    settings = ET.fromstring(parts['word/settings.xml'])
    update = settings.find(w('updateFields'))
    if update is None:
        update = ET.Element(w('updateFields'))
        following = {w(name) for name in ('hdrShapeDefaults', 'footnotePr', 'endnotePr', 'compat', 'docVars', 'rsids', 'mathPr', 'themeFontLang', 'clrSchemeMapping')}
        position = next((index for index, node in enumerate(settings) if node.tag in following), len(settings))
        settings.insert(position, update)
    update.set(w('val'), 'true')
    parts['word/settings.xml'] = xml_bytes(settings)
    # The source footer tables carry the same version-specific appearance hints.
    for name, data in list(parts.items()):
        if name.startswith('word/') and name.endswith('.xml') and name not in ('word/document.xml', 'word/settings.xml'):
            root = ET.fromstring(data)
            changed = False
            for look in root.findall('.//' + w('tblLook')):
                for attribute in list(look.attrib):
                    if attribute != w('val'):
                        del look.attrib[attribute]
                        changed = True
            if changed:
                parts[name] = xml_bytes(root)

    relationships = ET.fromstring(parts['word/_rels/document.xml.rels'])
    used_ids = {value for node in document.iter() for key, value in node.attrib.items() if key.startswith('{' + NS['r'] + '}')}
    for relation in list(relationships):
        if relation.get('Type', '').endswith('/image') and relation.get('Id') not in used_ids:
            relationships.remove(relation)
    parts['word/_rels/document.xml.rels'] = xml_bytes(relationships)
    referenced_media = set()
    for name, data in parts.items():
        if name.endswith('.rels'):
            for relation in ET.fromstring(data):
                if relation.get('Type', '').endswith('/image'):
                    base = posixpath.dirname(posixpath.dirname(name))
                    referenced_media.add(posixpath.normpath(posixpath.join(base, relation.get('Target'))))
    for name in list(parts):
        if name.startswith('word/media/') and name not in referenced_media:
            del parts[name]
    # Preserve all styles, numbering, header/footer geometry and bibliography parts.
    core = ET.fromstring(parts['docProps/core.xml'])
    for node in core:
        if ET.QName(node).localname in ('creator', 'lastModifiedBy'):
            node.text = 'Senac'
        elif ET.QName(node).localname == 'title':
            node.text = 'Relatório de prestação de contas Softex Meta M2.3'
    parts['docProps/core.xml'] = xml_bytes(core)
    content_types = ET.fromstring(parts['[Content_Types].xml'])
    for item in list(content_types):
        if item.get('PartName') and item.get('PartName').lstrip('/') not in parts:
            content_types.remove(item)
    if len(content_types) != len(ET.fromstring(original_parts['[Content_Types].xml'])):
        parts['[Content_Types].xml'] = xml_bytes(content_types)
    output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(output, 'w', compression=ZIP_DEFLATED) as package:
        for name, data in parts.items():
            package.writestr(name, data)
    if hashlib.sha256(reference.read_bytes()).hexdigest() != original_hash:
        raise ValueError('The reference document changed.')
    print(json.dumps({'template': str(output), 'questions': len(found),
                      'sections': len(document.findall('.//' + w('sectPr'))),
                      'media_parts': len([p for p in parts if p.startswith('word/media/')]),
                      'preserved_parts': len([p for p in parts if parts[p] == original_parts[p]])}, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--reference', type=Path, required=True)
    parser.add_argument('--workbook', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=ROOT / 'backend/src/SistemaTic.Api/Templates/Softex/2.3.docx')
    args = parser.parse_args()
    build(args.reference, args.workbook, args.output)
