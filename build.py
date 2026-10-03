#!/usr/bin/env python3
"""Injeta os módulos de src/ nas páginas, entre marcadores.

Os arquivos .html continuam autossuficientes (funcionam abertos direto do
disco e no GitHub Pages); o código novo é editado em src/ e copiado para
cada página rodando:  python3 build.py
"""
import re, pathlib

RAIZ = pathlib.Path(__file__).parent
PAGINAS = {
    'index.html': ['shell.css', 'financas-shell.css', 'nuvem.js', 'financas-nuvem.js',
                   'empresa.js', 'planejamento.js', 'financas-shell.js', 'app.js', 'tema.css'],
    'tarefas.html': ['shell.css', 'tarefas-shell.css', 'nuvem.js', 'tarefas-nuvem.js', 'tarefas-shell.js', 'app.js', 'tema.css'],
}

def bloco(nome):
    conteudo = (RAIZ / 'src' / nome).read_text(encoding='utf-8')
    if nome.endswith('.css'):
        return f'<style data-src="{nome}">\n{conteudo}</style>'
    return f'<script data-src="{nome}">\n{conteudo}</script>'

CABECA = '''<!-- v40:cabeca:inicio -->
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#4B1F39">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Jéssica B&amp;M">
<link rel="icon" type="image/png" sizes="32x32" href="icones/favicon-32.png">
<link rel="apple-touch-icon" href="icones/apple-touch-icon.png">
<!-- v40:cabeca:fim -->'''

for pagina, modulos in PAGINAS.items():
    caminho = RAIZ / pagina
    html = caminho.read_text(encoding='utf-8')
    novo = '<!-- v40:inicio (gerado por build.py a partir de src/; não editar aqui) -->\n'
    novo += '\n'.join(bloco(m) for m in modulos)
    novo += '\n<!-- v40:fim -->'
    padrao = re.compile(r'<!-- v40:inicio.*?<!-- v40:fim -->', re.S)
    if padrao.search(html):
        html = padrao.sub(lambda _: novo, html)
    else:
        i = html.rfind('</body>')
        html = html[:i] + novo + '\n' + html[i:]
    padrao_cab = re.compile(r'<!-- v40:cabeca:inicio.*?<!-- v40:cabeca:fim -->', re.S)
    if padrao_cab.search(html):
        html = padrao_cab.sub(lambda _: CABECA, html)
    else:
        i = html.find('>', html.find('<meta name="viewport"')) + 1
        html = html[:i] + '\n' + CABECA + html[i:]
    caminho.write_text(html, encoding='utf-8')
    print(f'{pagina}: {", ".join(modulos)}')
