# Fase 6c: Apresentação, tipos de página — planejamento

Este documento é só planejamento. Nesta etapa não houve código, teste, migração, merge, deploy nem alteração no Supabase ou na Vercel.

- **Situação:** desenhos 6c-01 a 6c-21 aprovados em 2026-11-08. E0 aprovada em 2026-11-08, com as respostas às perguntas P29 a P37 (seção 9). As etapas seguintes dependem de aprovação, uma de cada vez.
- **Branch:** `feat/fase-6c-apresentacao`, criada da `main` do GitHub em `410d29c` (6b em produção). Só existe no computador: sem push, porque um push gera uma prévia na Vercel.
- **Desenhos:** `design/moldura-erp.figcraft`, página "ERP · Telas", a partir de y = 41.400; capturas em `revisao-fase6c/desenhos/`.
- **Decisões:** `revisao-fase6b/decisoes.md` (divisão da fase: 6c = tipos de página, sem ferramentas de escala) e `revisao-fase6b/encerramento.md` (pendências para a 6c).
- **Lido:**
  - `revisao-fase6b/planejamento.md` e `revisao-fase6b/encerramento.md`;
  - o arquivo offline `templates/apresentacao/Apresentacao.dc.html` (`AP_TYPES`, `AP_LAYOUTS`, `AP_PF`, `AP_LISTS`, `AP_ITEMF`, `AP_TL`, `AP_COUNT`, `apNewPage`);
  - o código da 6b: `src/shared/presentation-data.ts`, `src/presentation/cover.ts`, `src/presentation/CoverSheet.tsx`, `src/pages/presentations/PresentationEditorPage.tsx`, `api/_app/routes/presentations.ts`, `api/_app/presentation-pdf.ts`, `api/_app/presentation-images.ts` e `api/_app/drive.ts`.

## 0. O que entra e o que fica fora

### 0.1 Entra na 6c

- **Capa:** as composições Imagem lateral inteira e Só tipografia, as cores Noite e Linho e as marcas Média e Grande (6c-01 a 6c-11). Os três seletores da aba Página da capa deixam de ser fixos.
- **Tipos de página:** Texto & conceito, Moodboard de materiais, Apresentação visual, Desenho técnico, Notas técnicas e Direitos autorais, com as composições do arquivo offline (6c-12 a 6c-20).
- **Aba Páginas:** adicionar, ordenar com ↑ ↓ e remover páginas (6c-21). A capa fica sempre em primeiro e não é removida, movida nem duplicada.
- **Visualização:** navegação ‹ › entre as páginas e "Página NN de T", no editor, na leitura (6b-12) e no celular (6b-13).
- **PDF:** todas as páginas, com a mesma capa, o mesmo nome, as mesmas versões e o mesmo bloqueio por conteúdo além do limite da 6b.

### 0.2 Fica fora

- **Prancha de detalhamento:** 6d. Não aparece no menu de adicionar página.
- **Escala:** sem ferramenta de escala, escala gráfica, cota e carimbo automático. No desenho técnico, escala e unidade são só texto digitado.
- **Duplicar página:** aparece em 6c-21 como **proposta**. A regra da cópia foi decidida (P29, 2026-11-08): segue a decisão P11 da 6b e cria um arquivo novo no Drive. A entrada na 6c ainda depende de aprovação, porque pede a operação de cópia que o `DriveClient` não tem.
- **Duplicar apresentação (P24):** continua como proposta, sem implementação nem desenho nesta fase.
- **Edição direta na folha:** 6e.
- **Formatos A3 e 16:9:** 6d. A 6c continua só em A4.

---

## 1. Inventário

A coluna "Base da 6b" diz o que já existe e pode ser reaproveitado.

### 1.1 Dados, salvamento e rotas

| Item | O que a 6c precisa | Base da 6b | Novo |
|---|---|---|---|
| JSON `presentations.data` | Guardar as páginas de todos os tipos | `PresentationData` com `v: 1`, `projeto` e `paginas` (só a capa) | Os tipos de página em `paginas` |
| Validação | Conferir cada tipo, os limites e a regra da capa | `parsePresentationData`, `PRESENTATION_MAX_TEXT` (2000), recusa de base64 | Validação por tipo, limites de itens e de páginas |
| Limite do documento | 1 MiB (decisão de 2026-11-08, seção 10) | `PRESENTATION_MAX_BYTES` (512 KB), 413 `too_large`, aviso 6b-05 | Limite de 1 MiB no servidor (E2) e aviso de 80% no editor (E4) |
| Salvamento automático | Igual, com o documento inteiro | `PATCH /presentations/:id` com conflito por `updatedAt` (409) | — |
| `page_count` | Contar todas as páginas | Coluna existe e já recebe `data.paginas.length` | — |
| Rotas | Nenhuma rota nova para páginas | `GET`, `POST`, `PATCH /presentations`, `POST /presentations/:id/pdf`, `/link` | — |
| Permissões | Iguais às da 6b | `documents.write`, `documents.export`, `workspace.read` | — |

### 1.2 Editor e visualização

| Item | O que a 6c precisa | Base da 6b | Novo |
|---|---|---|---|
| Moldura do editor | Igual | Barra superior, painel com abas, Prévia, "Salvo às", "Salvar em PDF" | — |
| Aba Projeto | Igual | 6b-04 | — |
| Aba Página da capa | Seletores ativos | Seletores fixos em Imagem em arco, Vinho e Pequeno | Ligar os três seletores |
| Aba Página dos outros tipos | Campos, seletor de composição e lista de itens com ↑ ↓ × e "+ item" (6c-15 a 6c-20) | Campos e seletores da capa | Todo o painel de cada tipo |
| Aba Páginas | Lista com ↑ ↓ ×, menu de adicionar (6c-21) | Lista só com a capa (6b-04) | Lista, menu e ações |
| Navegação ‹ › | Ir de página em página, "Página NN de T" | Botões desligados | Ligar |
| Folhas | Capa nas 3 composições, 3 cores e 3 marcas; uma folha por tipo e composição | `CoverSheet.tsx`, `cover.ts` (só arco, vinho, pequena) | Capa completa e seis folhas novas |
| Leitor e celular | Ver todas as páginas sem editar | 6b-12 e 6b-13 | Navegação entre páginas |

### 1.3 Imagens

| Item | O que a 6c precisa | Base da 6b | Novo |
|---|---|---|---|
| Espaço de imagem | O mesmo em todos os tipos: vazio, enviando, enviado, erro, imagem ausente | `CoverImageField.tsx` (6b-06 a 6b-08) | Usar fora da capa |
| Biblioteca | Igual | `ImageLibraryDialog.tsx`, rotas de `presentation-images` | — |
| Vínculos e lixeira | Contar as imagens de todas as páginas | `presentationImageIds`, `syncImageUses`, `trashUnusedImages` | `presentationImageIds` passa a ler todas as páginas e itens |
| Remover página com imagem | Só tira o vínculo; a lixeira recebe a imagem quando nenhuma apresentação a usa (P22) | A mesma regra | — |
| Copiar no Drive | Duplicar página cria um arquivo novo no Drive (P29, decisão P11 da 6b) | `DriveClient` tem `moveFile`, não tem cópia (R10 da 6b) | Operação de cópia, quando duplicar página for aprovada para entrar |

### 1.4 PDF

| Item | O que a 6c precisa | Base da 6b | Novo |
|---|---|---|---|
| Geração | Todas as folhas, na ordem de `paginas` | `presentationHtml` só desenha `CoverSheet` | Uma folha por tipo |
| Imagens | Todas as imagens citadas, na resolução original (P8) | Busca as imagens citadas no Drive | Mais imagens por documento (R3) |
| Bloqueio por limite | Cada folha medida; nada sai cortado | `MEASURE_SHEETS` mede só a capa; 422 `content_overflow` | Medição de cada tipo |
| Nome, versões, sem alteração | Iguais | `Apresentacao-<número>-<nome>-<data>.pdf`, `-v2`, 409 `no_changes`, `pdf_source_hash` | — |
| Histórico | Igual | `presentation.export` e `project_files` | — |

---

## 2. Modelo de dados

### 2.1 Sem migração nova

O JSON `presentations.data` comporta tudo. Nenhuma tabela, coluna ou índice muda:

- **Páginas:** ficam todas em `paginas`, no JSON.
- **`page_count`:** já é gravado com o número de páginas.
- **Imagens:** continuam só por referência a `presentation_images.id`. A tabela `presentation_image_uses` já liga imagem e apresentação. Várias páginas usando a mesma imagem não pedem nenhuma coluna.

### 2.2 Compatibilidade com a 6b

- **Versão:** o documento continua com `v: 1`. Os campos novos só acrescentam.
- **Documento da 6b:** uma página só, a capa, continua válido sem conversão. Isso vale para a apresentação de teste em produção.
- **Regra nova de `paginas`:** passa de "exatamente uma página" para "de 1 a 40 páginas", com a capa em primeiro. A capa é a única página do tipo `capa`.
- **Campos desconhecidos:** continuam descartados, como na 6b.
- **Tamanho:** continua medido como o documento chega.

### 2.3 Campos comuns

Toda página tem `id` (de 1 a 40 caracteres, letras, números, `_` e `-`, único no documento) e `tipo`.

Valores de `tipo` aceitos pela API: `capa`, `texto`, `moodboard`, `visual`, `tecnico`, `notas` e `direitos`. O valor `prancha` é recusado até a 6d.

Limites de texto:

| Campo | Limite |
|---|---|
| Sobretítulo, título, categoria, nome do material, legenda e título do desenho | 200 caracteres |
| Textos longos: introdução, texto do bloco, descrição, observações e textos dos direitos | 2000 caracteres, como na 6b |
| Qualquer campo | Recusa texto em base64, como na 6b |

Imagem: igual à 6b, `{ id, ajuste: "fit" | "fill", zoom: 1 a 4, x: 0 a 100, y: 0 a 100 }` ou `null`.

### 2.4 Capa (`tipo: "capa"`)

Já existe na 6b e não muda de forma:

| Campo | Valores aceitos | Na tela |
|---|---|---|
| `composicao` | `arco`, `foto`, `tipo` | Imagem em arco, Imagem lateral inteira, Só tipografia |
| `cor` | `vinho`, `noite`, `linho` | Vinho, Noite, Linho |
| `marca` | `p`, `m`, `g` | Pequeno (12 mm), Médio (18 mm), Grande (26 mm) |
| `imagem` | imagem ou `null` | Em Só tipografia, a imagem fica guardada e não aparece na folha (pergunta P33) |

Regras:
- exatamente uma capa por apresentação, sempre em `paginas[0]`;
- documento sem capa, com duas capas ou com a capa fora do primeiro lugar recebe 400 `invalid_data`;
- a capa não é removida, movida nem duplicada pela aba Páginas, e não aparece no menu de adicionar página.

### 2.5 Texto & conceito (`tipo: "texto"`)

| Campo | Tipo e limite | Página nova (P30) |
|---|---|---|
| `sobretitulo` | texto curto | "Introdução" |
| `titulo` | texto curto | "Conceito do projeto" |
| `introducao` | texto longo | vazio |
| `composicao` | `diagonal`, `lado`, `coluna`, `destaque`, `livre` | `diagonal` |
| `blocos` | de 0 a 12 itens | 3 blocos de texto ("Conceito", "Referências", "Objetivos e premissas") e 1 de imagem |

Bloco de texto: `{ id, tipo: "texto", titulo (curto), texto (longo) }`.

Bloco de imagem: `{ id, tipo: "imagem", imagem, legenda (curto), formato: "arco" | "retangular", posicao: "auto" | "esquerda" | "direita" | "largura", altura: "p" | "m" | "g" }`.
- `posicao` e `altura` só valem na composição `livre`; nas outras ficam guardadas e não mudam a folha, como no arquivo offline.

### 2.6 Moodboard de materiais (`tipo: "moodboard"`)

| Campo | Tipo e limite | Página nova |
|---|---|---|
| `sobretitulo`, `titulo` | texto curto | "Materiais", "Moodboard de materiais" |
| `introducao` | texto longo | vazio |
| `materiais` | de 0 a 12 itens | 6 materiais vazios |

Material: `{ id, imagem, nome, fabricante, codigo, acabamento, ambiente (curtos), observacoes (longo) }`. A folha mostra 6 materiais em 3 colunas (pergunta P31).

### 2.7 Apresentação visual (`tipo: "visual"`)

| Campo | Tipo e limite | Página nova |
|---|---|---|
| `sobretitulo`, `titulo` | texto curto | "Projeto", vazio |
| `descricao`, `programas`, `observacoes` | `programas` curto; os outros longos | vazios |
| `composicao` | `lado`, `duo`, `principal`, `iso`, `grade` | `lado` |
| `imagens` | itens `{ id, imagem, legenda }` | 1 espaço vazio |

Número de imagens por composição:

| Composição | Imagens |
|---|---|
| `lado` (Imagem grande + texto ao lado) | 1 |
| `duo` (Duas imagens lado a lado) | 2 |
| `principal` (Principal + duas menores) | 3 |
| `iso` (Isométrica + ficha técnica) | 1 |
| `grade` (Várias imagens do ambiente) | de 4 a 8 (P31) |

Ao trocar de composição, os espaços que sobram ficam guardados e não aparecem na folha, como no arquivo offline (pergunta P32). Cada imagem guardada conta para o vínculo.

### 2.8 Desenho técnico (`tipo: "tecnico"`)

| Campo | Tipo e limite | Página nova |
|---|---|---|
| `sobretitulo`, `titulo` | texto curto | "Documentação técnica", "Planta baixa" |
| `observacoes` | texto longo | vazio |
| `escala` | texto curto, livre (ex.: "1:50 · indicada") | vazio |
| `unidade` | texto curto, livre (ex.: "cm") | vazio |
| `composicao` | `1`, `2`, `3`, `4` | `1` |
| `desenhos` | itens `{ id, imagem, titulo }`, com o número da composição | 1 espaço vazio |

Sem cálculo de escala, sem escala gráfica, sem cota e sem carimbo. A linha "Escala · Unidade" da folha só repete o texto digitado e não aparece quando os dois estão vazios e a Prévia está ligada.

### 2.9 Notas técnicas (`tipo: "notas"`)

| Campo | Tipo e limite | Página nova |
|---|---|---|
| `sobretitulo`, `titulo` | texto curto | "Notas", "Notas gerais e diretrizes técnicas" |
| `introducao` | texto longo | vazio |
| `notas` | de 0 a 12 itens `{ id, categoria (curto), titulo (curto), texto (longo) }` | 4 notas com as categorias "Notas gerais", "Diretrizes técnicas", "Orientações de execução" e "Especificações" |

### 2.10 Direitos autorais (`tipo: "direitos"`)

| Campo | Tipo e limite | Página nova |
|---|---|---|
| `sobretitulo`, `titulo` | texto curto | "Propriedade intelectual", "Direitos autorais" |
| `autoria`, `escritorio`, `uso`, `restricoes`, `observacoes` | texto longo | vazios; os modelos do arquivo offline aparecem só como texto de exemplo em cinza, que não sai no PDF |

### 2.11 Limites do documento

| Limite | Valor proposto | Por quê |
|---|---|---|
| Páginas por apresentação | 40, com a capa | Tempo e memória do PDF (R2, R3) |
| Itens por lista | 12 blocos, 12 materiais, 12 notas, 8 imagens em `grade` | O que cabe numa folha A4 sem passar do limite |
| Tamanho | 1 MiB (era 512 KB na 6b; seção 10) | Uma página de texto cheia tem cerca de 29 KB |

Acima de qualquer limite, a API responde 400 `invalid_data` (itens e páginas) ou 413 `too_large` (tamanho). O editor não deixa chegar lá: "+ item" e os tipos do menu ficam desligados no limite, com o motivo em texto.

---

## 3. Aba Páginas

Desenho 6c-21.

| Ação | Regra |
|---|---|
| Adicionar | O menu "Adicionar página" tem os seis tipos, sem Capa e sem Prancha de detalhamento. A página nova entra logo depois da página atual e passa a ser a atual |
| ↑ ↓ | Move a página uma posição. Não aparece na capa. A página 02 não sobe acima da capa |
| × | Remove a página com um diálogo de confirmação (P34). Não aparece na capa. As imagens da página saem do documento; a regra da lixeira é a da 6b |
| Duplicar | Aparece como proposta, com o aviso de 6c-21. Quando entrar, a cópia cria um arquivo novo no Drive para cada imagem da página (P29). Fica desligado até a aprovação |
| Contagem | "N páginas" no título da lista e "Página NN de T" na visualização |
| Leitor | Vê a lista sem ↑ ↓ ×, sem Duplicar e sem o menu de adicionar |

Todas as ações mudam só o JSON e passam pelo salvamento automático. Não há rota nova.

---

## 4. Duplicar apresentação

Marcada como **proposta** (P24). Sem desenho, rota ou código nesta fase, a menos que você decida o contrário. Se for decidida depois, precisa de regra para as imagens (mesma biblioteca do projeto ou cópia na avulsa) e para o número novo.

---

## 5. PDF

- **Folhas:** cada página sai com o mesmo componente da visualização, na Prévia ligada: o que está em cinza não sai.
- **Capa:** a mesma da 6b, agora nas três composições, cores e marcas.
- **Cabeçalho e rodapé das páginas internas:** marca De.Croqui e seção no topo; data de emissão e "NN / TT" no rodapé, como nos desenhos. A capa não tem número.
- **Nome e versões:** iguais à 6b: `Apresentacao-<número>-<nome>-<data>.pdf`, `-v2`, `-v3`, 409 `no_changes` sem alteração.
- **Bloqueio por limite:** a medição passa a valer para todas as folhas. Cada tipo diz quais partes medir (por exemplo, "blocos" no texto, "materiais" no moodboard, "notas" nas notas). Se algo passar, 422 `content_overflow` com a página e as partes, e o aviso terracota da 6b com o número da página (P35).
- **Imagens:** todas as imagens citadas nas páginas, na resolução original (P8). Uma imagem usada em várias páginas é baixada uma vez.
- **Falhas:** como na 6b: 502 sem gravar nada.

---

## 6. Etapas

Cada etapa termina com `npm run build` e `npm test` passando. Os testes de gravação rodam em PGlite com o Drive simulado, nunca numa prévia da Vercel. Cada etapa depende da sua aprovação para começar.

| Etapa | O que entrega | Critério de aceite | Testes | O que não entra |
|---|---|---|---|---|
| E0 | Este plano e as respostas às perguntas | Sua aprovação por escrito | — | Código |
| E1 | Modelo de dados em `src/shared/presentation-data.ts`: os seis tipos, a capa única em primeiro, limites de texto, itens e páginas, página nova de cada tipo, imagens de todas as páginas em `presentationImageIds` | Documento da 6b continua válido; cada tipo válido é aceito; capa fora do lugar, segunda capa, `prancha`, tipo desconhecido, item acima do limite e base64 são recusados | `phase6c-data.test.ts` (unidade) | Rotas e telas |
| E2 | API com os tipos novos: `PATCH` grava todos os tipos, `page_count` certo, vínculos e lixeira com imagens em várias páginas | Salvar e reler cada tipo; remover a última página que usa uma imagem tira o vínculo; imagem usada em outra página continua; 413 acima de 1 MiB; leitor 403 | `phase6c.test.ts` em PGlite com o Drive simulado | PDF e telas |
| E3 | Folhas: capa nas 3 composições, 3 cores e 3 marcas; uma folha por tipo e composição, nos modos Prévia desligada e ligada | Igual a 6c-01 a 6c-14; textos em cinza só com a Prévia desligada | `phase6c-sheets.test.ts` com `renderToStaticMarkup`; capturas locais | Painel e aba Páginas |
| E4 | Aba Página de cada tipo: campos, seletor de composição, lista de itens com ↑ ↓ ×, "+ item", espaços de imagem; seletores da capa ligados | Igual a 6c-15 a 6c-20; limites de itens com o botão desligado e o motivo | `phase6c-editor.test.ts` (funções puras de edição) e capturas em 1440 e 1024 | Aba Páginas |
| E5 | Aba Páginas e navegação: adicionar, ↑ ↓, remover com confirmação, ‹ ›, "Página NN de T"; leitor e celular navegam sem editar | Igual a 6c-21; a capa não sai do primeiro lugar; Duplicar desligado como proposta | Funções puras de lista de páginas; capturas em 1440, 1024 e 390 | Duplicar página e duplicar apresentação |
| E6 | PDF com todas as folhas e medição de limite por tipo | Ordem certa; "NN / TT"; nome e versões da 6b; 422 `content_overflow` com página e partes; 409 `no_changes`; documento grande medido em tempo e memória | `phase6c-pdf-export.test.ts` em PGlite; medição local com 40 páginas e o máximo de imagens | Prancha, A3 e 16:9 |
| E7 | Conferência local completa, capturas e relatório | Tudo bate com 6c-01 a 6c-21; tempo e tamanho do PDF anotados | Suíte completa | Produção |

Depois da E7, e só com sua aprovação de cada passo: push, PR, merge, conferência do deploy e um teste real. Não há migração para aplicar.

---

## 7. Riscos

| Nº | Risco | Mitigação proposta |
|---|---|---|
| R1 | **Limite do documento com mais páginas.** Medido na E1: texto cheio 29,5 KB, moodboard cheio 40,8 KB, notas cheias 31,9 KB. Com 512 KB, só 17 páginas de texto cheias cabiam | O limite subiu para 1 MiB (seção 10): cabem 35 páginas de texto cheias ou 25 de moodboard. O editor avisa a partir de 80% (E4) e, acima do limite, recusa o salvamento com a mensagem da 6b-05, sem perder o que foi escrito |
| R2 | **Texto longo que estoura a página no PDF.** A folha tem tamanho fixo, e 2000 caracteres não cabem em todos os lugares | A medição da 6b passa a valer para todos os tipos (422 `content_overflow`); o PDF nunca sai cortado. Na Prévia ligada, a mesma folha mostra o que passa do limite |
| R3 | **Imagens por página e por documento.** Mais imagens na resolução original deixam o PDF lento ou sem memória na função da Vercel (limite de 300 s) | Baixar cada imagem uma vez e uma de cada vez; limites de 40 páginas e de itens. Medir na E6 o pior caso. Se passar, levar a você antes de mudar P8 ou `vercel.json` |
| R4 | **JSON já salvo na 6b.** A apresentação de teste em produção tem só a capa | O formato continua `v: 1`, e a validação nova aceita o documento de uma página. Teste com o JSON exato salvo na 6b |
| R5 | **Imagem para a lixeira por engano** ao remover uma página cuja imagem está em outra página | A contagem continua por apresentação (`presentation_image_uses`) e `presentationImageIds` lê todas as páginas. Teste com a mesma imagem em duas páginas |
| R6 | **Capa removida ou fora do lugar** por um documento montado à mão | A API recusa; a tela não mostra as ações na capa |
| R7 | **Medição de limite com fontes diferentes** entre o computador e a Vercel | Fontes embutidas no HTML do PDF, como na 6b; teste da medição no mesmo Chromium da função |
| R8 | **Gravação na prévia da Vercel**, que aponta para o banco de produção | Testes só em PGlite; nenhum push sem combinar |
| R9 | **Dados reais em exemplos ou testes.** O arquivo offline traz nome e telefone reais nos dados padrão | Só "Cliente Avulso", "Colaborador Teste", "(00) 00000-0000" e e-mails @exemplo.com |
| R10 | **Logs curtos** no plano Hobby (1 hora) | Conferir os logs logo depois do teste real |

---

## 8. Perguntas

Cada pergunta tem uma sugestão. Basta responder "conforme a sugestão" ou dizer o que muda.

| Nº | Pergunta | Sugestão |
|---|---|---|
| P29 | Duplicar página entra na 6c? Se entrar, a imagem é copiada no Drive (decisão P11 da 6b) ou a cópia aponta para a mesma imagem? | Não entra agora; fica como proposta, como no desenho. Se entrar depois, a cópia aponta para a mesma imagem, sem cópia no Drive: a contagem por apresentação já protege a lixeira, e não é preciso a operação nova de cópia (R10 da 6b) |
| P30 | A página nova começa com os títulos do arquivo offline (por exemplo, "Introdução" e "Conceito do projeto") ou toda vazia? | Com os títulos e categorias do arquivo offline, como nos desenhos 6c-15 a 6c-20, e os textos longos vazios. Nada de texto de exemplo que saia no PDF |
| P31 | Os limites de itens estão bons: 12 blocos, 12 materiais, 12 notas, de 4 a 8 imagens em "Várias imagens do ambiente" e 40 páginas? | Sim. Ficam conferidos na E6, com o PDF de pior caso |
| P32 | Ao trocar a composição para uma com menos imagens, as que sobram ficam guardadas (escondidas) ou são removidas? | Ficam guardadas e escondidas, como no arquivo offline; voltar à composição anterior traz as imagens de volta |
| P33 | Na capa "Só tipografia", a imagem já escolhida fica guardada ou é removida? | Fica guardada e não aparece na folha nem no PDF, pela mesma regra de P32 |
| P34 | Remover página pede confirmação? E remover um item (bloco, material, nota)? | Página: diálogo de confirmação no padrão dos diálogos da 6b, com "Remover página" e "Cancelar". Item: sem diálogo, porque é desfeito com facilidade. Os dois diálogos não foram desenhados; proponho desenhar só o da página, junto da E5 |
| P35 | O aviso de conteúdo além do limite continua o terracota da 6b, agora com o número da página? | Sim: "O PDF não foi gerado: o texto da página NN passou do limite da página. Encurte os textos mais longos e tente de novo.", só com Fechar. Sem desenho novo |
| P36 | A ordem dos tipos no menu de adicionar fica como em 6c-21? | Sim: Texto & conceito, Moodboard de materiais, Apresentação visual, Desenho técnico, Notas técnicas e Direitos autorais |
| P37 | Duplicar apresentação continua só como proposta nesta fase? | Sim, sem implementação na 6c (P24) |

---

## 9. Respostas aprovadas (2026-11-08)

Respostas às perguntas da seção 8, aprovadas pelo usuário em 2026-11-08, junto com a E0.

| Nº | Resposta |
|---|---|
| P29 | Duplicar página mantém a decisão P11 da 6b: a cópia cria um arquivo novo no Drive, para que apagar uma página não afete a outra. Isso substitui a sugestão da seção 8 |
| P30 | A página nova começa com os títulos e as categorias do arquivo offline, como nos desenhos, e os textos longos vazios |
| P31 | Limites aprovados: 12 blocos de texto, 12 materiais, 12 notas, de 4 a 8 imagens em "Várias imagens do ambiente" e 40 páginas |
| P32 | Imagens que sobram ao trocar para uma composição com menos imagens ficam guardadas e escondidas, como no arquivo offline |
| P33 | A imagem escolhida fica guardada na capa "Só tipografia", mas não aparece na folha nem no PDF |
| P34 | Remover página pede confirmação; remover item não pede. O diálogo de página é desenhado junto da E5 |
| P35 | O aviso de limite é o mesmo aviso terracota da 6b, com o número da página |
| P36 | A ordem dos tipos no menu de adicionar é a mesma de 6c-21 |
| P37 | Duplicar apresentação não entra na 6c; continua como proposta |

Ponto em aberto: P29 decide a regra da cópia, mas não diz se duplicar página entra na 6c. Até essa aprovação, o botão Duplicar continua como proposta, como em 6c-21. Se entrar, a cópia no Drive vai para a E2 (API e `DriveClient`) e o botão para a E5.

---

## 10. Decisões da E2 (2026-11-08)

Aprovadas pelo usuário em 2026-11-08, antes da E2.

- **Duplicar página:** quando entrar, cria um arquivo novo no Drive (P29). Na 6c o botão fica desligado como proposta, como em 6c-21. Isso fecha o ponto em aberto da seção 9.
- **Duplicar apresentação:** não entra na 6c (P37).
- **Limite do documento:** sobe de 512 KB para 1 MiB.
  - **Servidor (E2):** acima de 1 MiB, 413 `too_large` com o tamanho e o limite. O corpo aceito na rota de salvamento sobe para 2 MiB, para que um documento um pouco maior que 1 MiB receba essa resposta, e não o erro genérico do servidor. O teto do corpo de uma função da Vercel é 4,5 MB.
  - **Editor (E4):** aviso a partir de 80% do limite, com o texto "O documento está perto do limite de tamanho. Remova conteúdo ou divida a apresentação.". Acima do limite, recusa o salvamento com a mensagem já existente, sem perder o que foi escrito. O texto da mensagem existente ainda diz "512 KB" e precisa passar a "1 MB" na E4.

---

## 11. Medições da E6 (2026-11-08)

Medido no Edge do computador (o mesmo Chromium que imprime o PDF), com textos de exemplo de palavras comuns e fotos de teste geradas no próprio navegador. Na Vercel o Chromium é outro (`@sparticuz/chromium`) e a máquina é mais lenta; os tempos abaixo são uma referência, e não o tempo de produção.

### 11.1 Quanto texto cabe em cada folha

"Cabe" quer dizer que nenhuma parte passa da área entre o cabeçalho e o rodapé, nenhum texto fica escondido e nenhum espaço de imagem é esmagado.

| Tipo e composição | Tudo no máximo (itens no limite, 2000 caracteres em cada texto longo) | Maior texto longo que cabe com o máximo de itens | Itens que cabem com 300 caracteres cada |
|---|---|---|---|
| Texto & conceito · Diagonal | Passa: introdução e blocos | 55 caracteres por bloco, com 12 blocos | 6 de 12 |
| Texto & conceito · Lado a lado | Passa: introdução, blocos e imagens | Nenhum texto: 12 blocos só com título cabem | 4 de 12 |
| Texto & conceito · Coluna | Passa: introdução e blocos | 12 blocos não cabem nem vazios; vazios, cabem 10 | 3 de 12 |
| Texto & conceito · Destaque | Passa: blocos e imagens | 123 caracteres | 4 de 12 |
| Texto & conceito · Livre | Passa: introdução e blocos | 55 caracteres | 6 de 12 |
| Moodboard de materiais | Passa: materiais | 128 caracteres de observação por material, com 12 materiais | 4 de 12 |
| Notas técnicas | Passa: introdução e notas | 58 caracteres por nota, com 12 notas | 6 de 12 |
| Direitos autorais | Passa: direitos | 444 caracteres em cada um dos 5 campos | — |
| Apresentação visual · Lado a lado | Passa: descrição e ficha | 658 caracteres na descrição e nas observações | — |
| Apresentação visual · Dupla | Passa: imagens, programas e observações | 1215 | — |
| Apresentação visual · Principal | Passa: imagens e ficha | 400 | — |
| Apresentação visual · Isométrica | Passa: descrição e ficha | 687 | — |
| Apresentação visual · Grade (8 imagens) | Passa: imagens, programas e observações | 1134 | — |
| Desenho técnico · 1, 2, 3 e 4 desenhos | Passa: desenhos (o texto esmaga o desenho) | 1377, 1944, 1458 e 1215 caracteres de observações | — |

**Limite de 12 blocos, materiais e notas.** Com texto de verdade (um parágrafo de 300 caracteres), cabem de 3 a 6 itens por folha; com 12, só títulos ou uma linha cada. Como o PDF recusa com a página e as partes, nada sai cortado. Por isso a E6 não muda os limites. Se você preferir que o editor não deixe chegar a uma folha que não cabe, a proposta é baixar o limite para 6 blocos, 6 materiais e 6 notas. Isso muda P31 e depende da sua aprovação.

### 11.2 Tamanho de cada tipo de página cheia (que ainda cabe)

PDF de uma folha, sem a capa, com as fotos de teste de 1600 px (o tamanho da visualização); com a foto original, a folha cresce na proporção da foto (ver 11.3).

| Tipo e composição | PDF da folha | JSON da página |
|---|---|---|
| Texto & conceito (Diagonal, Lado, Destaque, Livre) | 117 a 149 KB | 1,4 a 3,0 KB |
| Moodboard (12 materiais) | 182 KB | 4,4 KB |
| Notas (12 notas) | 153 KB | 2,1 KB |
| Direitos autorais | 113 KB | 2,5 KB |
| Visual · Lado, Isométrica (1 imagem) | 784 a 788 KB | 1,7 KB |
| Visual · Dupla, Principal | 1,4 MB e 2,1 MB | 3,0 e 1,5 KB |
| Visual · Grade (8 imagens) | 5,3 MB | 3,8 KB |
| Desenho técnico · 1 a 4 desenhos | 0,8 a 2,7 MB | 1,8 a 2,9 KB |

Com tudo no máximo (o que não cabe), o JSON de uma página de texto, moodboard ou notas tem de 27,7 a 29,0 KB, como medido na E1.

### 11.3 Documento grande e fotos na resolução original (R3)

| Caso | Resultado | Tempo | PDF |
|---|---|---|---|
| 40 páginas (capa e 39 internas, todos os tipos, textos que cabem), sem fotos | Gera, 40 folhas | 0,5 s | 609 KB |
| 15 páginas de fotos, 1 foto original por página (15 fotos de 4000 × 2667, 57,6 MB) | Gera, 16 folhas | 15 a 20 s | 57,9 MB |
| 15 páginas de fotos, 3 fotos por página (45 fotos, 173 MB) | Não gera: o Chromium fecha ao receber o HTML | — | — |
| 15 páginas de fotos, 8 fotos por página (120 fotos, 461 MB) | Não gera, idem | — | — |
| 40 páginas com 1 foto original em cada espaço das páginas visuais e técnicas (50 fotos, 192 MB) | Não gera, idem | — | — |

O PDF guarda as fotos quase do tamanho original: 15 fotos de 57,6 MB deram um PDF de 57,9 MB. As fotos de teste têm ruído e comprimem mal, então fotos reais tendem a ficar menores. Mesmo assim, a ordem de grandeza é essa.

Quando o Chromium fecha, a rota responde 502 `pdf_failed` e nada é gravado, como na 6b. O PDF não sai cortado nem errado, mas uma apresentação com muitas fotos grandes não consegue gerar PDF. O limite fica entre 58 MB e 173 MB de fotos por documento, no computador; na Vercel deve ser menor.

**Decisão sua (R3, P8).** As saídas possíveis são:
1. Reduzir as fotos só no PDF, por exemplo para 3000 px no lado maior (cerca de 250 dpi numa folha A4). Isso muda P8.
2. Manter a resolução original e passar as imagens ao Chromium uma a uma, em vez de dentro do HTML. Isso evita a queda, mas deixa PDFs de centenas de MB e usa mais memória na função.
3. Limitar o total de fotos por apresentação.

Nada disso foi feito na E6.
