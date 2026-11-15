# Fase 6d: Prancha de detalhamento — planejamento

Este documento é só planejamento. Nesta etapa não houve código de produção, teste, migração, push, merge, deploy nem acesso a produção.

- **Situação:** E0 concluída. As perguntas P38 a P45 e os textos das recusas foram respondidos (seção 5), e os frames 6d-01 a 6d-06 foram aprovados por você no Figcraft em 15/11/2026. A cor do nome na D8 foi confirmada (seção 5). E1 concluída em 15/11/2026 (seção 3). A E2 começa com a sua autorização.
- **Branch:** `feat/fase-6d-prancha`, criada da `origin/main` em `69a6d07` (6c em produção). Ela existe só neste computador, sem push e sem upstream, porque um push gera uma prévia na Vercel.
- **Desenhos:** a referência aprovada será `design/moldura-erp.figcraft`, página "ERP · Telas", com 6d-01 a 6d-06 (seção 6). Os PNG em `revisao-fase6d/desenhos/` são só rascunho, fora do versionamento.
- **Decisões usadas:**
  - O arquivo `claude/decisoes-fase-6.md` não existe no repositório nem na pasta do projeto. No lugar dele, usei:
    - `revisao-fase6b/decisoes.md`, nas seções "Escala e folha" e "Divisão da fase 6b";
    - `revisao-fase6b/molduras.md`, seção 7, decisões M1 a M9;
    - `revisao-fase6c/decisoes.md`.
- **Lido:**
  - `ESPECIFICACAO.md`, seção 10 ("portar, não recriar");
  - `revisao-fase6b/molduras.md`;
  - o arquivo offline `templates/apresentacao/Apresentacao.dc.html`: `AP_FORMATS`, `AP_RODCELLS`, `apDrawTpl`, `apProcess`, a folha `isPrancha`, a verificação ao importar (linha 594) e o painel da prancha (linhas 838 a 843);
  - `src/presentation/` (`pages.ts`, `PageSheet.tsx`, `sheets.css`, `imageReduce.ts`);
  - `src/shared/presentation-data.ts` e `src/shared/presentation-calc.ts`;
  - `api/_app/presentation-pdf.ts` e `api/_app/routes/presentation-images.ts`;
  - `vercel.json`.

## 0. O que entra e o que fica fora

### 0.1 Entra na 6d

- **Prancha de detalhamento:** um tipo de página novo, com uma imagem exportada do SketchUp LayOut que ocupa a folha inteira, A4 ou A3 paisagem.
- **Moldura versão 1:** dois PNG prontos no repositório, um A4 e um A3, baixados pelo ERP direto no navegador, sem passar pelo Drive (M1, M2 e M3).
- **Rodapé da prancha:** os valores escritos pela página por cima da imagem, nas posições em mm da moldura (`molduras.md`, seção 3).
- **Importação da prancha:**
  - só PNG; JPEG, WebP e PDF são recusados (M6);
  - recusa quando a proporção difere mais de 0,5% da folha (M5);
  - resolução a partir de 200 dpi, com 300 dpi recomendados (M4); abaixo de 200 dpi, a imagem é recusada (P39);
  - até 7200 px no lado maior.
- **Formatos da apresentação:** A4, A3 e Tela 16:9, como no seletor "Formato da página" do arquivo offline (`AP_FORMATS`).
- **PDF com páginas de tamanhos diferentes:** por exemplo, uma prancha A3 numa apresentação A4. Precisa de teste no Chromium da Vercel (R9 da 6b).
- **Conferência de pixels da moldura (M7):**
  - os dois PNG com as dimensões e o desenho certos;
  - o roteiro para você conferir no LayOut se a moldura entra com 297 × 210 mm.

### 0.2 Fica fora

- **No "Desenho técnico" da 6c:** nada muda (M9). Continua sem cota automática, sem escala gráfica e sem carimbo automático, só com o texto da escala digitado.
- **Na prancha:** sem ferramenta de escala, sem medição e sem cota.
- **Moldura em JPEG:** fica fora (M3).
- **Edição direta na folha:** fica para a 6e.
- **Duplicar página e duplicar apresentação:** continuam como proposta, como na 6c.

---

## 1. O que já existe e o que falta

### 1.1 Já existe

| O quê | Onde | Observação |
|---|---|---|
| Tipo `prancha` na lista de tipos | `src/shared/presentation-calc.ts:10` | O tipo já existe na lista. A prancha não tem "NN / TT" (linhas 18 e 37) |
| Recusa da prancha ao validar | `src/shared/presentation-data.ts:615` | Cai em `default`, com `page_type`. A 6d troca isso pela validação real |
| Formato da apresentação | `src/shared/presentation-data.ts:72`, `PAGE_FORMATS = ['a4']` | O campo `projeto.formato` já é gravado. Hoje só aceita `a4` |
| Menu "Adicionar página" | `src/pages/presentations/pagesList.ts:18` | Tem a ordem de 6c-21, sem a prancha |
| Envio direto ao Drive e biblioteca | `api/_app/routes/presentation-images.ts`, `api/_app/presentation-images.ts` | Aceita PNG, JPEG e WebP, até 40 MB e até 4000 px (`IMAGE_MAX_SIDE`) |
| Redução no navegador | `src/presentation/imageReduce.ts`, `presentation-calc.ts:95` | Acima de 4000 px. PNG continua PNG |
| Recusa de formato no envio | `src/pages/presentations/editor.ts:163` (`uploadRefusal`) | Recebe a lista de tipos aceitos como parâmetro, então serve para a prancha |
| PDF com Chromium | `api/_app/presentation-pdf.ts` | Só A4: `@page{size:297mm 210mm}` (linha 62) e janela de 1123 × 794 (linha 249). As fotos são reduzidas para 3000 px, uma por vez (linha 67) |
| Teto de 50 fotos | `presentation-data.ts` e API | Conta as fotos diferentes que vão para o PDF |
| Tabela `presentation_images` | `api/_app/db/schema.ts:383` | `width_px` e `height_px` não têm limite no banco, então 7200 px não precisa de migração |

### 1.2 Falta

| O quê | Onde deve ficar |
|---|---|
| **Os dois PNG da moldura.** Não estão no repositório. Não há pasta `public/`, e nenhum arquivo `folha-modelo` ou `moldura` foi encontrado | Proposta: `public/molduras/DeCroqui-folha-modelo-A4-v1.png` e `...-A3-v1.png`, servidos como arquivos estáticos pelo Vite |
| Modelo de dados da página `prancha` | `src/shared/presentation-data.ts` |
| Regras da prancha (proporção, dpi, valores do rodapé, número da folha) | Arquivo novo `src/presentation/prancha.ts`, sem React, como `pages.ts` |
| Folha da prancha na tela e no PDF | `src/presentation/PageSheet.tsx` e `sheets.css` |
| Painel da prancha e botão de baixar a moldura | `src/pages/presentations/pageEditor.ts` e o painel da aba Página |
| Envio até 7200 px só para a prancha | `api/_app/routes/presentation-images.ts`, `presentation-calc.ts` e `imageReduce.ts` |
| Formatos A3 e 16:9 nas outras páginas | `sheets.css`, `PageSheet.tsx`, `CoverSheet.tsx` e o seletor na aba Projeto |
| PDF com páginas de tamanhos diferentes | `api/_app/presentation-pdf.ts`, com `@page` nomeadas (`pa4`, `pa3`, `wide`) |
| Testes | `tests/`, no padrão da 6c |

## 2. Modelo de dados (proposta)

Não há migração: tudo cabe em `presentations.data`, como na 6c.

```text
{
  id, tipo: 'prancha',
  folha: 'a4' | 'a3',          // tamanho da folha da prancha, independente do formato da apresentação
  titulo: string,              // "Ambiente / título da prancha", vai para a célula AMBIENTE
  fase: string,                // célula FASE; a página nova começa com "Executivo", como no arquivo offline
  rodape: boolean,             // true = a página escreve os valores; false = os dados já estão na imagem
  imagem: PresentationImageRef | null,
  moldura: 1                   // versão da moldura (M8), gravada quando a imagem é importada
}
```

- **`projeto.formato`:** passa a aceitar `a4`, `a3` e `wide`. Documento antigo sem o campo continua `a4`.
- **Valores do rodapé**, como no arquivo offline (linha 829):
  - AMBIENTE vem do título;
  - FASE vem da fase;
  - PROJETO vem do nome do projeto;
  - CLIENTE vem do cliente;
  - DATA vem da data curta de emissão;
  - FOLHA é "NN/TT", contando só as pranchas.
  - Ao lado do logo, a 37 mm, vão as linhas de contato.
- **A prancha conta no teto de 50 fotos**, porque a imagem dela também vai para o gerador do PDF (decisão P41).

## 3. Etapas e critérios de aceite

Cada etapa depende de aprovação, uma de cada vez.

### E0: planejamento e desenhos (esta etapa)

- Este documento aprovado.
- Os desenhos 6d-01 a 6d-06 aprovados no Figcraft (seção 6), não nos PNG de rascunho.
- As perguntas da seção 5 respondidas.

### E1: moldura versão 1

- **Como os dois PNG são gerados (P43):** pelo botão "Baixar PNG" do próprio arquivo offline, para serem idênticos ao que ele gera hoje. São gravados em `public/molduras/` com `v1` no nome. O código de `apDrawTpl` não entra no ERP (M2).
- **Aceite:**
  - A4 com 3508 × 2480 px e A3 com 4961 × 3508 px;
  - bloco `pHYs` com 11811 px/m (300 dpi);
  - modo RGB, sem transparência;
  - hash sha256 dos dois arquivos registrado no relatório.
- **Conferência de pixels (M7, parte de pixels):** um teste lê os dois PNG e confere:
  - o tamanho;
  - o dpi gravado;
  - a cor nas posições da faixa do topo, da faixa do rodapé, da linha vinho e das 6 divisórias, com tolerância de 1 px.
- **Conferência no LayOut (M7, parte do LayOut):** fica com você. Um roteiro de 4 passos vai em `revisao-fase6d/m7-layout.md`:
  1. inserir o PNG;
  2. ler o tamanho;
  3. exportar;
  4. importar.
- **Resultado (E1 concluída em 15/11/2026):**
  - **PNG gerados por você** pelo botão "Baixar PNG" e gravados em `public/molduras/`. Os dois saíam em RGBA, com pixels de borda translúcidos: 2480 no A4, só na última coluna, e 8468 no A3, nas bordas. Por isso reprovavam no critério "RGB, sem transparência".
  - **Originais guardados** em `revisao-fase6d/molduras-originais/`, com o mesmo sha256:
    - A4: `73387e2948d794131639f799ea1b1f08fd613fab4b3532e4c871182f601cffff`;
    - A3: `e983d5640a746205db3d47ac8fe8a89afea1bca3a104c6822d43edf219d4084e`.
  - **Versões RGB**, com sua autorização, compostas sobre branco, com o mesmo tamanho em pixels e o mesmo `pHYs`. Foram feitas em Python puro, com `zlib`, sem instalar nada.
  - **Conferência pixel a pixel contra o original:**
    - 0 pixels opacos diferentes;
    - nos pixels translúcidos da borda, a maior diferença foi de 1 nível de cor no A4 e de 4 no A3.
  - **sha256 dos PNG finais** em `public/molduras/`:
    - `DeCroqui-folha-modelo-A4-v1.png` (3508 × 2480, RGB, 300 dpi): `327c3f45116c26fa4fe82fe4370268cbbdc6fbcf638c4507bb47232deeb5fa80`;
    - `DeCroqui-folha-modelo-A3-v1.png` (4961 × 3508, RGB, 300 dpi): `0b9db3b00983e84c45a45ebb1087c10fa22e94db8b99a2135353c31ab859422c`.
  - **Teste** `tests/phase6d-moldura.test.ts`: 16 de 16 passaram. São 8 verificações por folha: tamanho, `pHYs`, modo RGB, sem transparência, faixa do topo, faixa do rodapé, linha vinho e as 6 divisórias, com tolerância de 1 px.
  - **`npm test`:** 45 arquivos, 844 testes passaram, que são os 828 de antes mais os 16 da E1.
  - **`npm run build`:** passou. O aviso de bloco JS acima de 500 kB já existia. Os dois PNG vão para `dist/molduras/`.
  - **Roteiro M7** escrito em `revisao-fase6d/m7-layout.md`. A conferência no LayOut fica com você; o passo 4 depende da E3.

### E2: modelo de dados e validação

- `prancha` deixa de ser recusada e passa a ser validada.
- `PAGE_FORMATS` passa a ter `a4`, `a3` e `wide`.
- **Aceite:**
  - testes de validação: campos obrigatórios, `folha` fora da lista recusada, `moldura` diferente de 1 recusada;
  - documento da 6c abre e salva sem mudança;
  - limite de 1 MiB e teto de 50 fotos contando a prancha.

### E3: importação da prancha

- **Regras na ordem**, e a primeira que falhar dá a mensagem (desenho 6d-04):
  1. formato;
  2. 40 MB;
  3. retrato;
  4. proporção acima de 0,5%;
  5. resolução abaixo de 200 dpi;
  6. acima de 7200 px, a imagem é reduzida, sem recusa.
- O dpi é calculado pela largura: `largura ÷ (297 ou 420 mm) × 25,4`.
- A proporção esperada é 297/210 ou 420/297. As duas dão √2 com diferença menor que 0,03%.
- **Na API:** o limite de 7200 px vale só no envio marcado como prancha. O envio comum continua com 4000 px.
- **Aceite:**
  - testes de cada recusa com arquivos fictícios gerados no teste;
  - um PNG de 3508 × 2480 entra sem aviso;
  - um de 3508 × 2500 (0,8%) é recusado;
  - um de 1700 × 1202 (145 dpi) é recusado (P39);
  - um de 9000 × 6364 é reduzido para 7200 × 5091.

### E4: folha da prancha no editor e na leitura

- A imagem ocupa a folha inteira com `object-fit: contain`, sem cabeçalho nem "NN / TT".
- Com "Rodapé" ligado, os valores ficam nas posições em mm da seção 3 de `molduras.md`, escaladas pela folha.
- No A3, o mesmo desenho ampliado por 1,41421.
- Prancha vazia com a Prévia desligada: mostra a moldura e o texto "Importar prancha". Com a Prévia ligada ou no PDF: folha branca, sem texto (como a decisão da E3 da 6c para espaços vazios).
- Painel (desenho 6d-04):
  - Tamanho da folha;
  - Rodapé;
  - Ambiente / título;
  - Fase;
  - Prancha importada;
  - "Baixar moldura A4 (PNG)".
- **Aceite:**
  - conferência local em 1440 e 1024 com os desenhos 6d-01 a 6d-04;
  - os valores do rodapé caem dentro das células em A4 e A3, conferido sobre a moldura v1 com tolerância de 0,3 mm;
  - texto longo é cortado com reticências, sem invadir a célula ao lado.

### E5: formatos A3 e 16:9 nas outras páginas

- O seletor "Formato da página" fica na aba Projeto, com:
  - A4 paisagem · 297 × 210 mm;
  - A3 paisagem · 420 × 297 mm;
  - Tela 16:9 · 297 × 167 mm.
- **A3:** é o A4 ampliado por 1,41421, como no arquivo offline, e o layout não muda.
- **16:9:** a folha tem 297 × 167,06 mm, ou seja, 20% mais baixa. Os limites de 6 blocos, 6 materiais e 6 notas foram medidos em A4 (6c, seção 11.5) e precisam de nova medição em 16:9 (R4).
- A prancha mantém o próprio tamanho, A4 ou A3, em qualquer formato da apresentação, como no arquivo offline.
- **Aceite:**
  - as 6 páginas da 6c cheias no limite cabem em 16:9, ou o limite muda com o formato, conforme a medição;
  - capa nas três composições em 16:9;
  - mudar o formato não perde dados.

### E6: PDF com páginas de tamanhos diferentes

- `@page` nomeadas por tamanho (`pa4`, `pa3` e `wide`), como no arquivo offline (linha 402).
- Cada folha recebe a página dela no CSS de impressão.
- A prancha vai ao PDF a 300 dpi da sua folha (P40): até 3508 px no A4 e até 4961 px no A3. Prancha menor entra como está. Uma imagem por vez, pelo mesmo caminho das fotos da 6c, sem embutir no HTML.
- **Aceite:**
  - **medição no Chromium local** de uma apresentação A4 com uma prancha A3. Cada página do PDF tem o tamanho certo, com tolerância de 0,5 mm: 297 × 210, 420 × 297 e 297 × 167,06;
  - **medição de memória e tempo** com o pior caso aprovado. Proposta de pior caso: 50 fotos, das quais 10 são pranchas de 7200 px, em 40 páginas;
  - **teste do Chromium da Vercel** com páginas de tamanhos diferentes. Precisa de uma prévia, o que pede push, então só acontece com a sua autorização e sem gravar dados (prévias apontam para o banco de produção).

### E7: conferência local

- Conferência no padrão da E7 da 6c: capturas em `revisao-fase6d/capturas-e7/`, fora do versionamento, e divergências numeradas.
- `npm test` e `npm run build` passando.

## 4. Riscos

| Nº | Risco | O que fazer |
|---|---|---|
| R1 | **Memória do Chromium.** Um PNG de 7200 × 5091 px ocupa cerca de 147 MB descomprimido. Na 6c, o Chromium fechava a partir de cerca de 45 fotos em resolução original | Reduzir a prancha no PDF a 300 dpi da folha, uma por vez, na aba própria (P40). No A3, 4961 × 3508 px ocupa cerca de 70 MB descomprimido. Medir o pior caso na E6. Se não passar, limitar o número de pranchas por apresentação |
| R2 | **Tempo da função na Vercel.** O limite padrão é 300 s (`vercel.json` não muda isso). 50 fotos levaram 53,5 s no Edge local. A prancha em PNG grande custa mais para decodificar e reduzir, e a Vercel é mais lenta que o computador local | Medir local com margem: aceitar só se o pior caso ficar abaixo de 120 s locais. Não aumentar a duração da função sem sua aprovação |
| R3 | **Proporção da moldura.** A4 de 3508 × 2480 dá 1,41452, e A3 de 4961 × 3508 dá 1,41420. As duas diferem de √2 em menos de 0,03%, bem dentro de 0,5%. O risco é o LayOut exportar com margem, borda ou arredondamento de pixels, o que daria uma recusa injusta | Conferir na M7 com uma exportação real. A mensagem de recusa diz a proporção encontrada e pede para exportar a página inteira, sem margens |
| R4 | **16:9 menor que A4.** Os limites de texto da 6c foram medidos em A4. Em 16:9 o texto pode passar do limite e bloquear o PDF | Nova medição na E5. O bloqueio de PDF da 6c já impede folha cortada |
| R5 | **`@page` nomeada no Chromium da Vercel.** Funciona no Edge e no Chrome locais, mas a versão do Chromium da função não foi testada com páginas de tamanhos diferentes | Teste na prévia (E6), com autorização |
| R6 | **DPI do PNG no LayOut (M7).** Não está confirmado que o LayOut respeita o `pHYs` | Roteiro M7. Se não respeitar, uma instrução escrita no painel ("Ajuste a imagem para 297 × 210 mm") |
| R7 | **Moldura com o logo certo.** O desenho do arquivo offline usa o logo da página. Gerar a v1 em outra máquina pode trocar a fonte Jost dos rótulos | Gerar no navegador com a Jost carregada e conferir os rótulos na captura (E1) |

## 5. Decisões (respostas às perguntas P38 a P45)

Respondidas por você em 15/11/2026. Elas substituem as perguntas em aberto.

- **P38. Formato 16:9.** A3 e Tela 16:9 valem para a apresentação inteira, na aba Projeto. A prancha fica só em A4 ou A3, e não há prancha 16:9.
- **P39. Abaixo de 200 dpi.** A prancha recusa a imagem, com a mensagem de resolução da seção 6.4.
- **P40. Resolução da prancha no PDF.** A prancha vai a 300 dpi da sua folha: até 3508 px no A4 e até 4961 px no A3. Prancha menor entra como está. O que fica no Drive continua com até 7200 px.
- **P41. Teto de 50 fotos.** A imagem da prancha conta no teto.
- **P42. Rodapé "Não preencher".** A opção "Não preencher (dados já estão na imagem)" continua. O padrão é "Preencher com os dados do projeto".
- **P43. Moldura de onde.** Os dois PNG são gerados pelo botão "Baixar PNG" do arquivo offline (E1).
- **P44. Prancha no menu.** "Prancha de detalhamento" entra no menu "Adicionar página" logo depois de "Desenho técnico". A página nova vem com folha A4, fase "Executivo" e rodapé ligado.
- **P45. Número da folha.** A célula FOLHA conta só as pranchas ("01/02"), e a prancha não tem "NN / TT".
- **Textos das recusas:** aprovados como estão na seção 6.4.
- **D8 da 6c não muda no código.** O nome da apresentação no topo do editor fica na cor normal do app: azul-noite, 100%, aprovado pelo usuário em 15/11/2026. Quem se ajusta é o desenho, não o código.
  - Nos frames 6d-01, 6d-02, 6d-03, 6d-05 e 6d-06, o nome (`#142841`) estava com 42% de opacidade, o que o deixava cinza. A opacidade passou para 100%, sem mudar a cor. O 6d-04 não tem barra superior. Os frames de outras fases não foram alterados.

## 6. Desenhos

### 6.1 Referência

- **A referência aprovada é o Figcraft**, como nas outras fases: `design/moldura-erp.figcraft`, página "ERP · Telas".
- **Os frames 6d-01 a 6d-06 foram aprovados em 15/11/2026.** A aprovação vale para os frames do Figcraft, não para os PNG.
- **Os seis frames 6d-01 a 6d-06 foram criados com a sua autorização**, só na página "ERP · Telas", logo abaixo dos frames da 6c. O último frame da 6c (6c-22) termina em y = 47.632; os da 6d começam em y = 47.800, 168 abaixo, o mesmo espaço que separa as linhas da 6c. Frames de outras fases, componentes e tokens não foram alterados. O arquivo tem uma página só ("ERP · Telas"); não há página separada da moldura.
- As exportações para conferência ficam em `revisao-fase6d/desenhos-figcraft/`, fora do versionamento.

| Nº | Frame no Figcraft (página "ERP · Telas") | x | y | Tamanho | O que mostra |
|---|---|---|---|---|---|
| 6d-01 | Editor · Prancha A4 | 0 | 47.800 | 1440 × 900 | Editor em 1440, prancha A4 importada, rodapé preenchido, painel da prancha |
| 6d-02 | Editor · Prancha A3 | 1.540 | 47.800 | 1440 × 900 | O mesmo, com folha A3: na tela, a mesma proporção; no PDF, 420 × 297 mm |
| 6d-03 | Editor · Prancha numa apresentação 16:9 | 3.080 | 47.800 | 1440 × 900 | Prancha A4 numa apresentação em Tela 16:9, com o aviso no painel |
| 6d-04 | Painel · importação e recusas | 4.620 | 47.800 | 1440 × 820 | As mensagens da importação, na ordem, e os estados vazio, enviando e importada |
| 6d-05 | Prancha vazia · Prévia desligada | 6.160 | 47.800 | 1440 × 900 | Folha sem imagem, com "Importar prancha" e o rodapé |
| 6d-06 | Aba Projeto · formato da página | 7.700 | 47.800 | 1440 × 1543 | Aba Projeto com o seletor A4, A3 e Tela 16:9, e uma página Texto & conceito em 16:9 |

### 6.2 Rascunhos em PNG (não são referência)

- Os PNG de `revisao-fase6d/desenhos/` são **rascunho**. Eles foram feitos em HTML, com os tokens e as fontes do sistema, e exportados em 1440 × 900 pelo Edge sem janela.
- O HTML de origem fica em `revisao-fase6d/desenhos/fonte/desenho.html`.
- Os PNG e o HTML ficam fora do versionamento e não são apagados. Servem só como ponto de partida para os frames do Figcraft.
- Todos os dados e o desenho técnico da prancha são fictícios.

### 6.3 Como os frames foram montados

1. Posição na página "ERP · Telas": logo abaixo do último frame da 6c, com o y calculado a partir dele.
2. Só com os componentes que o arquivo já tem: a barra do editor, as abas do painel, os campos e os avisos da 6b.
3. A moldura v1 dentro da folha da prancha:
   - faixas, linha vinho, logo e as 6 células com rótulos, nas medidas em mm de `molduras.md`, seção 3;
   - o rodapé com os valores nas posições da seção 3.
4. As respostas da seção 5 aplicadas: 16:9 só como formato da apresentação (6d-03 e 6d-06), recusa abaixo de 200 dpi (6d-04), seletor Rodapé com "Preencher com os dados do projeto" como padrão (a opção "Não preencher" fica na lista do seletor, que aparece fechado nos frames), página nova com A4, "Executivo" e rodapé ligado (6d-05) e FOLHA contando só as pranchas.
5. A barra superior copiada dos frames da 6c, com o nome da apresentação em azul-noite a 100% (D8, seção 5).
6. Os frames exportados em PNG para conferência, sem substituir os rascunhos.

### 6.4 Textos das recusas (aprovados)

Aprovados por você como estão.

- **Formato:** "“planta.jpg” não é PNG. A prancha aceita só PNG: exporte do LayOut em PNG. Nada foi enviado."
- **Tamanho:** "“planta.png” tem 52 MB. O limite é 40 MB. Nada foi enviado."
- **Retrato:** "“planta.png” está em retrato. Exporte a folha em paisagem, inteira, para manter a escala. Nada foi enviado."
- **Proporção:** "“planta.png” não tem a proporção da folha A4: a diferença é de 0,8%, e o limite é 0,5%. Exporte a página inteira, sem margens. Nada foi enviado." Até 0,5%, a imagem entra sem aviso (M5).
- **Resolução:** "“planta.png” tem 145 dpi na folha A4. O mínimo é 200 dpi, e o recomendado é 300 dpi (3508 × 2480 px). Nada foi enviado."
- **Redução:** "A prancha tinha 9000 × 6364 px e foi reduzida para 7200 × 5091 px. A escala na folha não muda." Essa é só informação.

## 7. Regras que continuam

- Sem migração. Tudo fica em `presentations.data`.
- Sem push, merge ou deploy sem aprovação.
- Prévias da Vercel não são usadas para gravar dados. Testes de gravação só em PGlite.
- Dados de exemplo fictícios: "Cliente Avulso", "Projeto Teste" e "(00) 00000-0000".
- Desenhos e capturas da 6d ficam fora do versionamento (`.gitignore`).
