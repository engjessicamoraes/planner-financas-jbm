# Finanças e Planner — Eng. Jéssica Moraes

O site tem duas páginas que compartilham o mesmo login e a mesma barra superior (**Pessoal | Empresa | Tarefas**):

- `index.html`: o Finanças, com as áreas Pessoal e Empresa (B&M);
- `tarefas.html`: o Planner de tarefas, hábitos e reuniões.

## Como o código novo está organizado

As melhorias da versão 40 ficam em `src/` e são copiadas para dentro das páginas pelo `build.py`. Dessa forma, as páginas continuam autossuficientes: funcionam no GitHub Pages e também abertas direto do computador. Depois de editar qualquer arquivo de `src/`, é preciso rodar o comando abaixo, porque é ele que atualiza o trecho entre os marcadores `<!-- v40:inicio -->` e `<!-- v40:fim -->` de cada página:

```
python3 build.py
```

| Arquivo | Função |
|---|---|
| `src/nuvem.js` | Motor de sincronização: escuta a nuvem em tempo real e mescla as alterações de cada aparelho item a item, sem sobrescrever o que foi feito em outro lugar. |
| `src/financas-nuvem.js`, `src/tarefas-nuvem.js` | Ligam o motor aos dados de cada página. |
| `src/financas-shell.js`, `src/financas-shell.css` | Barra superior, troca entre Pessoal e Empresa, Configurações, botão Lançar e barra inferior no celular. |
| `src/empresa.js` | Aba Empresa: Painel B&M, Despesas da empresa, Dívidas da empresa e Relatório mensal. |
| `src/planejamento.js` | Alertas de vencimento e metas dos cofrinhos. |
| `src/tarefas-shell.js`, `src/tarefas-shell.css` | Seletor de áreas no Planner e cartão de contas a vencer. |
| `src/shell.css` | Estilos comuns às duas páginas. |

## Aplicativo no celular e uso sem internet

O site pode ser instalado como aplicativo. No iPhone, abra no Safari, toque em Compartilhar e depois em "Adicionar à Tela de Início"; no Android, abra no Chrome e toque em "Instalar aplicativo". O `sw.js` guarda uma cópia das páginas e das bibliotecas, de modo que o site abre mais rápido e funciona sem internet: o que for lançado sem conexão fica no aparelho e é enviado à nuvem quando a conexão volta. Quando há internet, a versão mais nova das páginas é sempre buscada primeiro. Ao mudar a lista de arquivos guardados, aumente o número `VERSAO` no `sw.js`.

## Regras da aba Empresa

Uma despesa conta como da empresa quando está na categoria **Trabalho / Empresa** ou quando é marcada manualmente na tela Despesas da empresa. Os repasses da B&M são as entradas classificadas como salário que não vêm do SENGE. Já os contratos Pronampe, FGI e Mútua começam classificados como empresa, mas a classificação pode ser trocada em Empresa › Dívidas da empresa ou em Configurações, e a escolha vale em todos os aparelhos.
