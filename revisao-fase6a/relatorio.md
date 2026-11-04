# Fase 6a: Orçamento (relatório parcial)

Branch `feat/fase-6a-orcamento`, criada da `main` em `19d8f70`. Ainda só no computador: sem push, merge ou deploy, e nenhuma migração em produção.

**Situação:** banco, API, cálculos e telas estão prontos e testados localmente. Falta o PDF (opção A, gerado no servidor), que espera a sua aprovação das bibliotecas (seção 6).

## 1. Commits

| Commit | O que faz |
|---|---|
| `313d341` | Migração `0008_orcamentos`: tabela `budgets`. Aplicada só no PGlite |
| `e5304de` | Módulo de cálculo e textos das folhas, conferido com os casos do arquivo original |
| `c22aa34` | API `/budgets`: lista, leitura, criação e salvamento automático com aviso de conflito |
| `1c7f535` | Os nove desenhos aprovados (Figcraft) |
| `e0a62b8` | Lista com cliente e última alteração |
| `46fe071` | Telas: lista de Orçamentos, painel Novo orçamento e editor. Este commit também traz a mudança do módulo de cálculo de lugar, e sozinho não compila; o commit seguinte completa a mudança |
| `98d4f47` | Cálculo em `src/shared` e divisão dos ambientes medida na folha |
| `c142c9d` | Ajustes do celular e do espaçamento do painel |
| `42d1004` | Capturas locais em 1440, 1024 e 390 |

## 2. Banco

Tabela nova `budgets`. Nenhuma tabela existente mudou.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid | |
| `project_id` | uuid, opcional | Vazio = orçamento avulso. Fica preparado para vincular depois |
| `name` | texto obrigatório | O banco também recusa vazio ou só espaços (`budgets_name_not_blank`) |
| `number` | inteiro sequencial, único | Pode pular números quando uma inserção é recusada, nunca repete |
| `status` | `draft` ou `sent` | Só `draft` em uso |
| `data` | JSON | Os campos do painel e a lista de ambientes |
| `total_cents` | inteiro | Maior total entre as opções marcadas, para listas |
| `created_by` | uuid | |
| `updated_at` | data e hora | Também serve para detectar o conflito entre abas |

A RLS fica ligada e sem políticas, como nas outras tabelas.

**Teste da migração** (`tests/phase6a-migration.test.ts`): compara o banco antes e depois da migração e confere que colunas, restrições, índices, tipos, RLS e linhas das tabelas existentes não mudaram.

## 3. Testes

| Suíte | Resultado |
|---|---|
| Completa (`vitest run`) | 504 testes em 22 arquivos, todos passaram |
| Build (`tsc` e `vite build`) | Passou |
| `phase2.test.ts` (matriz de permissões) | 75 testes passaram, inclusive "Criar e editar orçamento e apresentação" (administrador e colaborador sim, leitor 403) |
| `phase6a.test.ts` (API) | 16 testes |
| `phase6a-calc.test.ts` (cálculos) | 33 testes |
| `phase6a-migration.test.ts` | 2 testes |

O que a API de orçamentos testa:
- **Nome obrigatório:** vazio, só espaços ou ausente responde 400 e nada é gravado; acima de 120 caracteres também é recusado.
- **Salvamento:** fechar e reabrir, com um servidor novo sobre o mesmo banco, devolve os mesmos dados.
- **Permissões:** administrador e colaborador criam e editam; leitor recebe 403 ao criar e ao editar, e só lê.
- **Conflito:** um salvamento sobre uma versão antiga responde 409 e não sobrescreve.
- **Vários orçamentos:** um projeto aceita mais de um; criar projeto não cria orçamento.
- **audit_log:** cada gravação registra só o que mudou, sem copiar o conteúdo do orçamento. Nenhum teste apaga ou altera linhas do `audit_log`.

## 4. Casos de cálculo

Todos os 29 casos de `revisao-fase6/casos-de-teste.json` foram conferidos. O arquivo de casos veio sem alteração da branch `feat/fase-6-orcamento-apresentacao`, e o teste confere o SHA-256 dele.

| Casos | Resultado |
|---|---|
| `orc-01`, `02`, `04` a `07`, `09` a `11`, `13` a `24` | Iguais ao arquivo original |
| `orc-03` | **Exceção:** arredondamento. O original mostra o total R$ 100,01; o ERP mostra R$ 100,02, a soma de R$ 100,01 e R$ 0,01 |
| `orc-08` | **Exceção:** arredondamento. O original mostra o total R$ 1.234.567,90; o ERP mostra R$ 1.234.567,89, a soma de R$ 1.234.567,89 e R$ 0,00 |
| `orc-12` | **Exceção:** singular. "Render 3D (1 ambientes × …)" passa a ser "Render 3D (1 ambiente × …)" |
| `orc-25` (Restaurar exemplo) | Não se aplica: não há exemplo, e o orçamento novo começa zerado |
| `orc-26` | Conferido na tela (3 folhas A4); falta conferir no PDF gerado |
| `orc-27`, `orc-28` | Com 10 ou 20 ambientes, a lista passa para uma folha de continuação completa e todas as folhas ficam em 297 mm. No PDF, falta conferir |
| `orc-29` (texto editado na folha) | Não se aplica: os textos fixos não são editáveis na folha (decisão 1) |

**Regra do arredondamento:**
- cada linha é arredondada em centavos, com a metade para longe do zero;
- o valor é lido em decimal, para que 100,005 vire 100,01;
- o total é a soma das linhas arredondadas.

## 5. Mudanças intencionais em relação ao arquivo original

1. **Arredondamento:** o total soma as linhas já arredondadas.
2. **Singular:** "1 ambiente", também na linha do render.
3. **Folha de continuação:** com muitos ambientes, a lista continua em outra folha A4 completa, com cabeçalho, rodapé e numeração. Antes, a folha crescia além de 297 mm.
   - A primeira folha da Opção 02 leva até 6 ambientes, e as de continuação até 18.
   - Se nomes longos não couberem, a prévia mede a folha e passa um ambiente por vez para a seguinte.
4. **Textos fixos:** observações, inclusos e a nota só mudam no código, não na folha.
5. **Remover ambiente:** pede confirmação ("Remover este ambiente?").
6. **Começa zerado:** sem "Restaurar exemplo" e sem nomes ou telefones de pessoas reais. Os dados de teste locais são fictícios.
7. **Armazenamento:** os dados ficam no banco do ERP (`budgets.data`), não no navegador, com "Salvo às HH:MM" na barra.
8. **Erros de salvamento:**
   - Falha ao salvar: "Não salvo", com aviso em terracota e nova tentativa automática a cada 10 s, além de "Tentar agora".
   - Alteração em outra aba: aviso em ocre, sem sobrescrever o que está gravado.

## 6. PDF: pendente

- **Escolha:** opção A, gerado no servidor.
- **Dependências a instalar, quando você aprovar:**
  - `@sparticuz/chromium` 153.0.0 (70,1 MB em disco);
  - `puppeteer-core` 25.11.0, a versão compatível com o Chromium 153 (6,1 MB, mais cerca de 14 MB de dependências).
- **Tamanho da função:** a `api` deve crescer cerca de 85 a 90 MB.
- **Teste local:** com o Edge do Windows e o Drive simulado, sem a prévia da Vercel e sem gravar no Drive de produção.
- O botão "Salvar em PDF" está na tela, mas desligado até lá.

## 7. Ponto em aberto

- **O que acontece:** com o texto do imóvel muito longo (cinco linhas ou mais), a folha da Opção 01 passa de 297 mm. Ela não tem lista para dividir, então a parte de baixo fica cortada. A folha da Opção 02 já se ajusta pela medição.
- **Opções:**
  - limitar o texto do imóvel a três linhas no painel, como no arquivo original;
  - ou reduzir o tamanho da letra do imóvel quando o texto for longo.

## 8. Capturas

As capturas estão em `revisao-fase6a/capturas/`, geradas com o servidor local: banco em memória, Drive simulado e nada de produção. O arquivo `verificacao.txt` lista as 33 conferências feitas na tela, todas aprovadas.

| Largura | Capturas |
|---|---|
| 1440 | 01 a 12: lista (Todos e Sem projeto), novo orçamento sem nome, editor zerado, editor preenchido, remover ambiente, erro ao salvar, alterado em outra aba, folha de continuação, projeto com o botão e com o painel, leitor |
| 1024 | 13 e 14: lista e editor (painel de 360 px) |
| 390 | 15 a 19: lista com abas, novo orçamento sem nome, editor (Preencher e Ver folhas) e página do projeto |

Os desenhos aprovados estão em `revisao-fase6a/desenhos/`.
