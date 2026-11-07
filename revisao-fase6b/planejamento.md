# Fase 6b: Apresentação — planejamento

Este documento é só planejamento. Nesta etapa não houve código de produção, migração, merge, deploy nem alteração no Supabase ou na Vercel.

- Branch: `feat/fase-6b-apresentacao`, criada da `main` em `8c17804`. Só existe no computador: sem push, porque um push gera uma prévia na Vercel.
- **Lido:**
  - `revisao-fase6/funcionalidades.md` e `revisao-fase6/casos-de-teste.json` (66 casos `apr-*`), da branch `feat/fase-6-orcamento-apresentacao` (`2c2cde6`);
  - `revisao-fase6a/relatorio.md` e a lista de `revisao-fase6a/desenhos/`;
  - o código da 6a: `api/_app/db/schema.ts` (`budgets`), `api/_app/routes/budgets.ts`, `api/_app/budget-files.ts`, `api/_app/budget-pdf.ts`, `api/_app/routes/files.ts`, `api/_app/drive.ts`, `api/_app/permissions.ts`, `src/pages/budgets/*` e `vercel.json`.
- **Não acessível:** `claude/decisoes-fase-6.md` está no Project "De.Croqui" e o Claude Code não alcança esse arquivo. Para este plano usei as regras de decisão listadas no pedido. **Peço que você cole o conteúdo do arquivo** para eu conferir se alguma decisão muda o plano (pergunta P1).

## 0. Decisões já tomadas (2026-11-07)

Detalhes e justificativas em `revisao-fase6b/molduras.md`, seção 7.

- **Divisão da fase:** a prancha de detalhamento e a moldura (folha-modelo) saem da 6b e vão para a **6d**.
- **Escala:**
  - não há ferramenta de escala nem medição de cota no sistema;
  - "Desenho técnico" fica só com imagem e um campo de texto para a escala digitada (por exemplo, 1:50);
  - não há cota automática, escala gráfica nem carimbo automático (M9).
- **Casos de teste que deixam de valer:** `apr-01` a `apr-15` (escalas, cota e carimbo) e `apr-62` (aviso de escala real ao exportar).
- **Casos que vão para a 6d:** `apr-16` a `apr-19` (rodapé da prancha), `apr-45` a `apr-51` (importação da prancha), `apr-55` e `apr-56` (folha-modelo) e `apr-66` (prancha A3 dentro de documento A4).
- **Moldura, para a 6d:**
  - baixada pelo ERP, a partir de arquivos prontos guardados no repositório e só em PNG (M1 a M3);
  - aceita qualquer resolução a partir de 200 dpi, com proporção exata; a recomendação é 300 dpi (M4);
  - imagem com proporção mais de 0,5% fora é recusada (M5);
  - só PNG, JPEG e WebP (M6);
  - desenho congelado e com versão (M8);
  - conferência no LayOut ainda pendente (M7).

---

## 1. Inventário

A coluna "Base da 6a" diz o que já existe e pode ser reaproveitado. Os casos citados estão em `casos-de-teste.json`.

### 1.1 Lista, criação e salvamento

| Item | O que a apresentação precisa | Base da 6a | Novo |
|---|---|---|---|
| Lista `/apresentacoes` | Abas Todas e Sem projeto, nome, projeto, última alteração e quem alterou | `BudgetsPage.tsx`, `shared.ts` | Colunas próprias, por exemplo a quantidade de páginas |
| Nova apresentação avulsa | Painel com nome obrigatório e projeto opcional | `NewBudgetPanel.tsx`; check `*_name_not_blank` | Textos |
| Nova apresentação no projeto | Botão "Nova apresentação" na página do projeto. Nada é criado sozinho com o projeto | Botão "Novo orçamento" do projeto | — |
| Documento novo zerado | Sem o modelo de exemplo de 11 páginas e sem nomes ou telefones reais | `emptyBudget()` | Definir com o que um documento novo começa (P4) |
| Salvamento automático | "Salvo às HH:MM", erro ao salvar, alterado em outra aba | PATCH de `budgets` com conflito por `updated_at`; o aviso do editor | — |
| Rota já reservada | `/apresentacoes` existe hoje como tela "chega na fase da apresentação" | `src/App.tsx`, `AppShell.tsx` | Trocar pela lista |
| Permissões | Administrador e colaborador criam, editam e exportam. Leitor só vê | `documents.write`, `documents.export`, `workspace.read`; matriz `phase2.test.ts` | Somente leitura no editor |

### 1.2 Editor

| Item | O que a apresentação precisa | Base da 6a | Novo |
|---|---|---|---|
| Moldura do editor | Barra superior com Voltar, título, situação do salvamento e ações; painel à esquerda; folhas à direita | Moldura do editor de orçamento; desenhos `erp-editor-apresentacao-*` | Painel com três abas |
| Barra das folhas | ‹ ›, "Página NN de T", tipo e título, zoom − % +, etiqueta da prévia | — | Tudo. Zoom de ajuste em `apr-57` a `apr-60` |
| Rolagem contínua | Rolar muda a página atual; clicar numa folha a seleciona | — | Tudo |
| Aba Projeto | 11 campos e o formato da página (A4, A3 ou 16:9) | Campos do orçamento | Campos e formatos |
| Aba Páginas | Lista com ↑ ↓ Duplicar ×, excluir com confirmação, mínimo de uma página, adicionar os 7 tipos da 6b depois da atual (a prancha entra na 6d), aviso de conteúdo excedente | Lista de ambientes; diálogos do design system | Tudo |
| Aba Página | Opções, campos e itens de cada um dos 7 tipos da 6b | — | Tudo |
| Edição na folha | Texto colado sem formatação, Esc sai, texto de exemplo em cinza que não é impresso | — | Tudo (P17) |
| Prévia | Mostra as folhas como sairão no PDF, sem textos de exemplo nem campos vazios | — | Tudo |

### 1.3 Tipos de página e cálculos de layout

| Tipo | O que precisa | Casos |
|---|---|---|
| Capa | 3 composições, 3 cores, 3 tamanhos de marca, uma imagem opcional, dados da aba Projeto | — |
| Texto & conceito | 5 composições, blocos de texto e de imagem (arco ou retângulo), posição e altura no modo personalizado | — |
| Moodboard | Materiais com imagem e 6 campos, colunas automáticas | `apr-22` a `apr-32` |
| Apresentação visual | 5 composições; "várias imagens" com grade automática | `apr-33` a `apr-44` |
| Desenho técnico | 4 composições; cada desenho com imagem, título e a escala digitada como texto (M9). Sem cálculo de escala | — (`apr-01` a `apr-15` deixam de valer) |
| Prancha de detalhamento | **Fica para a 6d** (seção 0) | `apr-16` a `apr-19`, `apr-45` a `apr-51`, `apr-55`, `apr-56`, na 6d |
| Notas técnicas | Notas com categoria, título e texto | `apr-61` |
| Direitos autorais | 7 campos de texto | — |
| Moldura das páginas | Cabeçalho e rodapé em todas, menos capa e prancha. "NN / TT", e a capa sem número | `apr-20`, `apr-21` |

Os cálculos de `funcionalidades.md` §3.6 que continuam na 6b (numeração, colunas do moodboard, grade de várias imagens, tamanho de redução, zoom de ajuste e conteúdo excedente) não têm base na 6a. Eles vão para um módulo novo, `src/shared/presentation-calc.ts`, usado pelo editor e pelo servidor do PDF, como `budget-calc.ts`.

### 1.4 Imagens

| Item | O que precisa | Base da 6a e do ERP | Novo |
|---|---|---|---|
| Inserir | Clique ou arraste, vários arquivos preenchendo os espaços vazios, aviso de sobra | — | Tudo |
| Validação | PNG, JPG e WebP até 40 MB; GIF recusado com aviso | — | `apr-52` a `apr-54` |
| Redução no navegador | 4000 px no lado maior (os 7200 px da prancha ficam para a 6d), PNG continua PNG, o resto vira JPEG 0,9 | — | Tudo; antes do envio |
| Envio direto ao Drive | O navegador envia, a API só abre a sessão e confere | `createUploadSession` com `origin`, autorização assinada (`UploadGrant`) e conferência no Drive em `routes/files.ts` | Rota própria da apresentação e registro da imagem (seção 4) |
| Exibir no editor | Imagem servida pelo ERP | `GET /files/:id/image` (visualização de 1600 px do Drive ou o arquivo inteiro até 4 MB) | Rota equivalente para as imagens da apresentação (P8) |
| Ferramentas | Trocar, Ajustar/Preencher, zoom de 1 a 4 em passos de 0,15, enquadramento de 0 a 100%, Centro, remover com confirmação, Arco/Retângulo. Sem a ferramenta Escala (M9) | — | Tudo |
| Imagem ausente | Aviso e espaço que pede para inserir de novo | — | Tudo |

### 1.5 PDF

| Item | O que precisa | Base da 6a | Novo |
|---|---|---|---|
| Geração | No servidor, com o mesmo componente da prévia | `budget-pdf.ts` (Chromium, CSS e fontes embutidos) | Tamanho das páginas no PDF (`apr-63` a `apr-65`; `apr-66` na 6d) e imagens buscadas no Drive pelo servidor |
| Pasta | `Apresentações` do projeto ou `De.Croqui ERP/Avulsos` | `projectSubfolderId`, subpasta `presentations` já prevista no enum e no Drive | — |
| Versões e nome | `-v2`, `-v3`; nome só com letras sem acento, números e hífen | `budgetPdfName`, `fileSlug` | Prefixo e data do nome (P15) |
| Sem alteração | Não gera outro PDF igual | `pdf_source_hash`, 409 `no_changes` (PR #4) | — |
| Falhas | 502 `pdf_failed` ou `drive_failed`, versão devolvida, arquivo para a lixeira se o banco falhar | Rota `POST /budgets/:id/pdf` | — |
| Histórico | `presentation.export` no `audit_log` e registro em `project_files` | `budget.export` | — |
| Conteúdo excedente | Aviso na lista e confirmação ao exportar | Medição da divisão das folhas no servidor | `apr-61` |
| Escala real | Sai da 6b: sem escala calculada, não há aviso de "Tamanho real" (`apr-62` deixa de valer). Volta a ser avaliado na 6d, com a prancha | — | — |

---

## 2. Lacunas e perguntas

Estes pontos estão ambíguos ou faltam nos arquivos offline e nos desenhos. Não preenchi nenhum com suposição.

### 2.1 Fontes e escopo

- **P1.** Pode colar o conteúdo de `claude/decisoes-fase-6.md`? Ele não está acessível daqui.
- **P2.** Respondida em parte: a prancha e a moldura vão para a 6d, e as ferramentas de escala saem. Falta saber se os outros 7 tipos de página e os formatos A3 e 16:9 entram todos na 6b, ou se parte deles vai para outra fase.
- **P3.** O editor precisa funcionar no celular (390 px)? Ou no celular ficam só a lista, a leitura e o PDF?

### 2.2 Documento novo e dados do projeto

- **P4.** Um documento novo começa com quantas páginas e de que tipo? Por exemplo, só a capa, ou nenhuma página com o aviso para adicionar? O arquivo exige pelo menos uma.
- **P5.** No arquivo, alguns campos da aba Projeto vêm preenchidos: Tipo "Apresentação de projeto", Marca "De.Croqui", Data de hoje, Projetista e Contato. Algum desses fica preenchido num documento novo? Projetista e Contato têm nome e telefone reais e por isso não podem ser o valor de fábrica.
- **P6.** Numa apresentação de projeto, o nome do projeto e o cliente vêm do cadastro do projeto? Se sim, como cópia editável ou ligados ao cadastro? E a localização?
- **P7.** "Data de emissão" continua texto livre? Na 6b isso não trava nada. A data curta da prancha, que só funciona com "D de mês de AAAA", fica para a 6d.

### 2.3 Imagens

- **P8.** Para mostrar a imagem no editor, a visualização de 1600 px do Drive basta? Ela já é usada nos arquivos do projeto. A resolução da prancha na tela fica para a 6d.
- **P9.** Em que pasta do Drive ficam as imagens? Por exemplo `Apresentações/<nome da apresentação>/Imagens` no projeto e `Avulsos/<nome>/Imagens` na avulsa. Elas também aparecem em "Arquivos" do projeto, ou só dentro da apresentação?
- **P10.** O que acontece no Drive com a imagem que sai da apresentação (trocar ou remover)? Opções: vai para a lixeira na hora, fica no Drive, ou vai para a lixeira quando a apresentação for excluída. O arquivo apaga sozinho as imagens que nenhuma página usa (item 8 de `funcionalidades.md` §4).
- **P11.** Duplicar uma página ou um item com imagem reaproveita o mesmo arquivo no Drive ou faz uma cópia?
- **P12.** Os limites do arquivo continuam: 40 MB por arquivo antes da redução, e 4000 px depois? Há limite de imagens por apresentação ou de páginas?

### 2.4 PDF

- **P13.** Respondida: o aviso de "Tamanho real" sai da 6b (M9).
- **P14.** Página com conteúdo excedente (`apr-61`): o PDF sai cortado depois da confirmação, como no arquivo, ou fica bloqueado até corrigir?
- **P15.** Nome do arquivo no Drive: `Apresentacao-<número>-<nome>-<data>.pdf`, como o orçamento? Que data entra, se a Data de emissão é texto livre? A apresentação também tem número sequencial ("Apresentação nº")?
- **P16.** O botão se chama "Exportar PDF", como no arquivo e no desenho, ou "Salvar em PDF", como no orçamento?

### 2.5 Edição e ferramentas

- **P17.** A edição direto na folha entra na 6b, ou a primeira versão edita só pelo painel?
- **P18.** Respondida: não há medição de cota (M9).
- **P19.** Respondida: a folha-modelo vai para a 6d, como arquivo PNG pronto no repositório, baixado pelo ERP (M1 a M3).
- **P20.** "Novo" sai do editor, já que "Nova apresentação" fica na lista e no projeto? Ou passa a criar outra apresentação?
- **P21.** Uma apresentação avulsa pode ser ligada a um projeto depois? O orçamento ficou preparado para isso, mas ainda não tem a tela.

---

## 3. Desenhos para aprovar no Figcraft

Os desenhos de `design/erp-editor-apresentacao-*` mostram a moldura, a capa e as abas Projeto e Páginas. O resto (`funcionalidades.md` §5.2) ainda não tem desenho. Os novos seguem a moldura de `design/moldura-erp.figcraft` e os nove desenhos da 6a. Todos em 1440, salvo onde indicado.

| Nº | Tela | O que precisa ser aprovado |
|---|---|---|
| D01 | Lista de apresentações, abas Todas e Sem projeto, e estado vazio | Colunas, ordem, texto do estado vazio, botão Vinho "Nova apresentação" |
| D02 | Nova apresentação avulsa com nome obrigatório | Campos, mensagem de nome vazio, textos |
| D03 | Página do projeto com "Nova apresentação" e o painel aberto | Posição do botão junto de "Novo orçamento" |
| D04 | Editor de documento novo, zerado e salvo | Barra superior, painel (largura), o que aparece com zero ou uma página (P4), "Salvo às HH:MM" |
| D05 | Erro ao salvar e alterado em outra aba | Os mesmos avisos da 6a aplicados à apresentação |
| D06 | Aba Página de cada tipo: texto & conceito, moodboard, visual, desenho técnico, notas, direitos autorais. A capa já tem desenho; a prancha fica para a 6d | Ordem dos campos, seletor de composição, listas de itens, botões de adicionar e remover |
| D07 | Espaço de imagem em todos os estados: vazio, arrastando sobre, enviando, enviado, erro de envio, imagem ausente no Drive | Textos, barra de progresso, aviso de erro em terracota |
| D08 | Ferramentas sobre a imagem: Trocar, Ajustar/Preencher, zoom, Centro, remover, Arco/Retângulo | Posição e tamanho, comportamento ao passar o mouse, confirmação de remover |
| D09 | Envio de vários arquivos e os avisos (sobra de arquivos, formato recusado, arquivo grande demais) | Textos e tipo de aviso |
| D10 | Desenho técnico simplificado: imagem, título e campo de texto da escala (M9) | Lugar e rótulo do campo de escala; como a escala digitada aparece na folha |
| D11 | Prévia | Etiqueta "Prévia de impressão" e o que some |
| D12 | Conteúdo excedente: aviso na lista de páginas e diálogo ao exportar | Texto, cor e decisão de P14 |
| D13 | PDF: gerando, salvo, sem alterações, erro | Reaproveita os avisos da 6a (ardósia e terracota) |
| D14 | Formatos A3 e 16:9 no editor | Zoom, rótulo e proporção da folha |
| D15 | Excluir página e remover item com conteúdo | Diálogos do design system |
| D16 | Leitor | O que fica escondido e o que fica só para leitura |
| D17 | 1024 e 390 da lista e do editor | Conforme P3 |

Regras que valem para todos: tokens no lugar de cor fixa, no máximo um botão Vinho por tela, Cormorant Garamond e Jost, sem emoji e sem exclamação, avisos informativos em ardósia (`--feedback-info*`), exemplos com nomes fictícios.

---

## 4. Modelo de dados proposto

Ainda não há migração. A numeração seria `0011`.

### 4.1 Tabela `presentations`

Mesmo padrão de `budgets`, sem `total_cents`. O campo `status` fica de fora, porque o orçamento tem `draft` e `sent` e só usa `draft`. Volta se houver uso.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | `uuid`, chave, `gen_random_uuid()` | |
| `project_id` | `uuid`, opcional, `references projects(id)` | Vazio = avulsa |
| `name` | `text not null` | Check `presentations_name_not_blank`: `length(btrim(name)) > 0` |
| `number` | `integer not null generated always as identity` | "Apresentação nº", se aprovado em P15 |
| `data` | `jsonb not null default '{}'` | Textos, números e estrutura. Imagens só por referência (4.3) |
| `page_count` | `integer not null default 0` | Para a lista, sem ler o JSON inteiro |
| `created_by` | `uuid`, `references users(id) on delete set null` | |
| `updated_at` | `timestamptz not null default now()` | Também detecta o conflito entre abas |
| `pdf_drive_file_id` | `text`, opcional | PDF mais recente |
| `pdf_name` | `text`, opcional | |
| `pdf_version` | `integer not null default 0` | |
| `pdf_exported_at` | `timestamptz`, opcional | |
| `pdf_source_hash` | `text`, opcional | sha256 do que gerou o PDF, como no orçamento |

Índices:
- `presentations_number_idx`: único em `number`;
- `presentations_project_updated_idx`: em `(project_id, updated_at)`, para a lista por projeto e a aba Sem projeto.

A RLS fica ligada e sem políticas, como nas outras tabelas.

### 4.2 Tabela `presentation_images` (proposta)

**Por que uma tabela à parte:** se o JSON guardasse o ID do Drive direto, quem edita poderia colocar ali o ID de qualquer arquivo da conta do Drive do administrador, e a rota de imagem o serviria. Com a tabela, o JSON só aponta para imagens que o servidor conferiu no envio. Ela também permite limpar arquivos do Drive conforme P10.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | `uuid`, chave | É o que o JSON referencia |
| `presentation_id` | `uuid not null`, `references presentations(id)` | |
| `drive_file_id` | `text not null` | Único |
| `mime_type` | `text not null` | `image/png` ou `image/jpeg` depois da redução |
| `width_px`, `height_px` | `integer not null` | Tamanho guardado |
| `size_bytes` | `bigint not null` | |
| `created_by` | `uuid`, `on delete set null` | |
| `created_at` | `timestamptz not null default now()` | |
| `trashed_at` | `timestamptz`, opcional | Conforme P10 |

Índice em `(presentation_id)`.

### 4.3 Forma do JSON `data`

```
{
  "v": 1,
  "projeto": { "nome", "tipo", "cliente", "projetista", "registro", "localizacao",
               "data", "codigo", "marca", "contato", "formato": "a4" | "a3" | "16:9" },
  "paginas": [
    { "id", "tipo": "capa" | "texto" | "moodboard" | "visual" | "tecnico" | "notas" | "direitos",
      ...campos e itens do tipo }
  ]
}
```

- **Imagem:** `{ "imagem": "<presentation_images.id>", "ajuste": "fit" | "fill", "zoom", "x", "y" }`.
- **Desenho técnico:** cada desenho tem `imagem`, `titulo` e `escala` (texto livre, por exemplo "1:50"). Sem campos de cálculo de escala (M9).
- **Prancha:** o tipo `prancha` não é aceito na 6b. Na 6d ele entra com o número da versão da moldura (M8).
- **Validação:** a API confere a forma, os tipos e o tamanho do JSON, e recusa texto em base64. Ver o risco R4.

---

## 5. Plano de etapas

Cada etapa termina com `npm run build` e `npm test` passando. Os testes de gravação rodam em PGlite com o Drive simulado, nunca numa prévia da Vercel. As etapas 5 em diante só começam depois de os desenhos correspondentes serem aprovados.

| Etapa | O que entrega | Critério de aceite | Testes |
|---|---|---|---|
| E0 | Este plano, as respostas e os desenhos aprovados | Sua aprovação por escrito | — |
| E1 | Migração `0011`: `presentations` e `presentation_images` | Só cria as duas tabelas; nenhuma coluna, índice, restrição ou linha das outras tabelas muda | `phase6b-migration.test.ts`: antes e depois, como `phase6a-migration.test.ts`; check do nome |
| E2 | `src/shared/presentation-calc.ts`: numeração, colunas do moodboard, grade de várias imagens, tamanho de redução, zoom de ajuste | Os casos `apr-20` a `apr-44`, `apr-52` a `apr-54` e `apr-57` a `apr-60` dão a saída gravada no JSON | `phase6b-calc.test.ts`, que lê esses casos direto do `casos-de-teste.json` |
| E3 | API `/presentations`: lista com filtro de projeto e Sem projeto, leitura, criação, salvamento automático com conflito, validação do JSON | Nome obrigatório (400 e check), documento novo zerado, 409 de conflito, leitor 403 em toda gravação, projeto excluído 404, JSON grande demais recusado | `phase6b.test.ts`; linhas novas na matriz de `phase2.test.ts` |
| E4 | Imagens: abrir sessão de envio, concluir com conferência no Drive, servir a imagem, remover | Envio direto ao Drive; só imagem conferida vira linha; tipo e tamanho validados; arquivo que não confere vai para a lixeira; leitor não envia | `phase6b-images.test.ts` com `fetch` injetado e Drive simulado |
| E5 | Telas: lista, Nova apresentação e botão no projeto | Igual aos desenhos D01 a D03 | Testes das rotas usadas; capturas em 1440, 1024 e 390 |
| E6 | Editor base: barra, abas Projeto e Páginas, moldura, numeração, capa, texto & conceito sem imagem, notas, direitos autorais, salvamento automático | Igual a D04, D05 e D15; `apr-20` e `apr-21` | Cálculo da numeração; salvamento com conflito |
| E7 | Imagens no editor: inserir, reduzir, enviar, ferramentas, moodboard, visual e várias imagens | Igual a D06 a D09 (D10 na E8); `apr-22` a `apr-44`, `apr-52` a `apr-54` | Redução de tamanho em teste de unidade; grade e colunas |
| E8 | Desenho técnico simplificado | Igual a D10: imagem, título e escala digitada nas 4 composições | Gravação e leitura da escala digitada |
| E9 | Sai da 6b: prancha e folha-modelo ficam para a 6d | — | — |
| E10 | Formatos A3 e 16:9, prévia e conteúdo excedente | Igual a D11, D12 e D14; `apr-57` a `apr-61` | Zoom de ajuste; medição do excedente |
| E11 | PDF no servidor: `presentation-pdf.ts` e `POST /presentations/:id/pdf` | Pasta certa; versões; 409 `no_changes`; 502 sem gravar nada; `audit_log` e `project_files`; páginas do tamanho certo em A4, A3 e 16:9 (`apr-63` a `apr-65`) | `phase6b-pdf-export.test.ts` como o da 6a; medição local das páginas do PDF |
| E12 | Conferência local completa, capturas e relatório | Tudo bate com os desenhos; tempo e tamanho do PDF medidos | Suíte completa |

Depois da E12, e só com sua aprovação de cada passo: aplicar a migração em produção, fazer o merge, conferir o deploy e fazer um teste real.

---

## 6. Riscos em produção

| Nº | Risco | Mitigação proposta |
|---|---|---|
| R1 | **PDF lento ou sem memória na função da Vercel.** Muitas imagens grandes baixadas do Drive e postas no Chromium | O servidor pede ao Drive só a resolução necessária para a área impressa a 300 dpi. Na 6d, a prancha (até 7200 px) refaz esta medição. Medir localmente com o pior caso aprovado em P12. Hoje o limite é de 300 s; mudar memória ou duração exige mexer em `vercel.json` além de `includeFiles`, e isso só com sua aprovação |
| R2 | **PDF muito grande para enviar ao Drive.** | O envio da 6a já é por sessão retomável. Medir o tamanho no pior caso. Se passar de algumas dezenas de MB, enviar em partes |
| R3 | **Visualização do Drive ainda não pronta logo depois do envio.** A rota de imagem cai no arquivo inteiro, que só passa se tiver até 4 MB, abaixo do limite de 4,5 MB da Vercel. Um JPEG de 4000 px pode passar disso | Enquanto o Drive não gera a visualização, o editor mostra a cópia local da imagem que acabou de ser enviada. A rota nunca devolve mais de 4 MB |
| R4 | **JSON grande demais.** O Fastify recusa corpos acima de 1 MiB por padrão, e o salvamento automático envia o documento inteiro | Limite explícito na API (proposta: 512 KB), com erro claro no editor. Nenhuma imagem dentro do JSON, nem em base64. Teste com uma apresentação grande (por exemplo 60 páginas e 120 notas) |
| R5 | **ID do Drive forjado no JSON.** Faria a rota servir qualquer arquivo da conta do Drive do administrador | Tabela `presentation_images` (4.2): o JSON só referencia imagens conferidas no envio |
| R6 | **Arquivos órfãos no Drive.** O envio termina e a conclusão falha, ou a imagem é removida da página | A conclusão confere e, se falhar, manda o arquivo para a lixeira, como em `files.ts`. Limpeza conforme P10 |
| R7 | **CORS ou sessão de envio expirada.** | O mesmo fluxo de `createUploadSession` com `origin` já funciona nos arquivos do projeto. Sessão nova a cada tentativa, com o aviso de erro e "Tentar de novo" |
| R8 | **Tamanho de página errado no PDF.** Diferenças de arredondamento (297 × 209,9 mm) ou de zoom no Chromium | Medir no PDF gerado o tamanho das páginas. A escala real deixa de ser exigida na 6b (M9) e volta com a prancha na 6d |
| R9 | **Na 6d: prancha A3 dentro de documento A4.** Depende de páginas com nome no CSS de impressão do Chromium da Vercel (`@sparticuz/chromium` 153) | Testar `apr-66` localmente com a mesma versão do Chromium. Se não funcionar, gerar cada tamanho em separado e juntar os PDFs, o que exigiria uma biblioteca nova; aviso antes de instalar |
| R10 | **Arquivos que a função não encontra.** CSS das folhas da apresentação ou fontes fora do pacote, ou import sem `.js` ("Cannot find module", como na 6a) | Acrescentar os arquivos em `includeFiles`, a única mudança permitida em `vercel.json`. Estender `server-imports.test.ts` para o gerador da apresentação |
| R11 | **Medição de excedente diferente entre o navegador e o servidor.** | Medir no servidor, como a divisão das folhas da 6a, e usar o mesmo CSS e as mesmas fontes |
| R12 | **Dados reais em exemplos ou testes.** | Exemplos e testes só com nomes fictícios ("Projeto Teste", "Cliente Teste"). Os casos que citam contatos reais ficam como estão no arquivo de casos, mas não entram em telas nem em dados de fábrica |
| R13 | **Gravação na prévia da Vercel.** A prévia aponta para o banco de produção | Testes só em PGlite; nenhuma gravação em prévia; nenhum push sem combinar, porque o push gera prévia |
| R14 | **Envio interrompido no meio.** Rede cai durante uma imagem grande | A referência só entra no documento depois da conclusão. Até lá, o espaço mostra "enviando" ou o erro, sem salvar nada pela metade |
| R15 | **Logs curtos.** No plano Hobby a Vercel guarda só uma hora de logs de execução | Conferir logs logo depois de cada teste real e registrar no relatório |
