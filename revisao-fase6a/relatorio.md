# Fase 6a: Orçamento

Branch `feat/fase-6a-orcamento`, criada da `main` em `19d8f70`. Ainda só no computador: sem push, merge ou deploy, sem migração em produção e sem envio ao Drive de produção.

**Situação:** banco, API, cálculos, telas e PDF estão prontos e testados localmente. O PDF é gerado no servidor (opção A) e enviado ao Drive simulado. O que ainda depende da Vercel está na seção 9.

## 1. Commits

Cada commit compila sozinho (`tsc` conferido em cada um).

| Commit | O que faz |
|---|---|
| `313d341` | Migração `0008_orcamentos`: tabela `budgets`. Aplicada só no PGlite |
| `e5304de` | Módulo de cálculo e textos das folhas, conferido com os casos do arquivo original |
| `c22aa34` | API `/budgets`: lista, leitura, criação e salvamento automático com aviso de conflito |
| `1c7f535` | Os nove desenhos aprovados (Figcraft) |
| `e0a62b8` | Lista com cliente e última alteração |
| `33de2aa` | Telas: lista de Orçamentos, painel Novo orçamento e editor. O cálculo passa para `src/shared`, e a divisão dos ambientes é medida na folha (os antigos `46fe071` e `98d4f47`, juntados) |
| `9e88345` | Ajustes do celular e do espaçamento do painel |
| `991b6a4` | Capturas locais em 1440, 1024 e 390 |
| `2e1f8b2` | Relatório parcial |
| `3eacf81` | Imóvel limitado a três linhas na folha, com aviso no painel |
| `c60a5cc` | Geração do PDF no servidor; bibliotecas `@sparticuz/chromium` 153.0.0 e `puppeteer-core` 25.11.0 |
| `bd58063` | Migração `0009_orcamento_pdf` (PDF ligado ao orçamento) e envio ao Drive pelo servidor |
| `f3ed540` | Rota `POST /budgets/:id/pdf` |
| `8591cb5` | Botão "Salvar em PDF" no editor |

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
| `pdf_drive_file_id` | texto, opcional | ID no Drive do PDF mais recente (migração 0009) |
| `pdf_name` | texto, opcional | Nome desse arquivo |
| `pdf_version` | inteiro, padrão 0 | Quantas exportações o orçamento teve |
| `pdf_exported_at` | data e hora, opcional | Quando o PDF mais recente foi salvo |

- A RLS fica ligada e sem políticas, como nas outras tabelas.
- As colunas de PDF valem para os dois casos. O avulso usa só elas. O de projeto também aparece em `project_files`, como os outros PDFs exportados, para surgir nos arquivos do projeto.
- **Teste das migrações** (`tests/phase6a-migration.test.ts`): compara o banco antes e depois de cada migração. A 0008 só cria `budgets` e o tipo `budget_status`; a 0009 só acrescenta as quatro colunas de PDF. Colunas, restrições, índices, tipos, RLS e linhas das outras tabelas não mudam.

## 3. PDF

### Geração

- **Como:** o servidor monta o HTML das folhas com o mesmo componente da prévia, com CSS, fontes e logo embutidos, e o Chromium imprime em A4. Na Vercel o navegador vem do `@sparticuz/chromium`; no computador, do Edge instalado.
- **Divisão das folhas:** é medida também no servidor. Se uma folha passa de 297 mm (nomes longos), um ambiente por vez vai para a folha seguinte, como na prévia.
- **Conteúdo:** o PDF usa o que está gravado no banco. O botão salva antes o que estiver pendente.

### Rota

`POST /budgets/:id/pdf`, com a permissão `documents.export` conferida no servidor:

| Papel | Resultado |
|---|---|
| Administrador | Exporta |
| Colaborador | Exporta |
| Leitor | 403, mesmo chamando a rota direto. Nada é gerado nem enviado |
| Sem sessão | 401 |

- **Pasta:**
  - orçamento de projeto: `Orçamentos`, dentro da pasta do projeto;
  - orçamento avulso: `De.Croqui ERP/Avulsos`.
  - A pasta é criada se não existir, inclusive se foi apagada no Drive.
- **Nome do arquivo:** `Orcamento-<número>-<nome>-<data>.pdf`, por exemplo `Orcamento-12-Sala-de-Jantar-2026-11-04.pdf`.
  - Só letras sem acento, números e hífen, e o nome vai até 60 caracteres. Sem nada que sirva, o nome vira `Sem-nome`.
  - A data é a de emissão, ou seja, o campo Data do orçamento. Se estiver vazio, vale a data de hoje, no fuso de São Paulo.
- **Exportar de novo:** cria uma nova versão, com `-v2`, `-v3` no nome.
  - O orçamento aponta para a mais recente, e o editor mostra "PDF v2 às 21:02", com link para o Drive.
  - As versões anteriores continuam no Drive e nos arquivos do projeto.
  - Duas exportações ao mesmo tempo recebem versões diferentes.
- **Falhas:**

  | Onde falhou | Resposta |
  |---|---|
  | Geração | 502 `pdf_failed` |
  | Envio ao Drive | 502 `drive_failed` |

  - Nos dois casos nada é gravado e o número da versão é devolvido.
  - Se o banco falhar depois do envio, o arquivo vai para a lixeira do Drive.
- **Histórico:** cada exportação grava `budget.export` no `audit_log` com nome do arquivo, versão, ID no Drive, tamanho, páginas e pasta.
  - Exportar não muda `updated_at`, então o editor aberto não vê conflito.
  - Exportar também não muda o "alterado por" da lista.

### Botão no editor

- **Durante a geração:** "Salvar em PDF" vira "Gerando PDF" e fica desligado. O painel continua editável.
- **Depois:** o PDF mais recente aparece na barra, com versão e hora, e abre no Drive. No celular, ele aparece acima do botão fixo.
- **Erro:** aviso em terracota, "Não foi possível salvar o PDF no Drive. O orçamento continua salvo; tente de novo em instantes.", com "Tentar de novo" e "Fechar".
  - Se as alterações ainda não foram salvas, o PDF não é gerado, e o aviso diz isso.
- **Leitor:** não vê o botão.

### Medição local (Edge, 04/11/2026)

- **Tamanho estimado da função:** dependências de produção de 56,4 MB para 153,3 MB. O valor exato só sai no build da Vercel.
- **Primeira geração pelo script:** cerca de 1,9 s, sendo 1,1 a 1,2 s para abrir o Edge e 0,6 s para o PDF.
- **Primeiro clique no servidor local:** 2,25 s até o link aparecer.
- **Gerações seguintes:** 0,5 a 0,8 s.
- **Detalhes e PDFs:** `revisao-fase6a/pdf/` (`medicao.txt` e os PDFs de cada caso).
- **Drive simulado:** os PDFs que foram para lá estão em `revisao-fase6a/pdf/drive-simulado/`.

## 4. Testes

| Suíte | Resultado |
|---|---|
| Completa (`vitest run`) | 520 testes em 24 arquivos, todos passaram |
| Build (`tsc` e `vite build`) | Passou |
| `phase2.test.ts` (matriz de permissões) | 75 testes passaram, inclusive "Exportar PDF de orçamento e apresentação" (administrador e colaborador sim, leitor 403) |
| `phase6a.test.ts` (API) | 16 testes |
| `phase6a-calc.test.ts` (cálculos) | 33 testes |
| `phase6a-migration.test.ts` | 3 testes (0008 e 0009) |
| `phase6a-pdf.test.ts` (HTML do PDF) | 2 testes |
| `phase6a-pdf-export.test.ts` (rota do PDF) | 13 testes |

O que a rota do PDF testa (`tests/phase6a-pdf-export.test.ts`):

**Geração e pasta**
- **Projeto:** o arquivo vai para `Orçamentos` do projeto e começa com `%PDF`. Ele fica ligado ao orçamento e entra em `project_files` e no `audit_log`.
- **Avulso:** o arquivo vai para `De.Croqui ERP/Avulsos`. A pasta é criada na primeira vez e reaproveitada depois.
- **Pasta apagada:** se `Orçamentos` foi apagada no Drive, ela é criada de novo.
- **Sem Data:** o nome usa a data de hoje.

**Permissão**
- O leitor recebe 403 chamando a rota direto. O gerador e o Drive não são chamados.
- Administrador e colaborador exportam. Sem sessão, 401.
- Orçamento inexistente ou de projeto excluído responde 404.

**Nome do arquivo**
- Um nome com `/ : " < > ? * | \` e acentos vira só letras, números e hífen.
- Casos de borda: vazio, só símbolos, outro alfabeto e nome longo.

**Falhas**
- **Falha no envio:**
  - responde 502;
  - nada é gravado;
  - a versão é devolvida;
  - o orçamento segue editável;
  - a nova tentativa sai como versão 1.
- **Falha na geração:** responde 502, e nada vai para o Drive.

**Exportar de novo**
- A segunda exportação sai com `-v2`, e a anterior continua no Drive.
- A leitura e a lista mostram a versão 2.
- O "alterado por" não muda.
- Duas exportações ao mesmo tempo recebem as versões 1 e 2.

Os demais testes da API de orçamentos seguem como antes:
- **Nome obrigatório:** vazio, só espaços ou ausente responde 400 e nada é gravado; acima de 120 caracteres também é recusado.
- **Salvar e reabrir:** fechar e reabrir, com um servidor novo sobre o mesmo banco, devolve os mesmos dados.
- **Permissões:** administrador e colaborador criam e editam; o leitor recebe 403 ao criar e ao editar, e só lê.
- **Conflito:** um salvamento sobre uma versão antiga responde 409 e não sobrescreve.
- **Vários orçamentos:** um projeto aceita mais de um; criar projeto não cria orçamento.
- **audit_log:** cada gravação registra só o que mudou. Nenhum teste apaga ou altera linhas do `audit_log`.

## 5. Casos de cálculo

Todos os 29 casos de `revisao-fase6/casos-de-teste.json` foram conferidos. O arquivo de casos veio sem alteração da branch `feat/fase-6-orcamento-apresentacao`, e o teste confere o SHA-256 dele.

| Casos | Resultado |
|---|---|
| `orc-01`, `02`, `04` a `07`, `09` a `11`, `13` a `24` | Iguais ao arquivo original |
| `orc-03` | **Exceção:** arredondamento. O original mostra o total R$ 100,01; o ERP mostra R$ 100,02, a soma de R$ 100,01 e R$ 0,01 |
| `orc-08` | **Exceção:** arredondamento. O original mostra o total R$ 1.234.567,90; o ERP mostra R$ 1.234.567,89, a soma de R$ 1.234.567,89 e R$ 0,00 |
| `orc-12` | **Exceção:** singular. "Render 3D (1 ambientes × …)" passa a ser "Render 3D (1 ambiente × …)" |
| `orc-25` (Restaurar exemplo) | Não se aplica: não há exemplo, e o orçamento novo começa zerado |
| `orc-26` | No PDF: 3 páginas, todas com 210 × 297 mm |
| `orc-27` | No PDF: 4 páginas, todas com 210 × 297 mm. O original tinha uma folha de 329 mm |
| `orc-28` | No PDF: 4 páginas, todas com 210 × 297 mm. O original tinha uma folha de 433 mm |
| `orc-29` (texto editado na folha) | Não se aplica: os textos fixos não são editáveis na folha (decisão 1) |

**Regra do arredondamento:**
- cada linha é arredondada em centavos, com a metade para longe do zero;
- o valor é lido em decimal, para que 100,005 vire 100,01;
- o total é a soma das linhas arredondadas.

## 6. Mudanças intencionais em relação ao arquivo original

1. **Arredondamento:** o total soma as linhas já arredondadas.
2. **Singular:** "1 ambiente", também na linha do render.
3. **Folha de continuação:** com muitos ambientes, a lista continua em outra folha A4 completa, com cabeçalho, rodapé e numeração. Antes, a folha crescia além de 297 mm.
   - A primeira folha da Opção 02 leva até 6 ambientes, e as de continuação até 18.
   - Se nomes longos não couberem, a folha é medida e um ambiente por vez passa para a seguinte, na prévia e no PDF.
4. **Imóvel em até três linhas:** como no original, o quadro Imóvel mostra no máximo três linhas.
   - O painel avisa quando o texto passa disso: "O texto do imóvel ocupa N linhas na folha. Só as três primeiras aparecem no orçamento; resuma o texto."
5. **Textos fixos:** observações, inclusos e a nota só mudam no código, não na folha.
6. **Remover ambiente:** pede confirmação ("Remover este ambiente?").
7. **Começa zerado:** sem "Restaurar exemplo" e sem nomes ou telefones de pessoas reais. Os dados de teste locais são fictícios.
8. **Armazenamento:** os dados ficam no banco do ERP (`budgets.data`), não no navegador, com "Salvo às HH:MM" na barra.
9. **Erros de salvamento:**
   - falha ao salvar: "Não salvo", com aviso em terracota e nova tentativa automática a cada 10 s, além de "Tentar agora";
   - alteração em outra aba: aviso em ocre, sem sobrescrever o que está gravado.
10. **PDF:** gerado no servidor e salvo no Drive, em vez de impresso pelo navegador.

## 7. Capturas

As capturas estão em `revisao-fase6a/capturas/`, geradas com o servidor local:
- banco em memória;
- Drive simulado;
- PDF gerado pelo Edge;
- nada de produção.

O arquivo `verificacao.txt` lista as 48 conferências feitas na tela, todas aprovadas: as 33 anteriores e 15 do PDF.

| Largura | Capturas |
|---|---|
| 1440 | 01 a 12: lista (Todos e Sem projeto), novo orçamento sem nome, editor zerado, editor preenchido, remover ambiente, erro ao salvar, alterado em outra aba, folha de continuação, projeto com o botão e com o painel, leitor |
| 1024 | 13 e 14: lista e editor (painel de 360 px) |
| 390 | 15 a 19: lista com abas, novo orçamento sem nome, editor (Preencher e Ver folhas) e página do projeto |
| 1440, PDF | 20 "Salvar em PDF" ativo; 21 "Gerando PDF" (painel editável); 22 PDF salvo, com o link; 23 aviso de erro ao salvar o PDF |
| 390, PDF | 24 PDF salvo, com o link acima do botão; 25 aviso de erro acima da barra |

Os desenhos aprovados estão em `revisao-fase6a/desenhos/`.

## 8. Arquivos fora da branch

Os scripts de teste local ficam fora do repositório, na pasta temporária da sessão:
- o servidor com PGlite, o Drive simulado e o PDF pelo Edge;
- o script das capturas.

O `.claude/launch.json` da pasta pai tem a entrada `erp-fase6a-local`, que não faz parte da branch.

## 9. O que ainda não foi testado na Vercel

Tudo acima rodou no computador. Os pontos abaixo só se confirmam num deploy e no Drive de verdade:

1. **Build da função:** se a Vercel compila `src/budget/BudgetSheets.tsx` dentro da função `api` e inclui os arquivos do `includeFiles` (CSS, tokens, fontes e logo). Se faltar algum, o PDF falha com `pdf_failed`.
2. **Tamanho real da função:** a estimativa é de até 153 MB de dependências. O número exato só aparece no build.
3. **Chromium do `@sparticuz/chromium` no Linux da Vercel:**
   - se ele abre;
   - quanto tempo leva a primeira chamada de cada instância, por causa da descompactação;
   - quanta memória usa. A função usa a memória padrão do projeto, porque o `vercel.json` não foi alterado além do `includeFiles`.
4. **Envio real ao Google Drive:**
   - o `uploadFile` (multipart) foi testado só com o Drive simulado; o formato do pedido segue a documentação, mas não falou com o Google;
   - a pasta `Avulsos` e as subpastas `Orçamentos` também não foram criadas no Drive real.
5. **Migrações 0008 e 0009 no Supabase:** aplicadas só no PGlite.
6. **Tempo total:** do clique ao PDF no Drive real, com a rede entre a Vercel e o Google.
