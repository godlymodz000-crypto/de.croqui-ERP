# Fase 6b: de onde vem a moldura da prancha

Investigação feita só com leitura. Nenhum arquivo do design system, do `templates/` ou do ERP foi alterado. Este relatório é o único arquivo novo, na branch `feat/fase-6b-apresentacao`.

## Resposta curta

- **A moldura não é um arquivo separado.** A página offline desenha a moldura na hora, num `<canvas>`, e baixa o resultado como imagem. O nome dela no código e na tela é **"folha-modelo"**. As palavras "moldura" e "frame" não aparecem no arquivo com esse sentido.
- **Código que gera a moldura:**
  - `D:\De.Croqui Design System Oficial\templates\apresentacao\Apresentacao.dc.html`, função `apDrawTpl` (linha 234). Ela desenha a moldura.
  - Método `downloadTpl` (linha 661). Ele gera o arquivo e o baixa.
  - Função `apDpi` (linha 242). Ela grava o valor de 300 dpi dentro do arquivo.
  - O mesmo código está nas cópias empacotadas, que são idênticas entre si (sha256 `0935aecd…`):
    - `exports\Apresentacao De.Croqui (offline).html`;
    - `erp-decroqui\referencias-offline\Apresentacao De.Croqui (offline).html`.
- **Formatos:** PNG ou JPEG, a 300 dpi.

  | Folha | Pixels | Tamanho a 300 dpi |
  |---|---|---|
  | A4 | 3508 × 2480 px | 297 × 210 mm |
  | A3 | 4961 × 3508 px | 420 × 297 mm |

  Não há SVG, PDF nem DXF da moldura.

## 1. Onde procurei

| Onde | O que achei |
|---|---|
| `templates\apresentacao\Apresentacao.dc.html` | O código da folha-modelo (seções 2 a 4) |
| `templates\orcamento\Orcamento.dc.html` | Nada. Não tem prancha nem folha-modelo |
| `exports\` | Só as duas páginas offline empacotadas. Nenhuma imagem de moldura |
| `uploads\` | Dois PDFs de orçamento de referência. Nada de moldura |
| `assets\` | Logos e imagens da marca. A folha-modelo usa o logo que já está na página |
| `components\` | `ArchFrame` é a moldura em arco das imagens (forma da foto), não a folha da prancha |
| `SKILL.md`, `DESIGN.md` | Só citam `templates/apresentacao/` como "A4 landscape". Nada sobre moldura, prancha ou escala |
| `erp-decroqui\design\moldura-erp.figcraft` | É a moldura das telas do ERP (barra lateral e topo), não a folha da prancha |

Termos procurados: "moldura", "frame", "A4", "A3", "download", "svg", "png", "pdf", "dxf", "dpi", "3508", "4961", "prancha" e "folha-modelo". Também procurei os nomes de arquivo que a página baixa.

## 2. Como funciona a escolha entre A4 e A3

1. O usuário adiciona uma página do tipo **Prancha de detalhamento**. Ela começa em A4 (`fmt: 'a4'`, linha 293).
2. Na aba Página, o seletor **"Tamanho da folha"** (linha 843) tem duas opções:

   | Valor | Rótulo |
   |---|---|
   | `a4` | A4 paisagem · 297 × 210 mm |
   | `a3` | A3 paisagem · 420 × 297 mm |

3. Abaixo aparecem os botões **Baixar PNG** e **Baixar JPEG**, que baixam a folha-modelo do tamanho escolhido. A nota do painel diz:
   - "A4 · 3508 × 2480 px · 300 dpi. Prefira PNG: o JPEG borra linhas finas e cotas."
   - "A3 · 4961 × 3508 px · 300 dpi", com o mesmo conselho.

**Arquivos baixados:**

| Folha | PNG | JPEG |
|---|---|---|
| A4 | `DeCroqui-folha-modelo-A4.png` | `DeCroqui-folha-modelo-A4.jpg` |
| A3 | `DeCroqui-folha-modelo-A3.png` | `DeCroqui-folha-modelo-A3.jpg` |

**Como a imagem é gerada (`downloadTpl`):**
- O fator é `k = 300 ÷ 25,4` pixels por mm, multiplicado por 1,41421 no A3.
- O canvas tem `round(297 × k)` × `round(210 × k)` pixels.
- O JPEG sai com qualidade 0,95.

| | A4 | A3 |
|---|---|---|
| Fator `k` | 11,811 px/mm | 16,703 px/mm |
| Pixels | 3508 × 2480 | 4961 × 3508 |
| Tamanho real a 300 dpi | 297,01 × 209,97 mm | 420,04 × 297,01 mm |
| Proporção | 1,41452 | 1,41420 |

## 3. A moldura é gerada pelo código

`apDrawTpl(ctx, k, logo)` desenha tudo em milímetros, num quadro de 297 × 210 mm, e multiplica cada medida por `k`. O A3 é o mesmo desenho, ampliado por 1,41421.

**O que ela desenha, em mm:**

| Parte | Posição e tamanho | Cor |
|---|---|---|
| Fundo | 297 × 210 | `#ffffff` |
| Faixa do topo | altura 2,5 | `#e5ded2` |
| Faixa do rodapé | de 196 a 210 (14 de altura) | `#e5ded2` |
| Linha sobre o rodapé | 0,35 de espessura | `#490b1a` |
| Logo | em (8; 199,8), com 24,3 × 6,4 | Vem de `img[data-logo]` da página |
| Divisórias das 6 células do rodapé | x = 80, 124, 152, 196, 240 e 272; 0,2 de largura e 9,2 de altura, a partir de 198,6 | `#bdb09b` |
| Rótulos das células | 3 mm depois de cada divisória, em y = 200,9 | `#4f627b` |

- Os rótulos são AMBIENTE, FASE, PROJETO, CLIENTE, DATA e FOLHA (`AP_RODCELLS`, linha 233), em Jost 500 de 1,75 mm, com espaçamento de 0,32 mm entre letras.
- **O que a moldura não tem:** os valores do rodapé (nome do ambiente, cliente, data e folha). Quem escreve esses valores é a página, por cima da imagem importada, nas mesmas posições em mm, quando "Rodapé" está ligado (linha 172).
- **Prévia na tela:** a página gera também uma versão pequena para mostrar no painel (`makeTpl`, `k = 4`, 1188 × 840 px). Essa versão não é baixada.

## 4. Unidades e escala de exportação

- **Unidade:** todas as medidas da moldura estão em **milímetros**. Pixels só aparecem na conversão final, pelo fator `k`. Não há pontos tipográficos (pt).
- **DPI gravado no arquivo** (`apDpi`):
  - **PNG:** insere um bloco `pHYs` com 11811 pixels por metro (300 dpi).
  - **JPEG:** escreve 300 × 300 dpi no cabeçalho JFIF.
  - É isso que deve fazer a imagem entrar com 297 × 210 mm (ou 420 × 297 mm) quando colocada num programa que respeita o DPI do arquivo.
- **Escala de exportação:** a moldura não tem escala de desenho (1:50, 1:25) nem escala gráfica. Ela só fixa o tamanho da folha. A escala do desenho vem do SketchUp LayOut, onde o usuário desenha sobre a folha.
- **Na prancha da apresentação:**
  - **Na tela:** a imagem importada ocupa a folha inteira de 297 × 210 mm (`object-fit: contain`, linha 172).
  - **No PDF de uma prancha A3:** a folha é ampliada por 1,41421 e sai numa página de 420 × 297 mm (`@page pa3`, linha 402). O caso `apr-66` mediu 420,2 × 297 mm.
  - **O que mantém a escala:** a proporção da imagem, não a quantidade de pixels. Uma imagem de 1754 × 1240 px (150 dpi) e outra de 3508 × 2480 px ocupam o mesmo tamanho na folha. A resolução só muda a nitidez.
- **Verificações ao importar** (linha 594): são só avisos. A imagem entra mesmo assim.

  | Situação | Aviso |
  |---|---|
  | Imagem em retrato | "A prancha está em retrato…" |
  | Proporção diferente de 1,41421 em mais de 1,5% | "A imagem não tem a proporção de uma folha A4…" |
  | Resolução abaixo de 200 dpi, calculada pela largura | "Resolução baixa…" |

- **Redução automática** (`apProcess`, linha 355): a prancha aceita até 7200 px no lado maior e 40 MB. Acima de 7200 px, a imagem é reduzida mantendo a proporção. A escala na folha não muda, porque ela sempre ocupa a folha inteira.

## 5. O que falta para o fluxo funcionar no ERP

O fluxo descrito tem quatro passos:
1. baixar a moldura A4 ou A3;
2. desenhar sobre ela no SketchUp LayOut;
3. exportar a página inteira;
4. importar na prancha.

Para isso funcionar no ERP, falta o seguinte:

1. **A moldura não existe como arquivo.** Para baixar pelo sistema, há dois caminhos:
   - levar o desenho de `apDrawTpl` para o ERP e gerar no navegador, como a página offline faz, sem rota nova e sem Drive;
   - ou gerar os quatro arquivos (A4 e A3, PNG e JPEG) uma vez, conferir e guardar no repositório, como arquivos estáticos.

   Hoje o ERP não tem nenhum dos dois. Se a moldura só for baixada da página offline, o ERP não precisa de nada disso.
2. **Rodapé por cima da imagem.** A prancha do ERP precisa escrever os valores do rodapé nas mesmas posições em mm da moldura. Se a posição mudar, os valores caem fora das células. As posições estão na seção 3.
3. **Medida da imagem exportada.**
   - Para a escala, o que importa é a **proporção exata** da folha (√2, ou seja, 297 × 210 e 420 × 297) e a página exportada **inteira, sem margens nem corte**. A quantidade de pixels não importa.
   - Para a nitidez, a página offline recomenda 300 dpi, ou seja, 3508 × 2480 px no A4 e 4961 × 3508 px no A3, e avisa abaixo de 200 dpi.
   - Hoje uma imagem 1,5% fora da proporção entra só com aviso. Dentro da tolerância, a escala pode ficar até cerca de 1,5% errada num eixo.
4. **O DPI gravado na moldura** serve para o SketchUp LayOut posicioná-la com o tamanho certo. Não consegui conferir aqui se o LayOut respeita o DPI do PNG ou do JPEG. Se não respeitar, o usuário precisa ajustar a imagem para 297 × 210 mm à mão.
5. **Formato da imagem importada.** A página aceita PNG, JPEG e WebP. O LayOut também exporta PDF, que a prancha não aceita.
6. **A3 dentro de documento A4.** A página offline resolve com `zoom: 1.41421` e `@page pa3`. No ERP, o PDF é gerado no servidor, e isso precisa ser testado com o Chromium da Vercel (risco R9 do planejamento).
7. **Rotas:**
   - se a moldura for gerada no navegador ou servida como arquivo estático, não precisa de rota de API;
   - a importação da prancha usa o mesmo envio direto ao Drive das outras imagens, com o limite de 7200 px.

## 6. Perguntas para você

- **M1.** A moldura é baixada pelo ERP, na prancha, ou só pela página offline?
- **M2.** Se for pelo ERP, ela é gerada no navegador, como na página offline, ou guardada no repositório como quatro arquivos prontos (A4 e A3, PNG e JPEG)?
- **M3.** Continua oferecendo JPEG, ou só PNG? A própria página diz que o JPEG borra linhas finas e cotas.
- **M4.** Qual resolução a imagem exportada do LayOut deve ter: exatamente 300 dpi (3508 × 2480 e 4961 × 3508 px), ou qualquer resolução a partir de 200 dpi, desde que a proporção esteja certa?
- **M5.** A prancha recusa uma imagem fora da proporção, ou só avisa, como hoje? Se só avisar, a tolerância continua 1,5%, ou fica menor (por exemplo 0,5%)?
- **M6.** A prancha precisa aceitar PDF exportado do LayOut, ou só PNG e JPEG?
- **M7.** Você confirma que o LayOut coloca a moldura PNG com 297 × 210 mm ao inserir? Ou é preciso ajustar o tamanho à mão no LayOut?
- **M8.** O desenho da moldura continua igual ao da página offline (faixas, logo e as 6 células AMBIENTE, FASE, PROJETO, CLIENTE, DATA e FOLHA)? Ou muda na 6d? Se mudar, as pranchas já exportadas com a moldura antiga ficam desalinhadas com o rodapé novo.
- **M9.** Com a decisão de não ter ferramenta de escala, as composições "Desenho técnico" (DPI, Exportado em, cota, escala gráfica e carimbo automático) saem da apresentação? Ou o tipo fica só com imagem, título e o texto de escala digitado?

## 7. Decisões (aceitas pela dona do projeto em 2026-11-07)

As respostas às perguntas M1 a M9 da seção 6. A prancha e a moldura ficam para a **6d**. Na 6b nada disso é implementado.

| Nº | Decisão |
|---|---|
| M1 | **A moldura é baixada pelo ERP.** A página offline deixa de ser a única fonte |
| M2 | **São quatro arquivos prontos guardados no repositório,** e não gerados no navegador. O código de `apDrawTpl` não é levado para o ERP |
| M3 | **A moldura é baixada só em PNG.** O JPEG sai do download porque borra linhas finas e cotas |
| M4 | **A imagem exportada pode ter qualquer resolução a partir de 200 dpi,** desde que a proporção esteja exata. A recomendação é 300 dpi: 3508 × 2480 px no A4 e 4961 × 3508 px no A3 |
| M5 | **A prancha recusa a imagem se a proporção diferir mais de 0,5% da folha.** Até 0,5%, a imagem entra sem aviso. No arquivo offline, a tolerância era de 1,5% e só gerava aviso |
| M6 | **A prancha aceita só PNG, JPEG e WebP nesta versão.** PDF não é aceito |
| M7 | **Pendente:** falta conferir se o LayOut coloca a moldura com 297 × 210 mm. A conferência fica para a 6d, quando a prancha existir. Não foi feito teste agora |
| M8 | **O desenho da moldura fica congelado.** Uma mudança futura vira uma nova versão da moldura, e as pranchas antigas continuam com a versão com que foram feitas |
| M9 | **"Desenho técnico" fica só com imagem e um campo de texto para a escala digitada** (por exemplo, 1:50). Não há cota automática, escala gráfica nem carimbo automático |

Duas leituras que deixo registradas:

- **M3 e M6 juntas:** o JPEG sai só do download da moldura. Na importação da prancha, JPEG e WebP continuam aceitos, como diz M6. Se a ideia era também recusar JPEG na importação, M6 precisa ser corrigida.
- **Medida exata de cada arquivo, a conferir na 6d:** os quatro arquivos devem ter as mesmas dimensões e o mesmo desenho que a página offline gera hoje (seções 2 e 3), com 300 dpi gravados no arquivo:
  - A4: 3508 × 2480 px;
  - A3: 4961 × 3508 px.

  A versão congelada é a "versão 1" de M8. Como são só PNG, os quatro arquivos se reduzem a dois. Fica o registro para confirmar na 6d.

**O que entra na 6d, por causa dessas decisões:**
- os arquivos da moldura versão 1 no repositório, servidos como arquivos estáticos, sem rota de API;
- o número da versão da moldura gravado em cada prancha;
- a recusa por proporção acima de 0,5%;
- o aviso de resolução abaixo de 200 dpi;
- o rodapé escrito nas posições em mm da seção 3;
- a conferência de M7 no LayOut.
