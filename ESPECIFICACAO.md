# ESPECIFICACAO — ERP De.Croqui

Documento de referência para a implementação. Diz o que construir, com quais decisões e em que ordem. Os desenhos aprovados estão em `design/` e o design system em `../DESIGN.md`. Em caso de conflito, a ordem de prioridade é: esta especificação > desenhos aprovados > `DESIGN.md` > `Brand Kit.html`.

Status: versão 1, para revisão. Itens marcados com **[CONFIRMAR]** dependem de uma decisão do usuário.

---

## 1. Escopo

Um sistema pessoal de gestão para o estúdio De.Croqui, com ERP simplificado. Inclui:

- Login com Google, com lista de contas autorizadas.
- Colaboradores e papéis.
- Projetos, com pasta própria no Google Drive.
- Processos (Kanban), em que cada card é um projeto e a coluna é a etapa.
- Agenda com sincronização de duas vias com o Google Agenda.
- Orçamento e apresentação de projeto, portados dos arquivos offline de referência.
- Dashboard, com dados das telas acima.

Fora do escopo nesta versão: faturamento, estoque, folha de pagamento, integrações de pagamento, aplicativo móvel.

## 2. Decisões de base

| Tema | Decisão |
|---|---|
| Onde roda | No computador do administrador (Windows), em `localhost`. Sem Vercel e sem Supabase nesta fase. |
| Front-end | React + Vite + TypeScript. |
| Back-end | Node.js com Fastify. Roda na mesma máquina. |
| Banco | PostgreSQL local, acessado com Drizzle ORM. Escolhido para facilitar a ida ao Supabase depois, que também é Postgres. |
| Arquivos e imagens | Google Drive. O banco guarda só IDs e metadados. |
| Login | Somente Google (OAuth 2.0 com PKCE e `state`). Sem senha. Sem cadastro público. |
| Autorização | Papel definido no sistema, checado no back-end a cada operação. |
| Design | Seguir `DESIGN.md`: tokens CSS, componentes do `_ds_bundle.js`, nenhum hexadecimal fixo. |

Versões: usar a versão estável atual de cada biblioteca na data da implementação. Não fixar versões antigas.

## 3. Arquitetura

```
Navegador (React)  <-- localhost:5173 (dev) -->  Back-end (Fastify, localhost:3001)
                                                    |-- PostgreSQL (localhost:5432)
                                                    |-- Google Calendar API
                                                    |-- Google Drive API
                                                    |-- Google OAuth (login)
```

- O back-end é o único que fala com o Google e com o banco. O navegador nunca recebe tokens do Google.
- Sessão: cookie `httpOnly`, `secure` quando houver HTTPS, `sameSite=lax`.
- Segredos (ID e segredo do cliente OAuth, chave de sessão, string de conexão) ficam em `.env` na raiz do back-end. O `.env` não vai para controle de versão.
- Redirecionamento OAuth local: `http://localhost:3001/auth/google/callback`.

## 4. Modelo de dados

Tabelas principais (nomes em inglês, no código):

- **users**: `id`, `google_sub` (único, identificador fixo da conta Google), `email` (único), `name`, `role` (`admin` | `member` | `viewer`), `status` (`invited` | `active` | `disabled`), `last_login_at`, `created_at`.
- **sessions**: `id`, `user_id`, `expires_at`.
- **stages**: `id`, `name`, `position`, `created_at`. Etapas do Kanban (padrão: Briefing, Levantamento, Projeto, Orçamento, Aprovação, Execução, Entrega).
- **projects**: `id`, `name`, `client_name`, `stage_id`, `owner_user_id`, `drive_folder_id`, `deadline`, `status`, `created_at`, `updated_at`.
- **project_stage_history**: `id`, `project_id`, `from_stage_id`, `to_stage_id`, `user_id`, `at`. Registra cada arrasto.
- **events**: `id`, `title`, `starts_at`, `ends_at`, `location`, `description`, `project_id` (opcional), `source` (`erp` | `google`), `google_event_id` (opcional, único), `google_etag`, `created_by`, `updated_at`, `sync_status` (`synced` | `pending` | `error`).
- **calendar_sync_state**: `id`, `user_id`, `sync_token`, `last_synced_at`, `last_error`.
- **budgets**: `id`, `project_id`, `number`, `status` (`draft` | `sent` | `approved`), `data` (JSON com o conteúdo do editor), `total_cents`, `created_by`, `updated_at`.
- **presentations**: `id`, `project_id`, `status`, `data` (JSON com o conteúdo do editor), `updated_at`.
- **audit_log**: `id`, `user_id`, `action`, `entity`, `entity_id`, `payload` (JSON), `at`.

Regras:
- Valores monetários em centavos, inteiros. Nunca float.
- Exclusão de projeto e de etapa é lógica (`deleted_at`), exceto quando indicado.
- Toda escrita registra uma linha em `audit_log`.

## 5. Papéis e permissões

| Ação | Administrador | Colaborador | Somente leitura |
|---|:-:|:-:|:-:|
| Entrar com Google (conta autorizada) | sim | sim | sim |
| Ver colaboradores | sim | não | não |
| Convidar, alterar papel, desativar colaborador | sim | não | não |
| Ver projetos, processos, agenda, dashboard | sim | sim | sim |
| Criar e editar projetos | sim | sim | não |
| Arrastar projeto no Kanban (mudar etapa) | sim | sim | não |
| Criar e editar eventos (ERP) | sim | sim | não |
| Criar, renomear, remover etapas | sim | não | não |
| Excluir projeto | sim | não | não |
| Criar e editar orçamento e apresentação | sim | sim | não |
| Exportar PDF de orçamento e apresentação (e salvar o PDF na pasta do projeto) | sim | sim | não |
| Ver arquivos e notas do projeto | sim | sim | sim |
| Enviar arquivos e criar notas | sim | sim | não |
| Pedir exclusão de arquivo, nota ou projeto | sim | sim | não |
| Excluir arquivo ou nota diretamente | sim | não | não |
| Ver, aprovar e recusar pedidos de exclusão | sim | não | não |

Regra de implementação: a permissão é verificada no back-end em toda rota de escrita. A interface só esconde botões; não é ela que protege os dados.

Permissões no código (`api/_app/permissions.ts`): `users.read`, `users.manage`, `workspace.read`, `projects.write`, `projects.move`, `events.write`, `stages.manage`, `projects.delete`, `documents.write`, `documents.export`, `content.write`, `deletion.request`, `content.delete`, `deletion.decide`.

Pedidos de exclusão (Fase 3b):
- Excluir arquivo, nota ou projeto é só da administração. O colaborador pede a exclusão, com motivo opcional, e a administração aprova ou recusa na tela "Pedidos de exclusão" (menu do avatar).
- Só existe um pedido pendente por item. Quem pediu não aprova nem recusa o próprio pedido.
- Aprovar um arquivo manda o arquivo para a lixeira do Drive e marca o registro como excluído. Aprovar nota ou projeto só marca o registro no ERP; a pasta do projeto continua no Drive.
- Exclusão direta pela administração fecha o pedido pendente do mesmo item.
- Tudo é exclusão lógica (`deleted_at`) e fica no `audit_log`.

Consistência com o Drive: a permissão no ERP e a permissão no Drive são checadas juntas. Se o ERP bloquear uma ação, o Drive não é alterado, mesmo que a pasta esteja compartilhada com a pessoa.

## 6. Login e colaboradores

Fluxo de login:
1. O usuário clica em "Entrar com Google".
2. O back-end gera `state` e o desafio PKCE, e redireciona ao Google com os escopos de login e de Agenda/Drive.
3. No retorno, o back-end troca o código por tokens e valida o ID token (assinatura, `aud`, `iss`, expiração e `email_verified = true`).
4. Procura o usuário pelo `google_sub`. Se não achar, procura pelo e-mail com status `invited`. Se achar, grava o `google_sub` e muda para `active`. Se não achar nenhum, recusa com a mensagem da tela de login e não cria conta.
5. Cria a sessão e grava o refresh token criptografado, usado para a Agenda.

Convite de colaborador:
- Admin cria o registro com e-mail, nome e papel. O status começa como `invited`.
- Ao entrar pela primeira vez, a conta vira `active`.
- Desativar muda o status para `disabled`. A sessão ativa é encerrada no próximo acesso.
- Remover só é permitido para `invited` ou `disabled`, e o registro fica no `audit_log`.

Escopos OAuth: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/calendar`, `https://www.googleapis.com/auth/drive`.

Google Cloud (passo a passo está na conversa): modo de teste, contas de teste cadastradas, validade do refresh token de cerca de 7 dias no modo de teste, aceito pelo usuário.

## 7. Google Drive

Estrutura, criada pelo sistema:

```
De.Croqui ERP/                          <- pasta raiz, criada na primeira execução
  Projetos/
    <Nome do cliente> - <Nome do projeto>/
      Orçamentos/
      Apresentações/
      Contratos/
      Fotos/
```

- A pasta raiz é criada uma vez, e o ID fica salvo em configuração.
- Cada projeto cria sua pasta e as subpastas padrão. O ID da pasta do projeto vai para `projects.drive_folder_id`.
- Renomear um projeto renomeia a pasta, sem trocar o ID.
- Todos os arquivos ficam dentro da pasta raiz.

Dono dos arquivos (decidido): todas as leituras e escritas no Drive usam o token do administrador (`ADMIN_EMAIL`), guardado criptografado. Todos os arquivos ficam na conta do administrador. A permissão de quem pode fazer o quê fica no ERP, conforme a seção 5.

Configuração: os IDs de "De.Croqui ERP" e de "Projetos" ficam na tabela `app_settings`. Se uma dessas pastas for apagada no Drive, ela é criada de novo no próximo projeto. Uma subpasta padrão apagada também é recriada no próximo envio.

Arquivos do projeto (Fase 3b):
- Os metadados ficam em `project_files`: ID no Drive, nome, tipo, tamanho, subpasta, origem (envio ou PDF exportado), quem enviou e quando. A lista da tela vem dessa tabela; um arquivo posto direto no Drive, fora do ERP, não aparece na lista.
- Envio: o servidor abre uma sessão de upload retomável no Drive, na subpasta escolhida, liberada para o endereço do ERP, e devolve o endereço da sessão com uma autorização assinada. O navegador envia o arquivo direto para o Drive, sem passar pelo servidor do ERP (limite de cerca de 4,5 MB por requisição na Vercel). No fim, o navegador confirma; o servidor confere no Drive se o arquivo está na pasta autorizada, com o nome e o tamanho autorizados, e só então grava o registro. Envio que falha ou é cancelado não deixa registro no banco; arquivo que não confere vai para a lixeira.
- Pela tela do projeto só dá para enviar para Fotos ou Contratos. A raiz da pasta do projeto não é opção.
- PDF exportado no editor: vai para Orçamentos ou Apresentações com o nome "<Orçamento | Apresentação> - <Projeto> - <dd-mm-aaaa>.pdf", pelo mesmo caminho de envio direto, e aparece na lista de arquivos. Os editores chegam na Fase 6 e usam `savePdfExport` (`src/api/files.ts`).
- Visualização: dentro do ERP, numa janela com o link de pré-visualização do Drive (`/file/d/<id>/preview`). O Google só mostra o arquivo para quem está conectado, no navegador, com uma conta que tenha acesso à pasta; por isso a pasta raiz precisa estar compartilhada com cada colaborador. As miniaturas das imagens passam pelo servidor do ERP e não dependem disso.
- Excluir arquivo (administração, direto ou ao aprovar um pedido) manda o arquivo para a lixeira do Drive, de onde ele pode ser recuperado por 30 dias.

Notas do projeto: ficam só no banco (`project_notes`), com texto, autor e data. Não vão para o Drive. Edição de nota fica para depois.

Compartilhamento: a pasta raiz é compartilhada com cada colaborador ao ser convidado, para ele também ver os arquivos pelo Drive, como Leitor ou Editor conforme o papel. Essa etapa é um passo de convite, não é checada a cada operação.

Escopo do Drive: `drive` completo, para ver as pastas compartilhadas pelo administrador. O escopo `drive.file` não serve, porque não mostra as pastas criadas por outra conta.

## 8. Google Agenda: sincronização de duas vias

Premissa: o app roda em localhost, sem endereço público. Por isso, o Google não consegue enviar notificações (push) para o sistema. A sincronização é feita por consulta periódica.

Entrada (Google para ERP):
- Consulta incremental com `syncToken`, a cada 2 minutos enquanto o sistema estiver aberto, e uma vez ao iniciar.
- Eventos novos e alterados entram com `source = google`. Eventos apagados no Google são marcados como cancelados no ERP.
- Se o `syncToken` expirar (código 410), faz uma sincronização completa e recomeça.

Saída (ERP para Google):
- Evento criado ou editado no ERP vai para o Google na hora. Se o Google falhar, fica `sync_status = pending` e é reenviado.
- Ao criar, guarda o `google_event_id`. Ao editar, usa o `google_etag` para não sobrescrever mudança mais nova (controle otimista).

Conflito (mesmo evento alterado nos dois lados): vence a alteração mais recente, pelo horário de modificação. A perda é registrada no `audit_log` com os dois valores, para conferência.

Calendário usado **[CONFIRMAR]**: proposta de que o ERP sincronize o calendário principal do administrador. Colaboradores que quiserem sincronizar a própria agenda conectam a própria conta depois. Os eventos de cada colaborador ficam visíveis só para ele, salvo quando o evento estiver vinculado a um projeto.

Quando o sistema for para a Vercel, a sincronização pode passar a usar notificações push, em vez de consulta periódica.

## 9. Telas e arquivos de desenho

Todos os desenhos aprovados ficam em `design/`. O arquivo do Figcraft completo é `design/moldura-erp.figcraft`.

| Tela | Desenhos (1440px) | Rota |
|---|---|---|
| Login | `erp-login-1440.png`, `erp-login-erro-1440.png`, `erp-login-carregando-1440.png` | `/entrar` |
| Colaboradores | `erp-colaboradores-*.png` (7 telas) | `/colaboradores` (pelo avatar) |
| Agenda | `erp-agenda-*.png` (dia, semana, mês, lista, evento aberto, novo evento, erro) | `/agenda` |
| Processos | `erp-processos-*.png` (arrastando, nova etapa, remover etapa, erro, etapa atualizada) | `/processos` |
| Projetos | `erp-projetos-e-editor-1440.png` | `/projetos` |
| Orçamento (editor) | `erp-editor-orcamento-1440-rolagem-completa.png` | `/projetos/:id/orcamentos/:orcId` |
| Apresentação (editor) | `erp-editor-apresentacao-*.png` | `/projetos/:id/apresentacoes/:apId` |
| Dashboard | `erp-dashboard-*.png` | `/` (tela inicial) |

Moldura: menu lateral com Agenda, Processos, Projetos, Orçamentos, Apresentação e Dashboard (em breve), nesta ordem. Orçamento e apresentação, quando abertos, escondem o menu lateral e mostram botão "Voltar" para a tela de origem. Ver `erp-projetos-e-editor-1440.png`.

Dashboard: usa só dados das telas acima. Indicadores: projetos em andamento, prazos atrasados, compromissos nos próximos 7 dias, orçamentos aguardando aprovação. Blocos: próximos compromissos, projetos por etapa, prazos atrasados, orçamentos recentes, apresentações recentes.

Projetos e etapas: a aba Projetos abre a lista, sem projeto selecionado. Criar etapa, remover etapa com destino para os projetos existentes, e arrastar card atualiza `projects.stage_id` e grava em `project_stage_history`.

## 10. Orçamento e apresentação (portar, não recriar)

Os arquivos de referência são:
- `referencias-offline/Orcamento De.Croqui (offline).html`
- `referencias-offline/Apresentacao De.Croqui (offline).html`

São arquivos únicos, com tudo embutido. Ambos funcionam hoje.

Regras:
1. Antes de codar, ler o arquivo inteiro e extrair a lista de funcionalidades: campos, seções, cálculos, botões, exportação e como os dados são salvos. Esta lista é o contrato da tela. Nenhuma funcionalidade fora dela.
2. Manter os cálculos idênticos. Testar com os mesmos valores de entrada do arquivo original e conferir o mesmo resultado.
3. Trocar o layout pelo do ERP: editor com menu lateral escondido, painel de edição à esquerda, documento à direita, barra superior com "Voltar", "Salvar" e "Exportar PDF".
4. Dados que hoje estão no arquivo passam a ser salvos em `budgets.data` e `presentations.data`.
5. Exportação PDF: usar a impressão do navegador com folha de estilo A4. Conferir se o arquivo original já faz isso; se fizer, manter.

Pendente: a lista de funcionalidades ainda não foi extraída. Ela vai para aprovação antes da Fase 6.

## 11. Regras do design

Seguir `DESIGN.md` estritamente. Resumo do que mais afeta a implementação:
- Tokens só por variável CSS (`styles.css`). Nenhum hexadecimal fixo.
- Componentes do `_ds_bundle.js` antes de criar novos (`window.DeCroquiDesignSystem_5f8fc8`).
- Logo sempre do `assets/logo/`, nunca escrito como texto.
- Máximo um botão preenchido em Vinho por tela.
- Fontes: Cormorant Garamond (títulos) e Jost (corpo). Nenhuma outra.
- Texto em pt-BR, você/nós, sem emoji e sem ponto de exclamação.
- Ícones Lucide, stroke 1.25.
- Não editar arquivos gerados (`_ds_*`, `_adherence*`, `support.js`).

## 12. Fases e critérios de aceite

**Fase 1: base.** Projeto criado, PostgreSQL com migrações, back-end com Fastify, login com Google, lista de autorizados, moldura com menu.
Aceite: entrar com conta autorizada; conta não autorizada vê a mensagem; sessão expira; rota protegida recusa acesso sem sessão.

**Fase 2: colaboradores e permissões.**
Aceite: admin convida, altera papel e desativa; cada papel só faz o que a seção 5 permite, testado no back-end.

**Fase 3: projetos e Drive.**
Aceite: criar projeto cria a pasta no Drive com as subpastas; renomear mantém o ID; colaborador convidado vê a pasta no Drive.

**Fase 4: processos (Kanban).**
Aceite: arrastar muda a etapa no banco e no histórico; criar e remover etapa; remoção com projetos pede destino.

**Fase 5: agenda.**
Aceite: evento criado no ERP aparece no Google e o contrário; alteração simultânea resolve por data e registra; falha de rede deixa `pending` e reenvia.

**Fase 6: orçamento e apresentação.**
Aceite: cálculos iguais ao arquivo original com os mesmos valores; exportação PDF em A4; nenhuma funcionalidade fora da lista aprovada.

**Fase 7: dashboard.**
Aceite: cada indicador bate com a tela de origem.

Cada fase termina com revisão do usuário antes de começar a próxima.

## 13. Configuração local

Pré-requisitos no Windows:
- Node.js LTS.
- PostgreSQL (instalado com `winget install PostgreSQL.PostgreSQL`).
- Projeto no Google Cloud com Calendar API e Drive API ativas, tela de consentimento em modo de teste, ID e segredo do cliente OAuth.

Variáveis de ambiente (`.env` no back-end):
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` = `http://localhost:3001/auth/google/callback`
- `SESSION_SECRET`
- `ADMIN_EMAIL` (primeiro administrador, criado na primeira execução)

## 14. Pontos em aberto

1. Dono dos arquivos no Drive (seção 7): administrador ou cada pessoa. Proposta: administrador.
2. Calendário sincronizado (seção 8): só o do administrador, ou cada pessoa com a própria agenda. Proposta: administrador.
3. Permissões marcadas com **[CONFIRMAR]** na seção 5.
4. Lista de funcionalidades dos arquivos offline (seção 10), a ser extraída antes da Fase 6.
5. Caminho final das referências offline dentro de `erp-decroqui/referencias-offline/`.
