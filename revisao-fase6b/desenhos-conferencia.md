# Fase 6b: conferência das telas de apresentação com as decisões

Conferência feita só com leitura. Nenhum desenho e nenhum arquivo do design system foi alterado.

- **Base:** `revisao-fase6b/decisoes.md` e `revisao-fase6b/planejamento.md` (commit `5a35101`).
- **Como conferi:**
  - abri uma cópia dos arquivos `.figcraft` fora do repositório e li a árvore de camadas de cada quadro, com os textos visíveis;
  - comparei com as imagens exportadas em `erp-decroqui/design/`.
- **Arquivos Figcraft encontrados:**

  | Arquivo | Conteúdo |
  |---|---|
  | `erp-decroqui/design/moldura-erp.figcraft` | Página "ERP · Telas", com 96 quadros. É o único com telas de apresentação |
  | `D:\De.Croqui Design System Oficial\Tela de testes.figcraft` | Um quadro, "Home — teste mobile". Sem apresentação |
  | `D:\De.Croqui Design System Oficial\figcraft-teste\tela-mobile-teste.figcraft` | Um quadro, "Home — Mobile". Sem apresentação |

## 1. Telas de apresentação que existem

Todas estão em `erp-decroqui/design/moldura-erp.figcraft`, página "ERP · Telas". As capturas exportadas estão em `erp-decroqui/design/`.

| Nº | Quadro no Figcraft (ID) | Tamanho | Captura |
|---|---|---|---|
| T1 | ERP · Editor de apresentação · 1440 (2668) | 1440 × 900 | `erp-editor-apresentacao-1440.png` |
| T2 | ERP · Editor de apresentação · 1024 (3264) | 1024 × 768 | `erp-editor-apresentacao-1024.png` |
| T3 | ERP · Editor de apresentação · 1440 · rolagem completa (2043) | 1440 × 7501 | `erp-editor-apresentacao-1440-rolagem-completa.png` |
| T4 | Painel · aba Projeto (3860) | 480 × 1233 | `erp-editor-apresentacao-abas-projeto-e-paginas.png` (lado esquerdo) |
| T5 | Painel · aba Páginas (3927) | 480 × 1271 | `erp-editor-apresentacao-abas-projeto-e-paginas.png` (lado direito) |

**Outras telas que mostram algo da apresentação:**

| Quadros | O que mostram |
|---|---|
| "ERP · Projeto aberto · 1440 ·" com 7 variações (IDs 11751, 24495, 24765, 13077, 12836, 12246, 12515) | Filtro "Apresentações · 1" nos arquivos do projeto e um PDF de exemplo chamado "Apresentação - Casa Alecrim - 30-10-2026.pdf" |
| Dashboard 1440 e 1024, com estados vazios (8816, 9269, 9726) | O bloco "Apresentações recentes" |
| Todas as telas | O item "Apresentação" no menu lateral |

## 2. Conferência

| Tela | Situação | Motivo | Decisão que se aplica |
|---|---|---|---|
| T1 · Editor 1440 | REFAZER | <ul><li>Mostra o exemplo de 11 páginas; a 6b começa só com a capa.</li><li>Botão "Novo" no painel do editor.</li><li>Botão "Exportar PDF".</li><li>Texto "Edite aqui ou clique nos textos e imagens da página" (edição direta).</li><li>Capa preenchida com nome e contato de pessoa real (projetista e telefone).</li><li>Botões Duplicar página e Excluir página.</li></ul>A capa (composição, cor, marca e espaço de imagem) pode ser aproveitada | Criação: só a capa, documento zerado. "Novo" só na lista. "Salvar em PDF". Edição direta na 6e. Exemplos fictícios. Duplicar e excluir página na 6c |
| T2 · Editor 1024 | REFAZER | Os mesmos pontos de T1. Zoom de 53% | As mesmas de T1 |
| T3 · Editor 1440, rolagem completa | REFAZER | <ul><li>Mostra as 11 páginas: texto & conceito, moodboard, apresentação visual, desenho técnico, notas e direitos autorais (6c).</li><li>O desenho técnico (páginas 08 e 09) tem um carimbo com Escala, Unidade e Folha.</li><li>Tem os mesmos pontos de T1.</li></ul> | Tipos de página na 6c. Desenho técnico só com imagem e escala digitada, sem carimbo automático |
| T4 · Painel, aba Projeto | REFAZER | <ul><li>Botão "Novo" no painel.</li><li>Texto "Aparecem na capa, nos rodapés e no carimbo das pranchas técnicas".</li><li>Campos com valor de fábrica: tipo, projetista e contato reais, marca e data.</li><li>Exemplo "Apartamento Gregorio", sobrenome que vem do arquivo offline.</li></ul>A estrutura dos 11 campos e a lista "Formato da página" (só A4 na 6b) podem ser aproveitadas | "Novo" só na lista. Sem carimbo nem prancha na 6b. Documento zerado, com nome, cliente e localização copiados do projeto. Exemplos fictícios. A3 e 16:9 na 6d |
| T5 · Painel, aba Páginas | REFAZER | <ul><li>Lista as 11 páginas de exemplo.</li><li>Botões para adicionar "Desenho técnico" e "Prancha de detalhamento".</li><li>↑ ↓ Duplicar ×.</li><li>Botão "Novo".</li></ul>Na 6b, a aba mostra só a capa | Prancha na 6d. Tipos de página e aba Páginas completa na 6c. "Novo" só na lista |
| Projeto aberto, 7 variações | AJUSTAR | <ul><li>O PDF de exemplo se chama "Apresentação - Casa Alecrim - 30-10-2026.pdf". O padrão decidido é `Apresentacao-<número>-<nome>-<data>.pdf`.</li><li>Não há botão "Nova apresentação" (ver 6b-03).</li></ul>O filtro "Apresentações" está certo, porque o PDF aparece em Arquivos | Nome do PDF no padrão do orçamento (P7, P15). Imagens não aparecem em Arquivos; o PDF aparece |
| Dashboard, "Apresentações recentes" | OK | Lista o que foi editado. Não conflita com nenhuma decisão. Não faz parte da 6b | — |
| Menu lateral, "Apresentação" | OK | O item já existe e leva à lista | Lista em `/apresentacoes` |
| 6b-01 · Lista de apresentações com abas Todas e Sem projeto e estado vazio | FALTA | Não existe tela de lista de apresentações | Aba Sem projeto; "Novo" só na lista |
| 6b-02 · Nova apresentação avulsa, com nome obrigatório | FALTA | Não existe | Nome obrigatório; apresentação avulsa |
| 6b-03 · Projeto com botão "Nova apresentação" e painel | FALTA | As telas do projeto só têm "Novo orçamento" | Nada é criado sozinho; dados do projeto copiados como texto editável |
| 6b-04 · Editor novo, só com a capa, salvo | FALTA | Sai do que for aproveitado de T1, T4 e T5 | Documento zerado só com a capa; "Salvo às" |
| 6b-05 · Erro ao salvar, alterado em outra aba, documento acima de 512 KB | FALTA | Existem só para o orçamento | Salvamento automático; limite de 512 KB com mensagem clara |
| 6b-06 · Espaço de imagem em todos os estados | FALTA | Só existe o estado vazio ("Clique ou arraste · PNG, JPG, WebP"). Faltam enviando, enviado, erro e imagem ausente | Envio direto ao Drive; limites de 40 MB e 4000 px |
| 6b-07 · Ferramentas sobre a imagem | FALTA | Não existe | Remover e trocar só tiram o vínculo; sem a ferramenta Escala |
| 6b-08 · Avisos de envio | FALTA | Não existe | Formatos e limites de imagem |
| 6b-09 · Biblioteca de imagens do projeto e da avulsa | FALTA | Não existe | Biblioteca do projeto; biblioteca própria de cada avulsa (P23) |
| 6b-10 · Vincular avulsa a projeto | FALTA | Não existe | Vínculo com as imagens e o PDF movidos (P27) |
| 6b-11 · Diálogo de exportar com o aviso de "Tamanho real", e os estados do PDF | FALTA | Não existe diálogo de exportar, e o aviso de "Tamanho real" não aparece em nenhuma tela | "Salvar em PDF"; aviso no diálogo de exportar, em qualquer apresentação (P25) |
| 6b-12 · Leitor | FALTA | Não existe | Leitor só vê e baixa o PDF |
| 6b-13 · Celular 390: lista, visualização e PDF | FALTA | Não existe nenhuma tela de apresentação em 390 | No celular: lista, visualização e PDF, sem edição |

## 3. Verificações pedidas

| Verificação | Resultado |
|---|---|
| Escala, cota, carimbo automático ou medição em tela da 6b | **Há carimbo.** As páginas 08 e 09 (desenho técnico) de T1, T2 e T3 têm um carimbo com Escala, Unidade e Folha, e T4 cita "o carimbo das pranchas técnicas". Não há medição de cota, DPI, escala gráfica nem ferramenta Escala em nenhuma tela |
| Prancha de detalhamento como tela da 6b | **Aparece** como botão de adicionar página em T5. Não há tela da prancha |
| Botão de edição direta na folha | **Não há botão,** mas T1, T2 e T3 dizem "Edite aqui ou clique nos textos e imagens da página", que descreve a edição direta (6e) |
| Botão de exportação "Salvar em PDF" | **Não.** As telas de apresentação usam "Exportar PDF". O "Salvar em PDF" só aparece nas telas do orçamento |
| Botão "Novo" dentro do editor | **Sim,** no topo do painel, em T1 a T5 |
| Controles de edição no celular | **Não se aplica:** não existe tela de apresentação em 390 |
| Aviso de "Tamanho real" no diálogo de exportar | **Não.** Não existe diálogo de exportar nem o aviso |

## 4. Contagem

| Situação | Quantidade |
|---|---|
| OK | 2 (dashboard e menu lateral) |
| AJUSTAR | 1 (telas do projeto aberto, 7 variações) |
| REFAZER | 5 (T1 a T5) |
| FALTA | 13 (6b-01 a 6b-13) |

## 5. Pontos que precisam de decisão antes de mexer

1. **T1 a T5:** refazer a partir das telas atuais, aproveitando a capa, a moldura do editor e a estrutura dos campos, ou desenhar do zero?
2. **Botão "Prévia":** está em T1 e T2, ao lado de "Exportar PDF". As decisões falam em "visualização", mas não dizem se o modo Prévia continua na 6b.
3. **"Voltar para Projetos":** T1 e T2 voltam para Projetos. Com a lista de apresentações, o retorno vai para a lista, para o projeto de onde se veio, ou para os dois, conforme a origem?
4. **T3 e T5:** guardar como referência para a 6c (tipos de página) depois de tirar o carimbo, ou refazer na própria 6c?
