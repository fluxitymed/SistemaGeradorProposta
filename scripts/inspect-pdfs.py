"""Renderiza TODAS as páginas e verifica texto selecionável, A4 e limites.

Uso: python scripts/inspect-pdfs.py [caminho-do-pdf-original]
Requer PyMuPDF (global ou instalado em .tools/pymupdf).
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tools' / 'pymupdf'))
import pymupdf

artifacts = ROOT / 'artifacts' / 'validation'
reports = []
def normalize(value):
    for label in ['www.fluxity.com.br', 'PROPOSTA', '•']:
        value = value.replace(label, '')
    return re.sub(r'\s+', '', value)

for pdf in sorted(artifacts.glob('*.pdf')):
    document = pymupdf.open(pdf)
    output = artifacts / pdf.stem
    output.mkdir(exist_ok=True)
    text = ''
    for number, page in enumerate(document, 1):
        assert abs(page.rect.width - 595.28) < 1 and abs(page.rect.height - 841.89) < 1, 'Página fora do formato A4'
        text += page.get_text()
        page.get_pixmap(matrix=pymupdf.Matrix(1.4, 1.4)).save(str(output / f'page-{number}.png'))
        blocks = page.get_text('dict', flags=0)['blocks']
        for block in blocks:
            for line in block.get('lines', []):
                for span in line.get('spans', []):
                    x0, y0, x1, y1 = span['bbox']
                    assert x0 >= 0 and y0 >= 0 and x1 <= page.rect.width + 1 and y1 <= page.rect.height + 1, (pdf.name, number, span['text'])
        assert page.get_text().strip(), 'Página sem texto selecionável'
    (output / 'text.txt').write_text(text, encoding='utf-8')
    if pdf.name.startswith('Proposta-Google-Ads-'):
        assert 'Atrasos no pagamento implicarão no congelamento do serviço.' in text
        assert '15% sobre o valor excedente.' in text
        assert '30 dias,' in text
    reports.append({'file': pdf.name, 'pages': len(document), 'a4': True, 'selectableText': True, 'pageBounds': True})
    if pdf.name == 'Proposta-Google-Ads-Dra-Daniela.pdf':
        assert 'Dra. Daniela' in text
        assert 'R$ 1.000,00' in text.replace('\u00a0', ' ')
        assert 'Pagamento antecipado, no momento de início dos serviços.' in text
        if len(sys.argv) > 1:
            original = pymupdf.open(sys.argv[1])
            expected = ''.join(page.get_text() for page in original)
            expected = expected.replace('Google ADS', 'Google Ads').replace('Planilha para o cliente para o cliente', 'Planilha para o cliente').replace('Não se responsabiliza resultados', 'Não se responsabiliza por resultados')
            assert normalize(text) == normalize(expected), 'Conteúdo diverge do original além das correções autorizadas'
            reports[-1]['originalContentPreserved'] = True
        baseline = ROOT / 'artifacts' / 'baseline' / 'google-ads.pdf'
        if baseline.exists():
            previous = pymupdf.open(baseline)
            assert len(document) == len(previous), 'Google Ads mudou o número de páginas'
            for current_page, old_page in zip(document, previous):
                assert current_page.get_text() == old_page.get_text(), 'Google Ads mudou o texto'
                assert current_page.get_pixmap().samples == old_page.get_pixmap().samples, 'Google Ads mudou visualmente'
            reports[-1]['googleAdsPixelIdentical'] = True
    if pdf.name.startswith('Proposta-Gestao-Aquisicao-Comercial-'):
        data = json.loads((artifacts / 'acquisition-expected.json').read_text(encoding='utf-8'))
        template = data['template']
        for group in template['serviceGroups']:
            assert normalize(group['title']) in normalize(text)
            for item in group['items']:
                assert normalize(item) in normalize(text), item
        for item in template['supplyLimits'] + template['observations'] + [template['serviceStart'], template['investmentDescription']]:
            assert normalize(item) in normalize(text), item
        assert 'R$ 2.000,00' in text.replace('\u00a0', ' ')
        assert '21 de setembro' not in text
        assert '15% sobre' not in text
        assert 'congelamento' not in text
        assert 'undefined' not in text
        assert '(71) 99739 8412' in text
        long_case = pdf.stem.endswith('Nome-Longo')
        assert normalize(data['longClient' if long_case else 'client']) in normalize(text)
        for line in data['multiline' if long_case else 'terms'].splitlines():
            assert normalize(line) in normalize(text), line
        reports[-1]['newProductContentPreserved'] = True
(artifacts / 'pdf-inspection.json').write_text(json.dumps(reports, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(reports, ensure_ascii=False, indent=2))
