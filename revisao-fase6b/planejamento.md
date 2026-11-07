# Fase 6b: Apresentação — planejamento

Este documento é só planejamento. Nesta etapa não houve código de produção, migração, merge, deploy nem alteração no Supabase ou na Vercel.

- **Branch:** `feat/fase-6b-apresentacao`, criada da `main` em `8c17804`. Só existe no computador: sem push, porque um push gera uma prévia na Vercel.
- **Decisões:** `revisao-fase6b/decisoes.md` (cópia do `decisoes-fase-6.md` do Project) e `revisao-fase6b/molduras.md`, seção 7.
- **Lido:**
  - `revisao-fase6/funcionalidades.md` e `revisao-fase6/casos-de-teste.json` (66 casos `apr-*`), da branch `feat/fase-6-orcamento-apresentacao` (`2c2cde6`);
  - `revisao-fase6a/relatorio.md` e a lista de `revisao-fase6a/desenhos/`;
  - o código da 6a: `api/_app/db/schema.ts` (`budgets`), `api/_app/routes/budgets.ts`, `api/_app/budget-files.ts`, `api/_app/budget-pdf.ts`, `api/_app/routes/files.ts`, `api/_app/drive.ts`, `api/_app/permissions.ts`, `src/pages/budgets/*` e `vercel.json`.

## 0. Divisão da fase e decisões

### 0.1 As quatro partes

| Parte | O que entra | Casos de teste |
|---|---|---|
| **6b (base)** | <ul><li>Lista com aba Sem projeto, e criação já com a capa.</li><li>Editor pelo painel e visualização.</li><li>Salvamento automático.</li><li>Imagens com os limites e biblioteca de imagens do projeto.</li><li>Projeto ou avulsa, e vínculo de avulsa a projeto.</li><li>"Salvar em PDF" no padrão do orçamento, com diálogo de exportar e o aviso de "Tamanho real".</li><li>No celular: lista, visualização e PDF.</li></ul> | `apr-20`, `apr-21`, `apr-52` a `apr-54`, `apr-57`, `apr-58`, `apr-60`, `apr-63` |
| **6c (tipos de página)** | <ul><li>Aba Páginas completa: adicionar, mover, duplicar (com cópia das imagens no Drive) e excluir.</li><li>Tipos texto & conceito, moodboard, apresentação visual, desenho técnico (imagem e escala digitada), notas técnicas e direitos autorais.</li><li>Bloqueio do PDF por conteúdo além do limite.</li></ul> | `apr-22` a `apr-44`, `apr-61` |
| **6d (prancha)** | <ul><li>Prancha de detalhamento com a imagem do LayOut, na moldura A4 ou A3.</li><li>Download da moldura.</li><li>Rodapé escrito nas posições da moldura.</li><li>Teste do Chromium com páginas de tamanhos diferentes.</li><li>Formatos A3 e 16:9.</li></ul> | `apr-16` a `apr-19`, `apr-45` a `apr-51`, `apr-55`, `apr-56`, `apr-59`, `apr-64` a `apr-66` |
| **6e (edição direta)** | Clicar no texto da visualização e editar, no computador | — |

Deixam de valer, porque não haverá ferramenta de escala nem medição de cota:
- `apr-01` a `apr-15` (escala por DPI e por cota, maior escala que cabe, escala gráfica e carimbo);
- `apr-62` (aviso de escala real calculada).

### 0.2 Decisões que este plano segue

- **Dados:**
  - texto e estrutura ficam em `presentations.data`, em JSON, com limite de 512 KB e mensagem clara no editor;
  - as imagens vão do navegador direto ao Drive e ficam registradas em `presentation_images`.
- **Projeto:**
  - a apresentação pode ser avulsa, e a aba Sem projeto existe;
  - uma avulsa pode ser vinculada a um projeto depois; as imagens e o PDF são movidos junto (P27);
  - vincular um orçamento avulso a projeto fica fora desta fase, como tarefa separada (P26);
  - ao criar a partir de um projeto, nome, cliente e localização são copiados como texto editável;
  - o nome é obrigatório, e um projeto pode ter várias apresentações.
- **Criação:**
  - nada é criado sozinho com o projeto;
  - o documento começa zerado, só com a capa;
  - o botão "Novo" fica só na lista, não no editor.
- **Biblioteca de imagens:**
  - as imagens ficam em `Apresentações/Imagens` do projeto, ou em `Avulsos/Imagens`, e não aparecem em Arquivos do projeto;
  - podem ser reaproveitadas entre as apresentações do mesmo projeto, por quem pode editar;
  - cada avulsa tem a sua própria biblioteca, dentro de `Avulsos`; só as apresentações de um mesmo projeto compartilham imagens (P23);
  - remover ou trocar uma imagem só tira o vínculo;
  - a lixeira do Drive só recebe a imagem quando nenhuma apresentação a usa mais (P22);
  - não há contagem fixa de imagens por apresentação; o limite de 512 KB do documento controla o tamanho (P28);
  - a visualização usa imagem de 1600 px; a exportação usa a resolução original (P8);
  - duplicar uma página com imagem copia o arquivo no Drive (6c). Duplicar apresentação fica fora da 6b (P24).
- **Celular:** lista, visualização e PDF. A edição é só no computador, com painel à esquerda e visualização à direita.
- **PDF:**
  - botão "Salvar em PDF";
  - nome e número sequencial no padrão do orçamento, com a data de emissão do documento no nome (P7);
  - conteúdo além do limite bloqueia o PDF, que nunca sai cortado;
  - o aviso de "Tamanho real" fica no diálogo de exportar, em qualquer apresentação (P25).
- **Limites:** 40 MB por arquivo; 4000 px no lado maior (7200 px na prancha); 512 KB por documento.
- **Escala:** o desenho técnico tem só imagem e escala digitada (por exemplo, 1:50). Não há cota automática, escala gráfica nem carimbo automático.
- **Moldura, na 6d:**
  - dois arquivos PNG prontos no repositório, um A4 e um A3, baixados pelo ERP;
  - aceita a partir de 200 dpi, com 300 dpi como recomendação;
  - recusa proporção mais de 0,5% fora da folha;
  - a prancha importa só PNG;
  - desenho congelado e com versão;
  - a conferência no LayOut fica para a 6d.

### 0.3 Divergências entre `decisoes.md` e `molduras.md`

Resolvidas. O `decisoes.md` foi corrigido nos três pontos e agora diz o mesmo que `molduras.md`:
- a moldura são dois arquivos PNG, um A4 e outro A3;
- a prancha aceita só PNG, e recusa JPEG, WebP e PDF;
- a moldura é baixada pelo ERP, e não pela página offline.

---

## 1. Inventário da 6b

A coluna "Base da 6a" diz o que já existe e pode ser reaproveitado.

### 1.1 Lista, criação e salvamento

| Item | O que a apresentação precisa | Base da 6a | Novo |
|---|---|---|---|
| Lista `/apresentacoes` | Abas Todas e Sem projeto, nome, número, projeto, última alteração e quem alterou; botão "Nova apresentação" | `BudgetsPage.tsx`, `shared.ts` | Colunas próprias |
| Nova apresentação avulsa | Painel com nome obrigatório e projeto opcional | `NewBudgetPanel.tsx`; check `*_name_not_blank` | Textos |
| Nova apresentação no projeto | Botão "Nova apresentação" na página do projeto; copia nome, cliente e localização como texto editável | Botão "Novo orçamento" do projeto | A cópia dos dados do projeto |
| Documento novo | Só a capa, sem texto, valores ou imagens de exemplo | `emptyBudget()` | Documento inicial da apresentação |
| Vincular avulsa a projeto | Escolher o projeto; as imagens da biblioteca da avulsa e o PDF saem de `Avulsos` e vão para a pasta do projeto (P27). O orçamento avulso fica fora (P26) | — | Tudo, inclusive mover arquivos no Drive |
| Salvamento automático | "Salvo às HH:MM", erro ao salvar, alterado em outra aba; ao reabrir, o documento está como foi deixado | PATCH de `budgets` com conflito por `updated_at`; o aviso do editor | Limite de 512 KB |
| Rota já reservada | `/apresentacoes` existe hoje como tela "chega na fase da apresentação" | `src/App.tsx`, `AppShell.tsx` | Trocar pela lista |
| Permissões | Administrador e colaborador criam, editam, exportam e veem a biblioteca. Leitor só vê e baixa o PDF | `documents.write`, `documents.export`, `workspace.read`; matriz `phase2.test.ts` | Somente leitura no editor |

### 1.2 Editor e visualização

| Item | O que precisa na 6b | Base da 6a | Novo |
|---|---|---|---|
| Moldura do editor | Barra superior com Voltar, título, "Salvo às", "Salvar em PDF"; painel à esquerda; visualização à direita | Editor do orçamento; desenhos `erp-editor-apresentacao-*` | Painel com abas |
| Barra da visualização | ‹ ›, "Página NN de T", zoom − % + | — | Zoom de ajuste em A4 (`apr-57`, `apr-58`, `apr-60`) |
| Aba Projeto | 11 campos, todos vazios no início, salvo os copiados do projeto. Formato da página: só A4 na 6b | Campos do orçamento | Campos |
| Aba Páginas | Na 6b, mostra só a capa. Adicionar, mover, duplicar e excluir entram na 6c | — | Lista |
| Aba Página | Capa: 3 composições, 3 cores, 3 tamanhos de marca e uma imagem opcional | — | Tudo |
| Moldura das páginas | Cabeçalho e rodapé das páginas, "NN / TT", capa sem número | — | `apr-20`, `apr-21` (a capa sozinha é o caso de uma página) |
| Celular | Lista, visualização sem editar e o PDF | Telas de 390 da 6a | Visualização só para leitura |

### 1.3 Imagens e biblioteca

| Item | O que precisa | Base da 6a e do ERP | Novo |
|---|---|---|---|
| Inserir | Clique ou arraste no espaço de imagem, ou escolher da biblioteca do projeto | — | Tudo |
| Validação | PNG, JPG e WebP até 40 MB; GIF recusado com aviso | — | `apr-52` a `apr-54` |
| Redução no navegador | Até 4000 px no lado maior; PNG continua PNG, o resto vira JPEG 0,9 | — | Antes do envio |
| Envio direto ao Drive | O navegador envia; a API só abre a sessão e confere o arquivo | `createUploadSession` com `origin`, `UploadGrant` e conferência em `routes/files.ts` | Pasta `Imagens`; registro na biblioteca |
| Biblioteca | Projeto: as imagens já enviadas, para qualquer apresentação dele. Avulsa: só as imagens daquela apresentação (P23). Sem contagem fixa de imagens (P28) | — | Tudo |
| Exibir | Na tela, imagem de 1600 px servida pelo ERP; no PDF, a resolução original do arquivo guardado (P8) | `GET /files/:id/image` (visualização de 1600 px do Drive ou arquivo inteiro até 4 MB) | Rota equivalente para a biblioteca |
| Ferramentas | Trocar, Ajustar/Preencher, zoom de 1 a 4 em passos de 0,15, enquadramento de 0 a 100%, Centro, remover. Sem a ferramenta Escala | — | Tudo |
| Remover e trocar | Tiram só o vínculo. A lixeira do Drive recebe a imagem quando nenhuma apresentação a usa mais (P22) | — | Contagem de uso |
| Duplicar | Fora da 6b: duplicar apresentação não entra (P24), e duplicar página, com cópia do arquivo no Drive, entra na 6c | — | — |
| Imagem ausente | Aviso e espaço que pede para inserir de novo | — | Tudo |

### 1.4 PDF

| Item | O que precisa | Base da 6a | Novo |
|---|---|---|---|
| Botão e diálogo | "Salvar em PDF" abre um diálogo de exportar, com o aviso de "Tamanho real" perto do botão, em qualquer apresentação (P25) | Editor do orçamento (sem diálogo) | O diálogo |
| Geração | No servidor, com o mesmo componente da visualização, em A4 (`apr-63`), com as imagens na resolução original (P8) | `budget-pdf.ts` | Imagens buscadas no Drive pelo servidor |
| Pasta | `Apresentações` do projeto ou `De.Croqui ERP/Avulsos` | `projectSubfolderId`, subpasta `presentations` já prevista | — |
| Nome e número | `Apresentacao-<número>-<nome>-<data>.pdf`, com `-v2`, `-v3`. A data é a de emissão do documento, no padrão do orçamento (P7) | `budgetPdfName`, `fileSlug`, número por `identity` | Ler a data de emissão |
| Sem alteração | Não gera outro PDF igual | `pdf_source_hash`, 409 `no_changes` | — |
| Falhas | 502 `pdf_failed` ou `drive_failed`, versão devolvida, arquivo para a lixeira se o banco falhar | `POST /budgets/:id/pdf` | — |
| Histórico | `presentation.export` no `audit_log` e registro em `project_files` (o PDF aparece em Arquivos; as imagens não) | `budget.export` | — |

---

## 2. Perguntas

### 2.1 Já decididas

| Nº | Pergunta | Decisão |
|---|---|---|
| P1 | Conteúdo de `decisoes-fase-6.md` | Colado e gravado em `revisao-fase6b/decisoes.md` |
| P2 | O que entra na 6b | Divisão em 6b, 6c, 6d e 6e (seção 0.1) |
| P3 | Editor no celular | Não. No celular: lista, visualização e PDF |
| P4 | Com o que o documento novo começa | Só a capa |
| P5 | Campos preenchidos de fábrica | Nenhum. O documento começa zerado; só os dados do projeto são copiados |
| P6 | Dados do projeto | Nome, cliente e localização copiados como texto editável |
| P9 | Pasta das imagens | `Imagens` dentro de `Apresentações` do projeto, ou dentro de `Avulsos`. Não aparecem em Arquivos |
| P10 | Imagem que sai da apresentação | Só tira o vínculo; a lixeira recebe a imagem quando nenhuma apresentação a usa (P22) |
| P11 | Duplicar com imagem | Cria cópia do arquivo no Drive |
| P12 | Limites | 40 MB por arquivo, 4000 px (7200 px na prancha), 512 KB por documento |
| P13 | Aviso de "Tamanho real" | No diálogo de exportar, perto do botão, em qualquer apresentação (P25) |
| P14 | Conteúdo além do limite | Bloqueia o PDF até corrigir. Entra na 6c, com os tipos que podem passar do limite |
| P15 | Nome e número | Mesmo padrão do orçamento, com número sequencial |
| P16 | Nome do botão | "Salvar em PDF" |
| P17 | Edição direto na folha | Não entra na 6b; fica para a 6e |
| P18 | Medição de cota | Não existe |
| P19 | Folha-modelo | 6d: dois PNG prontos no repositório, baixados pelo ERP sem ir ao Drive (ver 0.3) |
| P20 | Botão "Novo" | Só na lista de apresentações |
| P21 | Vincular avulsa a projeto | Sim, e as pastas no Drive são movidas |
| P7 | Data no nome do PDF | Padrão do orçamento, com a data de emissão do documento |
| P8 | Resolução das imagens | 1600 px na visualização; resolução original na exportação |
| P22 | Remover e lixeira | Remover só tira o vínculo; a lixeira só entra quando nenhuma apresentação usa a imagem |
| P23 | Biblioteca das avulsas | Cada avulsa tem a sua, dentro de `Avulsos`; só as de um mesmo projeto compartilham |
| P24 | Duplicar apresentação | Fora da 6b |
| P25 | Aviso de "Tamanho real" | No diálogo de exportar, em qualquer apresentação |
| P26 | Vincular orçamento avulso | Fora desta fase, como tarefa separada |
| P27 | PDF ao vincular | É movido junto com a apresentação |
| P28 | Limite de imagens | Sem contagem fixa; o limite de 512 KB do documento controla o tamanho |

### 2.2 Ainda em aberto

Nenhuma. Ficam três pontos de detalhe, que confiro com você na etapa em que aparecerem:
- **P7:** a data de emissão da capa é texto livre. Proponho seguir o orçamento: usar a data de emissão quando ela estiver como data ("D de mês de AAAA" ou DD/MM/AAAA), e a data de hoje (fuso de São Paulo) quando estiver vazia ou em outro formato.
- **P22:** quando a imagem perde o último vínculo, ela vai para a lixeira do Drive e sai da biblioteca.
- **P27:** ao vincular, o PDF movido passa a aparecer em Arquivos do projeto (`project_files`), como os PDFs das apresentações de projeto.

---

## 3. Desenhos para aprovar no Figcraft

Os desenhos de `design/erp-editor-apresentacao-*` mostram a moldura, a capa e as abas Projeto e Páginas. Os novos seguem `design/moldura-erp.figcraft` e os nove desenhos da 6a. Todos em 1440, salvo onde indicado.

**Saíram do plano:** o desenho técnico com escala (DPI, escala de impressão, escala gráfica, carimbo e zoom bloqueado) e a medição de cota. O desenho técnico simplificado (imagem e escala digitada) passa para a 6c.

### 3.1 Desenhos da 6b

| Nº | Tela | O que precisa ser aprovado |
|---|---|---|
| 6b-01 | Lista de apresentações, abas Todas e Sem projeto, e estado vazio | Colunas, ordem, texto do estado vazio, botão Vinho "Nova apresentação" |
| 6b-02 | Nova apresentação avulsa com nome obrigatório | Campos, mensagem de nome vazio, textos |
| 6b-03 | Página do projeto com "Nova apresentação" e o painel aberto | Posição do botão junto de "Novo orçamento"; aviso de que nome, cliente e localização são copiados |
| 6b-04 | Editor de documento novo, só com a capa, salvo | Barra superior, largura do painel, aba Página da capa, "Salvo às HH:MM" |
| 6b-05 | Erro ao salvar, alterado em outra aba e documento acima de 512 KB | Os avisos da 6a e o texto do limite |
| 6b-06 | Espaço de imagem em todos os estados: vazio, arrastando sobre, enviando, enviado, erro de envio, imagem ausente no Drive | Textos, barra de progresso, aviso de erro em terracota |
| 6b-07 | Ferramentas sobre a imagem: Trocar, Ajustar/Preencher, zoom, Centro, remover | Posição, comportamento ao passar o mouse, texto de remover (só tira o vínculo) |
| 6b-08 | Avisos de envio: formato recusado, arquivo acima de 40 MB, vários arquivos | Textos e tipo de aviso |
| 6b-09 | Biblioteca de imagens: do projeto e da avulsa; grade das imagens, escolher, enviar nova | Onde abre (painel ou diálogo), ordem, o que mostra de cada imagem, estado vazio |
| 6b-10 | Vincular avulsa a projeto: escolher o projeto, confirmar, mover em andamento, erro | Textos e o que o usuário vê enquanto as imagens e o PDF mudam de pasta |
| 6b-11 | Salvar em PDF: diálogo de exportar com o aviso de "Tamanho real", gerando, salvo, sem alterações, erro | O diálogo e o texto do aviso; os avisos da 6a (ardósia e terracota) |
| 6b-12 | Leitor | O que fica escondido e o que fica só para leitura |
| 6b-13 | Celular 390: lista, visualização e PDF; e o editor em 1024 | O que aparece no celular sem edição |

### 3.2 Desenhos das próximas partes (para planejar depois)

| Parte | Desenhos |
|---|---|
| 6c | Aba Páginas completa (adicionar, mover, duplicar com cópia das imagens, excluir); aba Página de cada tipo; desenho técnico com campo de escala digitada; aviso de conteúdo além do limite e PDF bloqueado; diálogos de excluir página e item |
| 6d | Prancha vazia com download da moldura A4 e A3; prancha importada com rodapé; recusa por formato, proporção e resolução; formatos A3 e 16:9 |
| 6e | Edição direta: texto em edição, colar sem formatação, sair com Esc |

Regras que valem para todos:
- tokens no lugar de cor fixa;
- no máximo um botão Vinho por tela;
- Cormorant Garamond e Jost;
- sem emoji e sem exclamação;
- avisos informativos em ardósia (`--feedback-info*`);
- exemplos com nomes fictícios.

---

## 4. Modelo de dados proposto (6b)

Ainda não há migração. A numeração seria `0011`.

### 4.1 Tabela `presentations`

Mesmo padrão de `budgets`, sem `total_cents` e sem `status`. O orçamento tem `status` com `draft` e `sent`, mas só usa `draft`.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | `uuid`, chave, `gen_random_uuid()` | |
| `project_id` | `uuid`, opcional, `references projects(id)` | Vazio = avulsa. Passa a ter valor ao vincular |
| `name` | `text not null` | Check `presentations_name_not_blank`: `length(btrim(name)) > 0` |
| `number` | `integer not null generated always as identity` | "Apresentação nº" |
| `data` | `jsonb not null default '{}'` | Até 512 KB, conferido na API. Imagens só por referência |
| `page_count` | `integer not null default 1` | Para a lista; a capa conta |
| `created_by` | `uuid`, `references users(id) on delete set null` | |
| `updated_at` | `timestamptz not null default now()` | Também detecta o conflito entre abas |
| `pdf_drive_file_id`, `pdf_name`, `pdf_version`, `pdf_exported_at`, `pdf_source_hash` | Como em `budgets` | PDF mais recente e hash do que o gerou |

Índices:
- `presentations_number_idx`: único em `number`;
- `presentations_project_updated_idx`: em `(project_id, updated_at)`.

A RLS fica ligada e sem políticas, como nas outras tabelas.

### 4.2 Tabela `presentation_images` (biblioteca)

Cada linha é um arquivo no Drive que o servidor conferiu no envio.

**Por que a biblioteca é do projeto:** a decisão de reaproveitar imagens entre apresentações liga a imagem ao projeto, e não a uma apresentação.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | `uuid`, chave | É o que o JSON referencia |
| `project_id` | `uuid`, opcional, `references projects(id)` | Biblioteca do projeto. Vazio = imagem de avulsa |
| `owner_presentation_id` | `uuid`, opcional, `references presentations(id)` | Dona da imagem, só na avulsa: cada avulsa tem a sua biblioteca (P23). Ao vincular, fica vazio e `project_id` recebe o projeto |
| `drive_file_id` | `text not null`, único | |
| `file_name` | `text not null` | Nome mostrado na biblioteca |
| `mime_type` | `text not null` | `image/png` ou `image/jpeg` depois da redução |
| `width_px`, `height_px`, `size_bytes` | inteiros, `not null` | |
| `created_by` | `uuid`, `on delete set null` | |
| `created_at` | `timestamptz not null default now()` | |
| `trashed_at` | `timestamptz`, opcional | Quando foi para a lixeira do Drive |

Índices em `(project_id, created_at)` e em `(owner_presentation_id)`. Check `presentation_images_owner`: exatamente um dos dois, `project_id` ou `owner_presentation_id`, tem valor.

### 4.3 Tabela `presentation_image_uses` (vínculos)

Diz quais apresentações usam cada imagem, para aplicar a regra da lixeira sem ler o JSON de todas as apresentações.

| Coluna | Tipo | Observação |
|---|---|---|
| `presentation_id` | `uuid not null`, `references presentations(id)` | |
| `image_id` | `uuid not null`, `references presentation_images(id)` | |

- **Chave:** `(presentation_id, image_id)`. Há também um índice em `image_id`.
- **Sincronização:** a cada salvamento, o servidor lê as imagens citadas em `data` e acerta os vínculos dessa apresentação na mesma transação.
- **Recusa:** se `data` citar uma imagem que não é da biblioteca da apresentação (a do projeto, ou a própria, na avulsa), o servidor recusa com 400.
- **Imagem sem vínculo:** quando uma imagem fica com zero vínculos, vai para a lixeira do Drive e recebe `trashed_at` (P22).

### 4.4 Forma do JSON `data` na 6b

```
{
  "v": 1,
  "projeto": { "nome", "tipo", "cliente", "projetista", "registro", "localizacao",
               "data", "codigo", "marca", "contato", "formato": "a4" },
  "paginas": [
    { "id", "tipo": "capa", "composicao", "cor", "marca",
      "imagem": { "id": "<presentation_images.id>", "ajuste": "fit" | "fill", "zoom", "x", "y" } | null }
  ]
}
```

- **Tipos de página:** na 6c, `paginas` passa a aceitar os outros tipos. O desenho técnico tem `imagem`, `titulo` e `escala` (texto livre). Na 6d entra `prancha`, com o número da versão da moldura.
- **Validação:** a API confere a forma, os tipos, o tamanho (512 KB) e as referências de imagem. Ela recusa texto em base64.

---

## 5. Plano de etapas da 6b

Cada etapa termina com `npm run build` e `npm test` passando. Os testes de gravação rodam em PGlite com o Drive simulado, nunca numa prévia da Vercel. As etapas de tela só começam depois de os desenhos correspondentes serem aprovados.

| Etapa | O que entrega | Critério de aceite | Testes |
|---|---|---|---|
| E0 | Este plano e os desenhos 6b-01 a 6b-13 aprovados | Sua aprovação por escrito | — |
| E1 | Migração `0011`: `presentations`, `presentation_images` e `presentation_image_uses` | Só cria as três tabelas; nenhuma coluna, índice, restrição ou linha das outras tabelas muda | `phase6b-migration.test.ts`, como o da 6a; check do nome |
| E2 | `src/shared/presentation-calc.ts`: numeração, tamanho de redução, zoom de ajuste em A4 | `apr-20`, `apr-21`, `apr-52` a `apr-54`, `apr-57`, `apr-58` e `apr-60` dão a saída gravada no JSON | `phase6b-calc.test.ts`, que lê esses casos do `casos-de-teste.json` |
| E3 | API `/presentations`: lista com projeto e Sem projeto, leitura, criação (só a capa, dados do projeto copiados), salvamento automático com conflito, limite de 512 KB | Nome obrigatório (400 e check); documento novo zerado; 409 de conflito; 413 ou 400 acima de 512 KB; leitor 403 em toda gravação; projeto excluído 404 | `phase6b.test.ts`; linhas novas na matriz de `phase2.test.ts` |
| E4 | Imagens e biblioteca: abrir sessão de envio, concluir com conferência, listar a biblioteca do projeto e a da avulsa, servir a imagem em 1600 px, sincronizar vínculos, regra da lixeira | Só imagem conferida vira linha; referência fora da biblioteca é recusada; uma avulsa não vê imagens de outra; a lixeira só recebe imagem sem vínculo, e nunca uma usada por outra apresentação | `phase6b-images.test.ts` com `fetch` injetado e Drive simulado |
| E5 | Vincular avulsa a projeto: mover as imagens da avulsa e o PDF no Drive, passar as imagens para a biblioteca do projeto, atualizar `project_id` | Os arquivos mudam de pasta; o PDF aparece em Arquivos do projeto; se o Drive falhar no meio, nada muda no banco e o que já foi movido volta | Testes com falha em cada passo do Drive simulado |
| E6 | Telas: lista, Nova apresentação, botão no projeto, celular | Igual a 6b-01 a 6b-03 e 6b-13 | Capturas em 1440, 1024 e 390 |
| E7 | Editor: barra, abas Projeto e Página da capa, visualização, salvamento automático, leitor | Igual a 6b-04, 6b-05 e 6b-12 | Salvamento com conflito e limite |
| E8 | Imagens no editor: inserir, reduzir, enviar, ferramentas, biblioteca, vincular a projeto | Igual a 6b-06 a 6b-10 | Redução de tamanho em teste de unidade |
| E9 | PDF: diálogo de exportar, `presentation-pdf.ts` e `POST /presentations/:id/pdf` | Igual a 6b-11. Pasta certa; nome e número com a data de emissão; imagens na resolução original; versões; 409 `no_changes`; 502 sem gravar nada; `audit_log` e `project_files`; página A4 com o tamanho certo (`apr-63`) | `phase6b-pdf-export.test.ts`, como o da 6a; medição local do PDF |
| E10 | Conferência local completa, capturas e relatório | Tudo bate com os desenhos; tempo e tamanho do PDF medidos | Suíte completa |

Depois da E10, e só com sua aprovação de cada passo: aplicar a migração em produção, fazer o merge, conferir o deploy e fazer um teste real. A 6c, a 6d e a 6e terão um plano próprio cada uma.

---

## 6. Riscos em produção

| Nº | Risco | Mitigação proposta |
|---|---|---|
| R1 | **PDF lento ou sem memória na função da Vercel**, com imagens na resolução original (até 4000 px) baixadas do Drive (P8) | Medir localmente o pior caso: um documento de 512 KB com o máximo de imagens que cabe nele. Se passar do tempo ou da memória, levar a você antes de mudar a regra de P8. Hoje o limite é de 300 s. Mudar memória ou duração exige mexer em `vercel.json` além de `includeFiles`, o que só acontece com sua aprovação. A prancha (6d) refaz a medição |
| R2 | **PDF muito grande para enviar ao Drive** | O envio da 6a já é por sessão retomável. Medir o tamanho no pior caso |
| R3 | **Visualização do Drive ainda não pronta logo depois do envio.** A rota de imagem cai no arquivo inteiro, que só passa até 4 MB, abaixo do limite de 4,5 MB da Vercel | Enquanto o Drive não gera a visualização, o editor mostra a cópia local da imagem recém-enviada. A rota nunca devolve mais de 4 MB |
| R4 | **JSON grande demais.** O Fastify recusa corpos acima de 1 MiB por padrão, e o salvamento envia o documento inteiro | Limite de 512 KB na API, com a mensagem clara no editor. Nenhuma imagem dentro do JSON |
| R5 | **ID de imagem forjado no JSON**, para servir um arquivo que não é da biblioteca | Vínculos conferidos contra `presentation_images` e a biblioteca da apresentação (projeto ou avulsa), a cada salvamento |
| R6 | **Imagem enviada para a lixeira por engano** quando outra apresentação ainda a usa | Contagem por `presentation_image_uses` na mesma transação do salvamento. Lixeira só depois do commit. Teste com duas apresentações usando a mesma imagem |
| R7 | **Vínculo de avulsa interrompido no meio**: parte dos arquivos movida no Drive e o banco sem a mudança | Mover um arquivo por vez, gravar o `project_id` só no fim e, se algo falhar, devolver o que já foi movido. Mover no Drive não apaga nada, então o pior caso é o arquivo ficar na pasta errada |
| R8 | **Arquivos órfãos no Drive**: o envio termina, mas a conclusão falha | A conclusão confere e, se falhar, manda o arquivo para a lixeira, como em `files.ts` |
| R9 | **CORS ou sessão de envio expirada** | O mesmo fluxo de `createUploadSession` com `origin` já funciona nos arquivos do projeto. Sessão nova a cada tentativa |
| R10 | **O Drive do ERP ainda não move nem copia arquivos.** `DriveClient` não tem essas operações | Na 6b, uma operação nova para mudar o arquivo de pasta (vínculo a projeto). Na 6c, outra para copiar (duplicar página). As duas testadas com `fetch` injetado, como o envio da 6a |
| R11 | **Arquivos que a função não encontra**: CSS da apresentação fora do pacote, ou import sem `.js` | Acrescentar em `includeFiles`, a única mudança permitida em `vercel.json`. Estender `server-imports.test.ts` ao gerador da apresentação |
| R12 | **Dados reais em exemplos ou testes** | Só nomes fictícios ("Projeto Teste", "Cliente Teste") |
| R13 | **Gravação na prévia da Vercel**, que aponta para o banco de produção | Testes só em PGlite; nenhuma gravação em prévia; nenhum push sem combinar |
| R14 | **Envio interrompido no meio** | A referência só entra no documento depois da conclusão |
| R15 | **Logs curtos**: no plano Hobby, a Vercel guarda só uma hora de logs | Conferir logs logo depois de cada teste real |
| R16 | **Na 6d: prancha A3 dentro de documento A4**, que depende do Chromium da Vercel | Testar `apr-66` com a mesma versão do Chromium antes de começar a 6d |
