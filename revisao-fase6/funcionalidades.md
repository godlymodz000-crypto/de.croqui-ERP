# Fase 6: funcionalidades do Orçamento e da Apresentação

Esta lista vem dos arquivos offline, para aprovação. Nenhuma tela foi codificada. Esta etapa não alterou código de aplicação, banco, migrações, permissões, login nem nada em produção.

- Branch: `feat/fase-6-orcamento-apresentacao`, a partir da main (`19d8f70`).
- Arquivos lidos, inteiros (código e marcação):
  - `referencias-offline/Orcamento De.Croqui (offline).html`;
  - `referencias-offline/Apresentacao De.Croqui (offline).html`.
- Casos de teste: `revisao-fase6/casos-de-teste.json`, com 29 casos do Orçamento e 66 da Apresentação, todos gerados no próprio arquivo original.

## 1. Os arquivos

- **Onde estão:** em `referencias-offline/`, com os nomes pedidos.
- **Formato:** os dois são páginas empacotadas. O código das telas, o React 18.3.1, o design system, as fontes e o logo vêm compactados dentro do próprio HTML.
- **Sem internet:** abri os dois no Edge sem interface, com a rede desligada e qualquer endereço `http`/`https` bloqueado.
  - Os dois carregaram por completo, com fontes e logo.
  - Não houve nenhuma tentativa de acesso externo nem erro no console.
- **Funcionam:** no Orçamento, mudar "Render 3D / ambiente" para 200 levou o total da Opção 01 de R$ 1.250,00 para R$ 1.550,00. A Apresentação abriu as 11 páginas de exemplo e mostrou "Salvo neste dispositivo".
- **Capturas:** `capturas/original-orcamento-1440.png` e `capturas/original-apresentacao-1440.png`.

---

## 2. Orçamento

### 2.1 Tela

O painel de 340 px fica à esquerda. À direita aparecem as folhas A4 da proposta, reduzidas para caber: zoom = largura útil − 56, dividida por 794 e limitada entre 0,4 e 1.

O topo do painel tem o título "Kit de orçamento / Preencha a proposta", um texto de ajuda e os botões **Salvar em PDF** e **Restaurar exemplo**.

### 2.2 Campos do painel

Nenhum campo é obrigatório e o arquivo não valida nenhum. Campo vazio aparece vazio na folha; nas datas, aparece "—".

| Seção | Campo | Tipo | Exemplo de fábrica | Regra |
|---|---|---|---|---|
| Opções no orçamento | Opção 01 · Com parceria em marcenaria | caixa de seleção | marcada | Pelo menos uma das duas fica marcada: desmarcar a única marcada não tem efeito |
| | Opção 02 · Projeto completo | caixa de seleção | marcada | Idem |
| Cliente | Nome do cliente | texto | Adriana Gregorio | |
| | Contato do cliente | texto | (85) 9 9754-6380 | Sem máscara |
| | Data | data (AAAA-MM-DD) | 2026-09-17 | Aparece como DD/MM/AAAA |
| | Válida até | data | 2026-10-17 | Não é calculada a partir da data |
| | Imóvel | texto longo (3 linhas) | Apartamento (2 quartos…) | |
| Ambientes | Nome do ambiente | texto, um por linha | Quarto 1, Quarto 2, … (6) | |
| | Valor · opção 02 | número (mínimo 0, passo 10) | 350 | Vazio conta como 0 |
| | × (remover ambiente) | botão | | Remove na hora, sem confirmação |
| | Adicionar ambiente | botão | | Entra "Novo ambiente" com o valor do campo abaixo |
| | Aplicar valor a todos (opção 02) | número + botão Aplicar | 350 | Troca o valor de todos os ambientes |
| Opção 01 · marcenaria parceira | Render 3D / ambiente | número | 150 | Vazio conta como 0 |
| | Executivo geral | número | 350 | Vazio conta como 0 |
| | Mostrar nota da marcenaria parceira | caixa de seleção | marcada | Mostra ou esconde a nota da folha da Opção 01 |
| Pagamento | Cartão | texto | Em até 10x com juros. | |
| Estúdio | Projetista | texto | Andreza Kelly | |
| | Contato da projetista | texto | (85) 9 9704-4540 | |
| | E-mail | texto | decroqui.arts@gmail.com | Sem validação |
| | Região | texto | Alagoas / Ceará | |

Os campos de número aceitam decimais, porque o passo 10 é só uma sugestão do navegador. Também aceitam negativos digitados, porque o mínimo 0 não é imposto.

### 2.3 Textos editáveis direto na folha

Estes textos podem ser editados clicando na folha:
- **Folha 1:** as quatro observações, a condição "Em dinheiro" (50% no fechamento e 50% na entrega) e a frase final ("Por favor, entre em contato…").
- **Folha 2:** o "Incluso" do render, o "Incluso" do executivo (iluminação, bancadas, pintura, paginação) e a nota da marcenaria.
- **Folha 3:** "O que está incluso".

**Esses textos não são salvos** (caso `orc-29`). A edição continua na tela enquanto a página está aberta, mas não vai para o armazenamento e some ao recarregar.

### 2.4 Folhas

| Folha | Aparece quando | Conteúdo |
|---|---|---|
| 01 Resumo | sempre | Logo, e-mail, contato e região. Título "Proposta para *cliente*". Linha com projetista, contato, data, cliente e contato do cliente. Título de investimento e contagem de ambientes. Um cartão por opção marcada, com o total e a descrição. Observações, condições de pagamento, validade, frase final e rodapé com número de página |
| 02 Opção 01 | Opção 01 marcada | Cabeçalho, imóvel, "01 · Por ambiente" (valor por ambiente e incluso), "02 · Taxa única" (executivo e incluso), resumo (render, executivo e total), nota opcional e rodapé |
| 03 Opção 02 | Opção 02 marcada | Cabeçalho, imóvel, "Por ambiente" (valor ou "Conforme o ambiente"), "O que está incluso", lista de ambientes com valor, total e rodapé |

### 2.5 Cálculos

Todos os valores estão em reais. O arquivo não arredonda nada no cálculo. Cada número só é arredondado na hora de aparecer, com `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`:
- duas casas decimais, com a metade arredondada para cima sobre o valor em ponto flutuante;
- separador de milhar ".", vírgula decimal e espaço não separável depois de "R$".

| Cálculo | Fórmula | Casos |
|---|---|---|
| Render da Opção 01 | n × Render 3D por ambiente, em que n é o número de ambientes e campo vazio vale 0 | orc-01 a 04 |
| Total da Opção 01 | render + executivo geral | orc-01 a 04 |
| Total da Opção 02 | soma dos valores dos ambientes (vazio vale 0) | orc-05 a 08 |
| Valores uniformes | n > 0 e todos os valores iguais | orc-05 a 08, 13 |
| Texto do cartão da Opção 02 | Valores uniformes: "R$ X por ambiente, com detalhamento completo incluso em todos". Diferentes: "Valor por ambiente com detalhamento completo incluso — ver página 03" (ou "02" sem a Opção 01) | orc-05, 06, 11 |
| "Por ambiente" da folha 3 | Valores uniformes: "R$ X por ambiente". Diferentes: "Conforme o ambiente" | orc-05, 06, 13 |
| Títulos | Duas opções: "Opções de investimento", etiquetas "Opção 01" e "Opção 02", sobretítulo "Opção 0X · Orçamento…". Uma opção: "Investimento", etiqueta "Sua proposta", sobretítulo sem "Opção 0X · " | orc-09 a 11 |
| Numeração | total = 1 + (Opção 01 ? 1 : 0) + (Opção 02 ? 1 : 0). Resumo "01 / TT", Opção 01 "02 / TT", Opção 02 "03 / TT" (ou "02 / TT" sem a Opção 01) | orc-09 a 11 |
| Contagem | "1 ambiente" ou "N ambientes" (inclusive "0 ambientes"), com "no total" na folha 3. A linha do render diz sempre "ambientes", até com 1 ("1 ambientes") | orc-12 a 14 |
| Datas | AAAA-MM-DD vira DD/MM/AAAA; vazio vira "—" | orc-15 a 17 |

Efeitos do arredondamento só na hora de exibir:
- Em `orc-03`, o render aparece como R$ 100,01, o executivo como R$ 0,01 e o total como R$ 100,01.
- Em `orc-08`, as linhas aparecem como R$ 1.234.567,89 e R$ 0,00, e o total como R$ 1.234.567,90.

Nos dois casos, a soma das parcelas mostradas não bate com o total mostrado.

### 2.6 Botões e ações

| Botão | O que faz |
|---|---|
| Salvar em PDF | Abre a impressão do navegador (`window.print()`) |
| Restaurar exemplo | Pergunta "Voltar ao exemplo e apagar os dados preenchidos?" e, se confirmado, volta a todos os dados de exemplo (`orc-25`) |
| Adicionar ambiente | Inclui "Novo ambiente" com o valor de "Aplicar valor a todos" (`orc-21`) |
| Aplicar | Põe o valor de "Aplicar valor a todos" em todos os ambientes (`orc-20`) |
| × do ambiente | Remove o ambiente, sem confirmação (`orc-22`) |
| Caixas das opções | Ligam e desligam a folha da opção; a última marcada não desmarca (`orc-23`) |

### 2.7 PDF e regra A4

- A página é definida com `@page { size: A4; margin: 0 }`.
- Cada folha tem 210 mm de largura e **altura mínima** de 297 mm, com margens internas de 14, 16 e 11 mm.
- Cada folha termina com quebra de página. O fundo e as cores são impressos e o painel fica de fora.
- Com as duas opções e até cerca de 6 ambientes, o PDF sai com 3 páginas de 210 × 297 mm (`orc-26`).
- **A folha não tem altura máxima.**
  - Com 10 ambientes, a folha da Opção 02 chega a 329 mm.
  - Com 20 ambientes, chega a 433 mm.
  - Nos dois casos, o PDF sai com 4 páginas e o fim da lista cai numa página sozinha (`orc-27`, `orc-28`).

### 2.8 Como os dados são salvos

- **Onde:** `localStorage`, na chave `decroqui-orcamento-v1`, como JSON gravado a cada alteração. Ao abrir, o que estiver salvo se mistura com os dados de exemplo.
- **Alcance:** um orçamento por navegador. Não há lista de orçamentos, importação nem exportação de arquivo de dados.
- **O que fica de fora:** os textos editados direto na folha (item 2.3).

---

## 3. Apresentação

### 3.1 Tela

- **Painel de 360 px:**
  - topo com "Kit de apresentações / Monte a apresentação" e a situação do salvamento;
  - botões **Exportar PDF**, **Prévia** (vira **Editar**) e **Novo**;
  - abas **Projeto**, **Páginas** e **Página**.
- **Barra sobre as folhas:** ‹ ›, "Página NN de T", tipo e título da página atual, a etiqueta "Prévia de impressão" quando a prévia está ativa e zoom (− % +).
- **Folhas:** em rolagem contínua. Rolar muda a página atual, e clicar numa folha a seleciona.
- **Onde editar:** no painel ou direto na folha.
  - Na folha, o texto é colado sem formatação e Esc sai da edição.
  - Os textos de exemplo em cinza não são impressos.
  - A prévia esconde os textos de exemplo e os campos vazios.

### 3.2 Aba Projeto

Nenhum campo é obrigatório. Campo vazio não é impresso.

| Campo | Tipo | Valor inicial | Onde aparece |
|---|---|---|---|
| Nome do projeto | texto | vazio | Capa, cabeçalho das páginas, carimbo, rodapé da prancha |
| Tipo de apresentação | texto | Apresentação de projeto | Capa |
| Cliente | texto | vazio | Capa, rodapé, carimbo, prancha |
| Projetista / responsável técnico | texto | Andreza Kelly | Capa, carimbo |
| Registro profissional | texto | vazio | Capa |
| Localização | texto | vazio | Capa, rodapé da prancha |
| Data de emissão | texto livre | a data de hoje por extenso | Capa, rodapé das páginas, prancha (em forma curta) |
| Código do projeto | texto | vazio | Capa |
| Marca / escritório | texto | De.Croqui | Cabeçalho das páginas |
| Contato | texto | decroqui.arts@gmail.com · (85) 9 9704-4540 | Capa, rodapé da prancha |
| Formato da página | lista | A4 paisagem · 297 × 210 mm | Todas as folhas. Outras opções: A3 paisagem · 420 × 297 mm e Tela 16:9 · 297 × 167 mm |

### 3.3 Aba Páginas

- **Lista:** cada linha mostra número, tipo · composição, título e o aviso "Conteúdo excede a página", com os botões ↑, ↓, Duplicar e ×.
  - Excluir pede confirmação.
  - A apresentação precisa de pelo menos uma página.
- **Adicionar página:** os 8 tipos. A nova página entra logo depois da atual.
- **Exemplo inicial (11 páginas):**
  1. Capa;
  2. Texto & conceito;
  3. Moodboard;
  4. Visual "Sala de estar", imagem grande e texto;
  5. Visual "Cozinha", principal e duas menores;
  6. Visual "Suíte", duas imagens;
  7. Visual "Vista isométrica", isométrica e ficha técnica;
  8. Desenho técnico "Planta baixa", um desenho;
  9. Desenho técnico "Vistas e elevações", quatro desenhos;
  10. Notas técnicas;
  11. Direitos autorais.

### 3.4 Aba Página: os 8 tipos

| Tipo | Opções | Campos | Itens |
|---|---|---|---|
| Capa | Composição: imagem em arco, imagem lateral inteira ou só tipografia. Cor: vinho, noite ou linho. Tamanho da marca: pequeno (12 mm), médio (18 mm) ou grande (26 mm) | Os dados vêm da aba Projeto | Uma imagem, opcional |
| Texto & conceito | Composição das imagens: diagonal, lado a lado, uma abaixo da outra, imagem grande abaixo do texto ou personalizado | Sobretítulo, título, texto introdutório | Blocos de texto (título e texto) e blocos de imagem (legenda, formato arco ou retangular; no modo personalizado também posição e altura) |
| Moodboard de materiais | | Sobretítulo, título, introdução | Materiais com imagem, nome, fabricante, código, cor/acabamento, ambiente e observações, todos opcionais. 6 no início |
| Apresentação visual | Composição: imagem grande e texto (1), duas lado a lado (2), principal e duas menores (3), isométrica e ficha técnica (1) ou várias imagens (4 ou mais) | Sobretítulo, título, descrição, programas utilizados, observações técnicas | Imagens com legenda. Fora de "várias imagens", a quantidade é fixa |
| Desenho técnico | Composição: um desenho, dois, principal e dois menores, ou quatro | Sobretítulo, título, observações, escala, unidade | Desenhos com título, referência de medida e escala de impressão. Carimbo com projeto, cliente, projetista, escala, unidade e folha |
| Prancha de detalhamento | Tamanho: A4 ou A3 paisagem. Rodapé: preencher com os dados do projeto, ou não | Ambiente/título, fase | Uma prancha importada. Folha-modelo para baixar em PNG ou JPEG |
| Notas técnicas | | Sobretítulo, título, introdução | Notas com categoria, título e texto. 4 no início |
| Direitos autorais | | Sobretítulo, título, autoria, escritório responsável, condições de uso, restrições, observações legais. Os textos-modelo em cinza não são impressos | |

- **Moldura:** todas as páginas, menos a capa e a prancha, têm cabeçalho e rodapé.
  - Cabeçalho: marca e nome do projeto à esquerda, nome da seção à direita.
  - Rodapé: "cliente · data" à esquerda e "NN / TT" à direita.
- **No fim do painel:** Duplicar página e Excluir página.

### 3.5 Imagens

- **Inserir:** clique ou arraste sobre o espaço da imagem, na folha ou no painel.
  - Com vários arquivos de uma vez, os seguintes preenchem os espaços vazios da mesma lista.
  - Se sobrarem arquivos, aparece um aviso.
- **Ferramentas sobre a imagem:**
  - Trocar;
  - Ajustar/Preencher;
  - − e +, zoom de 1 a 4 em passos de 0,15;
  - Centro;
  - × para remover, com confirmação;
  - Escala, só no desenho técnico;
  - Arco/Retângulo, só nos blocos de imagem do texto.
- **Arrastar a imagem** muda o enquadramento, de 0 a 100% em cada eixo.
- **Desenho em escala real:** o zoom fica bloqueado e um aviso explica por quê.

### 3.6 Cálculos

| Cálculo | Fórmula | Casos |
|---|---|---|
| Escala por resolução | px por mm real = DPI ÷ 25,4 ÷ D × (largura atual em px ÷ largura original), em que D é o denominador de "Exportado em" ("1:25" ou "25"). Tamanho real = pixels ÷ px por mm | apr-01, 04, 07 |
| Escala por cota | O usuário clica no início e no fim de uma cota e digita a medida real. px por mm = distância entre os cliques (em px da imagem) ÷ medida em mm. Aceita "600", "60 cm" e "0,6 m"; sem unidade, vale a da página (cm ou m), ou mm. Pontos a menos de 8 px são recusados | apr-10 a 12 |
| Maior escala que cabe | A primeira de 1, 2, 5, 10, 20, 25, 50, 75, 100, 125, 200, 250 e 500 em que tamanho real ÷ N ≤ área × 1,004, na largura e na altura. A área é medida na folha, em mm | apr-01, 04, 07, 10 a 12 |
| Escala automática | Ao informar DPI e origem: a maior que cabe, ou o próprio D. Ao medir uma cota: a maior que cabe | apr-01, 04, 07, 10 a 12 |
| Impressão em escala | mm por pixel = 1 ÷ (px por mm × escala × fator do formato; 1,41421 no A3). Aviso "não cabe inteiro" quando tamanho real ÷ escala > área + 0,6 mm | apr-03, 06, 08, 09 |
| Escala gráfica | L = maior valor de 10, 20, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000 e 50000 mm com L ÷ escala ≤ 32 mm. Largura = (L ÷ escala) ÷ fator, com 3 casas. Rótulo: a partir de 1000 mm em m (até 2 casas), a partir de 10 mm em cm (1 casa), senão em mm | apr-01 a 12 |
| Escala do carimbo | Todos os desenhos mostrados com escala e todas iguais: "1:N". Escalas diferentes: "Indicada". Nenhuma: vale o texto digitado | apr-13 a 15 |
| Data curta da prancha | "D de mês de AAAA" vira DD.MM.AAAA; qualquer outro formato fica como está | apr-16 a 19 |
| Folha da prancha | posição entre as pranchas / total de pranchas, como "01/03" | apr-16, 17 |
| Contatos da prancha | O contato é dividido por "·": o 1º e o 2º itens vão para as linhas 1 e 2, e o resto, junto com a localização, para a linha 3 | apr-16 a 19 |
| Numeração das páginas | "NN / TT" contando todas as páginas; a capa não mostra número | apr-20, 21 |
| Colunas do moodboard | n ≤ 4: n (mínimo 1); n ≤ 6: 3; n ≤ 8: 4; n ≤ 10: 5; mais: 6 | apr-22 a 32 |
| Grade "várias imagens" | Completa até 4 espaços. Colunas: n ≤ 3: n; n = 4: 2; n ≤ 6: 3; n ≤ 8: 4; n = 9: 3; mais: 4. Linhas = arredondamento para cima de n ÷ colunas, até 6 | apr-33 a 44 |
| Importação de imagem | Aceita PNG, JPG e WebP (pelo tipo ou pela extensão), até 40 MB. Reduz para 4000 px no lado maior quando passa disso ou quando o arquivo passa de 8 MB. Na prancha, o limite é 7200 px. PNG continua PNG; o resto vira JPEG com qualidade 0,9 | apr-51 a 54 |
| Verificação da prancha | Retrato: aviso. Proporção diferente de 1,41421 em mais de 1,5%: aviso. DPI = arredondado(largura ÷ 297 ou 420 × 25,4); abaixo de 200: aviso | apr-45 a 50 |
| Folha-modelo | 297 × 210 mm a 300 dpi: 3508 × 2480 px no A4 e 4961 × 3508 px no A3. O DPI é gravado no arquivo (PNG ou JPEG). O desenho tem faixas, logo e as 6 células do rodapé | apr-55, 56 |
| Zoom de ajuste | (largura útil − 64) ÷ 1123, entre 0,25 e 1,4. No A3, o rótulo divide por 1,41421. Os botões andam 0,1, entre 0,25 e 2 | apr-57 a 60 |
| Conteúdo excedente | O corpo da página é mais alto ou mais largo que a área (+3 px): aviso na lista e confirmação ao exportar | apr-61 |

### 3.7 Botões e ações

| Botão | O que faz |
|---|---|
| Exportar PDF | Fecha a edição em curso. Se há páginas excedentes, pede confirmação ("N página(s) têm conteúdo além do limite e serão cortadas no PDF…"). Se há desenhos em escala real, avisa para imprimir em "Tamanho real" (`apr-62`). Depois abre `window.print()` |
| Prévia / Editar | Mostra as folhas como sairão no PDF |
| Novo | Pergunta e então apaga o documento e todas as imagens deste navegador, voltando ao exemplo |
| ‹ › e zoom | Navegam entre as páginas e mudam o zoom |
| Adicionar, duplicar, mover e excluir páginas e itens | Itens com conteúdo pedem confirmação ao remover |
| Medir uma cota no desenho | Inicia a medição: dois cliques, depois a pergunta da medida real. Esc cancela |
| Resolução (DPI) e Exportado em | Definem a referência de medida sem medir cota |
| Escala de impressão | Livre ou 1:N. Exige referência de medida |
| Baixar PNG e Baixar JPEG | Geram a folha-modelo da prancha |

### 3.8 PDF e regras de página

- **Páginas:** `@page` muda com o formato: 297 × 210 mm (A4), 420 × 297 mm (A3) ou 297 × 167,06 mm (16:9). Margem 0, uma folha por página, conteúdo excedente cortado.
- **A4 conferido no PDF (`apr-63` a `apr-66`):** páginas de 297 × 209,9 mm. É uma diferença de arredondamento do PDF.
- **Prancha A3 num documento A4:** ela sai numa página A3 dentro do mesmo PDF (`apr-66`).
- **O que não sai:** textos de exemplo, campos vazios, ferramentas e avisos.
- **Escala real:** depende de imprimir em "Tamanho real" (100%).

### 3.9 Como os dados são salvos

- **Onde:**
  - IndexedDB `decroqui-apresentacao`, com a store `docs` (chave `atual`) para o documento e `imgs` para as imagens em blob;
  - cópia do documento, sem imagens, no `localStorage` (`decroqui-apresentacao-backup-v1`);
  - ao abrir, vale a versão mais recente das duas.
- **Quando:** 450 ms depois de cada alteração, e também ao fechar a página quando há alteração pendente.
- **Situação mostrada:** "Carregando…", "Alterações pendentes", "Salvando…", "Salvo · HH:MM" ou "Erro ao salvar".
- **Imagens:**
  - imagens que nenhuma página usa são apagadas ao abrir;
  - se faltar uma imagem, aparece aviso e o espaço pede para inserir de novo;
  - o arquivo pede ao navegador armazenamento persistente.
- **Alcance:** um documento por navegador. Não há importação nem exportação de arquivo de dados.

---

## 4. O que os arquivos fazem e o ERP talvez não deva fazer

Estes são candidatos para você decidir. Não decidi nenhum.

1. **Guardar tudo só no navegador.** Os dados não acompanham o projeto nem a pessoa, e se perdem ao limpar o navegador.
2. **"Novo" e "Restaurar exemplo" apagam tudo de uma vez.** O "Novo" da Apresentação também apaga as imagens.
3. **Dados de exemplo com nomes e telefones de pessoas** embutidos no código: cliente "Adriana Gregorio", com telefone, e projetista "Andreza Kelly", com telefone.
4. **Textos editados direto na folha do Orçamento não são salvos.** Eles se perdem sem aviso.
5. **Remover ambiente sem confirmação**, enquanto a Apresentação pede confirmação para remover itens.
6. **Diálogos nativos do navegador** (`confirm`, `prompt`, `alert`), inclusive para digitar a medida da cota. O ERP usa os diálogos do design system.
7. **Imagens de até 40 MB no navegador.** No ERP, a API na Vercel recebe no máximo 4,5 MB por requisição, então imagens grandes não passam pela API como estão hoje.
8. **Apagar sozinho, ao abrir, as imagens que nenhuma página usa.**

---

## 5. Comparação com os desenhos aprovados

Desenhos comparados, em `design/`:
- `erp-editor-orcamento-1440-rolagem-completa.png`;
- `erp-editor-apresentacao-1440.png`;
- `erp-editor-apresentacao-1440-rolagem-completa.png`;
- `erp-editor-apresentacao-1024.png`;
- `erp-editor-apresentacao-abas-projeto-e-paginas.png`.

### 5.1 Orçamento

**Está no desenho e não no arquivo:**
- Barra superior com "← Voltar para Projetos", o sobretítulo "Orçamento · Design de interiores" e o nome do cliente.
- Os botões Restaurar exemplo e Salvar em PDF na barra superior.
- Painel mais largo (cerca de 520 px no desenho, 340 px no arquivo).

**Está no arquivo e não no desenho:**
- Os botões Salvar em PDF e Restaurar exemplo dentro do painel. No desenho eles foram para a barra superior, e o painel começa direto em "Kit de orçamento".

**Igual nos dois:**
- As seções e os campos do painel: opções, cliente, ambientes com ×, "Adicionar ambiente", "Aplicar valor a todos", Opção 01, nota, pagamento e estúdio.
- As três folhas com os mesmos textos e totais do exemplo: R$ 1.250,00 e R$ 2.100,00, páginas 01/03, 02/03 e 03/03.

**Os dois mantêm:**
- O texto do painel "Os dados ficam salvos neste navegador".
- A ausência de indicador de salvamento.

### 5.2 Apresentação

**Está no desenho e não no arquivo:**
- Barra superior com:
  - "← Voltar para Projetos";
  - o sobretítulo "Apresentação de projeto" e o nome do projeto;
  - a situação "Salvo · 10:42";
  - os botões Prévia e Exportar PDF.
- O botão Novo ao lado do título "Monte a apresentação".
- Painel de cerca de 480 px em 1440. No arquivo, ele tem 360 px. Por isso o zoom de ajuste aparece como 80% no desenho e 90% no arquivo, na mesma janela.

**Está no arquivo e não no desenho:**
- A situação do salvamento e os botões Exportar PDF e Prévia dentro do painel. No desenho, foram para a barra superior.
- Partes que os desenhos não mostram. Não sei se ficam fora ou se só não foram desenhadas:
  - aba Página dos tipos que não são a capa: listas de itens, seletores de composição e campos;
  - prancha de detalhamento: só aparece o botão para adicionar;
  - folha-modelo, medição de cota, DPI, escala de impressão e escala gráfica;
  - modo Prévia, avisos (toasts), aviso de conteúdo excedente e formatos A3 e 16:9 (só aparece a lista "Formato da página" com A4).

**Igual nos dois:**
- As 11 páginas do exemplo, a aba Projeto (mesmos campos e textos) e a aba Páginas (lista com ↑ ↓ Duplicar × e os 8 botões de adicionar).
- A capa com composição, cor e tamanho da marca, e a moldura de cabeçalho e rodapé.
- A tela em 1024: painel de 360 px e zoom de 53%, igual ao arquivo.

---

## 6. Pontos que precisam de decisão sua

1. **Onde ficam os dados:**
   - no banco do ERP, ligados ao projeto;
   - as imagens, na pasta do projeto no Google Drive ou em outro armazenamento;
   - como tratar imagens acima de 4,5 MB, o limite da API na Vercel.
2. **Quantos por projeto:** um orçamento e uma apresentação por projeto, ou vários, como versões? O que o botão "Novo" passa a fazer?
3. **Preencher a partir do projeto:** cliente e nome do projeto vêm do cadastro do projeto? Projetista e contato vêm da pessoa logada ou de um cadastro do estúdio?
4. **Dados de exemplo:** manter "Restaurar exemplo" e o exemplo inicial? Com nomes e telefones de verdade ou fictícios?
5. **Textos fixos do Orçamento:** salvar as edições feitas na folha, que o arquivo perde, ou deixar esses textos fixos?
6. **Arredondamento:**
   - só na exibição, como o arquivo, em que as parcelas podem não somar o total;
   - ou cada valor guardado com 2 casas, com o total somando as parcelas arredondadas.
7. **"1 ambientes" na linha do render:** corrigir para o singular ou copiar o arquivo?
8. **Orçamento com muitos ambientes:**
   - deixar a folha crescer e virar mais uma página no PDF, como hoje;
   - paginar a lista;
   - ou limitar a quantidade.
9. **Validade da proposta:** continua manual ou passa a ser calculada a partir da data (por exemplo, +30 dias)?
10. **Permissões:** quem cria e edita orçamento e apresentação? A pessoa somente leitura só vê e exporta?
11. **Confirmações e a medida da cota:** usar os diálogos do design system no lugar dos do navegador? Remover ambiente passa a pedir confirmação?
12. **PDF:**
    - pela impressão do navegador, como os arquivos, o que exige "Tamanho real" para a escala valer;
    - ou gerado pelo ERP.
13. **Escopo da Apresentação nesta fase:**
    - os 8 tipos de página;
    - as ferramentas de escala (cota, DPI, escala gráfica, carimbo automático);
    - a prancha com folha-modelo;
    - os formatos A3 e 16:9.
    Entram todos, ou só parte?
14. **Barra superior e largura do painel:** seguir o desenho (barra superior com Voltar, título e ações; painel de 520 e 480 px) no lugar do arquivo (ações no painel; 340 e 360 px)?
15. **Situação do salvamento no Orçamento:** o desenho e o arquivo não mostram. Ter "Salvo · HH:MM" como na Apresentação?

---

## 7. Como os casos de teste foram gerados

- Todos rodaram no Edge sem interface, com a rede desligada e qualquer endereço externo bloqueado, abrindo o próprio arquivo original.
- No Orçamento, cada caso grava o estado na chave do arquivo e recarrega a página. As ações usam os campos e botões do painel.
- Na Apresentação, o documento entra pela cópia de segurança que o arquivo lê, e as imagens de teste pelo banco local dele.
  - As imagens são PNGs brancos gerados no navegador, com uma linha de 1000 px para a cota.
  - Escala, cota, importação e folha-modelo passam pelos campos, botões, cliques e pelo soltar de arquivo do próprio arquivo.
- O PDF foi gerado pela impressão do navegador, com o CSS de impressão dos arquivos.
- As medidas de área e zoom foram feitas com a janela em 1440 × 900 px, salvo onde o caso indica outra largura.
- O JSON traz o SHA-256 dos dois arquivos, para conferir que os casos correspondem a esta versão.
