# Fase 6c · E7 · Conferência local (2026-11-15)

Conferência feita só no servidor local: banco em memória (PGlite), Drive simulado e o Edge do computador para o PDF. Nada foi gravado em produção nem numa prévia da Vercel. As apresentações de teste usam dados fictícios ("Projeto Teste", "Cliente Avulso", "Colaborador Teste", "(00) 00000-0000", contato@exemplo.com) e fotos geradas na hora.

Capturas em `revisao-fase6c/capturas-e7/`. As capas (6c-01 a 6c-08) e as abas (6c-15 a 6c-22) foram capturadas no editor, em 1440. As folhas de 6c-09 a 6c-14 foram geradas com o mesmo componente do PDF, com a Prévia desligada (`folha-*.png`). Cada captura foi posta lado a lado com o desenho aprovado para comparar.

Diferenças que vêm só dos dados de teste não contam como divergência. Por exemplo: "Página 01 de 07" no lugar de "01 de 01", o nome do projeto no cabeçalho da folha, "Cliente Avulso" no rodapé e a data de emissão preenchida.

## 1. Folhas e telas contra os desenhos

| Desenho | Situação | Observação |
|---|---|---|
| 6c-01 Capa · arco · Noite | DIVERGÊNCIA | A folha bate. Na prévia do editor, a folha atual tem um contorno vinho que o desenho não mostra (D1). |
| 6c-02 Capa · arco · Linho | DIVERGÊNCIA | O contorno vinho (D1). As linhas da janela em arco ficam bem mais visíveis que no desenho (D2). A marca escura aparece. |
| 6c-03 Capa · lateral · Vinho | OK | Bate com o desenho. |
| 6c-04 Capa · lateral · Noite | DIVERGÊNCIA | Só o contorno vinho (D1). |
| 6c-05 Capa · lateral · Linho | DIVERGÊNCIA | Só o contorno vinho (D1). A marca escura aparece. |
| 6c-06 Capa · tipografia · Vinho | DIVERGÊNCIA | O painel não mostra o campo "Imagem da capa", que o desenho mostra. No lugar dele aparece o aviso da imagem guardada (D3). |
| 6c-07 Capa · tipografia · Noite | DIVERGÊNCIA | O mesmo do 6c-06 (D3) e o contorno vinho (D1). |
| 6c-08 Capa · tipografia · Linho | DIVERGÊNCIA | O mesmo do 6c-06 (D3) e o contorno vinho (D1). A marca escura aparece. |
| 6c-09 Marca · arco | OK | Pequena, média e grande no mesmo lugar, nos três tamanhos do desenho. |
| 6c-10 Marca · lateral | OK | Bate com o desenho. |
| 6c-11 Marca · tipografia | OK | Bate com o desenho. |
| 6c-12 Visual · 5 composições | OK | As cinco composições batem, com os espaços, legendas e a ficha técnica. |
| 6c-13 Texto · 5 composições | DIVERGÊNCIA | Em "Imagens uma abaixo da outra", o desenho espalha os três blocos de texto ao longo da coluna. Na folha, eles ficam juntos no alto (D4). As outras quatro batem. |
| 6c-14 Técnico · 4 composições | DIVERGÊNCIA | O fundo dos espaços de desenho é branco puro. No desenho é um branco quente, mais próximo da folha (D5). A posição e as linhas de escala e unidade batem. |
| 6c-15 Editor · Texto & conceito | OK | Os campos, a lista com ↑ ↓ ×, "+ item" ligado e a folha batem. Em 1024 também. |
| 6c-16 Editor · Moodboard | OK | Bate com o desenho. O moodboard novo já nasce com 6 materiais, então o "+ item" começa desligado, com o motivo. |
| 6c-17 Editor · Visual | OK | Bate com o desenho. Em "Imagem grande + texto ao lado", o "+ Imagem" fica desligado com o motivo, como decidido (P32). |
| 6c-18 Editor · Técnico | DIVERGÊNCIA | O painel bate. Na folha, o fundo branco do espaço de desenho (D5). |
| 6c-19 Editor · Notas | OK | Bate com o desenho. |
| 6c-20 Editor · Direitos | OK | Bate com o desenho. |
| 6c-21 Aba Páginas | DIVERGÊNCIA | A lista, os botões e "Adicionar página" batem. O texto sobre Duplicar é o do 6c-22, não o do 6c-21, e os dois desenhos se contradizem (D6). |
| 6c-22 Diálogo de remover | DIVERGÊNCIA | O título, o texto e os botões batem. O diálogo abre no centro da tela, e o desenho o mostra sobre o painel (D7). |
| "+ item" no limite | OK | Desligado com o motivo escrito em todos os tipos: 6 blocos, 6 materiais, 8 imagens e 6 notas. |
| Cinza dos pendentes | OK | Aparece com a Prévia desligada e some com ela ligada, na capa e nas seis páginas. Em 1440 e 1024 os números são os mesmos: capa 5→0, texto 5→0, moodboard 37→0, visual 4→0, técnico 2→0, notas 9→0, direitos 5→0. |
| Marca escura na capa Linho | OK | Nas três composições em Linho, o editor usa a marca escura. No PDF, também. |
| Topo da tela (nome da apresentação) | DIVERGÊNCIA | Nos desenhos, o nome no topo aparece em cinza. No app, aparece em azul-noite (D8). |

## 2. Aviso das 50 fotos na tela

A apresentação "Teto de fotos" começou com 49 fotos: a da capa e mais 48, em 12 páginas de 4. A 50ª foi enviada pelo editor.

| Conferência | Situação | Observação |
|---|---|---|
| Sem aviso com 49 fotos | OK | Nenhum aviso aparece. |
| A 50ª foto entra e salva | OK | O documento passou a ter 50 fotos. Uma conferência do roteiro leu o banco antes de o salvamento terminar e marcou 49. As conferências seguintes acharam 50. |
| Aviso abaixo do espaço de imagem | OK | "Esta apresentação já tem 50 fotos, o limite para gerar o PDF. Remova alguma foto para adicionar outra." Capturas `teto-50-aviso-1440.png` e `teto-50-aviso-1024.png`. |
| Biblioteca: "Enviar nova imagem" desligado | OK | O aviso aparece na biblioteca. Capturas `teto-50-biblioteca-1440.png` e `teto-50-biblioteca-1024.png`. |
| A 51ª foto escolhida no editor | OK | Aparece o aviso terracota, nada é enviado nem gravado e o documento continua com 50 fotos. Capturas `teto-51-recusada-1440.png` e `teto-51-recusada-1024.png`. |
| A 51ª foto enviada direto à API | OK | A gravação é recusada com 400 `too_many_photos` e o documento continua com 50 fotos. |
| Título da biblioteca | DIVERGÊNCIA | Aberta a partir de um espaço de página, a biblioteca ainda diz "Escolher imagem para a capa" (D9). |

## 3. PDF de conferência

A apresentação "Conferência do PDF" tem capa em arco, cor Linho e marca média, com foto. Depois vêm as cinco composições de texto, o moodboard, as cinco composições visuais, as quatro técnicas, as notas e os direitos. Todos os espaços têm foto (33 fotos de 1600 × 1067) e os textos estão preenchidos.

| Conferência | Situação | Observação |
|---|---|---|
| Ordem das folhas | OK | 18 folhas, na ordem do documento. |
| Rodapé "NN / TT" | OK | A última folha mostra "18 / 18", e a capa não tem número. |
| Marca da capa | OK | A marca escura na capa Linho, em tamanho médio. |
| Nome do arquivo | OK | `Apresentacao-4-Conferencia-do-PDF-2026-11-01.pdf`, versão 1. |
| Gerar de novo sem alteração | OK | 409 `no_changes`, sem arquivo novo. |
| Tamanho e tempo | OK | 1.747.552 bytes (1,7 MB) em 7,5 s, no Edge local. |

As capturas do PDF são `pdf-folha-01-capa-linho.png`, `pdf-folhas-01-a-12.png`, `pdf-folhas-12-a-18.png` e `pdf-folha-18.png`.

## 4. Regras

| Conferência | Situação | Observação |
|---|---|---|
| `npm test` | OK | 827 testes passaram em 44 arquivos. Entre eles estão os de limite: 6 blocos, 6 materiais, 6 notas, 50 fotos (editor e API) e 1 MiB (aviso de 80% e recusa 413). |
| `npm run build` | OK | O build passa. Só aparece o aviso de tamanho de bloco que já existia. |
| Telas antigas: projetos, orçamentos, dashboard e página do projeto | OK | Desde o início da 6c (merge da 6b, `410d29c`), nenhum arquivo dessas telas mudou. Fora das apresentações, a 6c mudou só um comentário em `api/_app/db/schema.ts`. Em relação à `main` local (`8c17804`), as diferenças nessas telas vêm da 6b (PR #6), que já está na `origin/main`. A `main` local está atrás dela. As quatro telas abrem no servidor local (`antiga-*.png`). |

## 5. Divergências para decidir

Nenhuma foi corrigida. Cada uma espera a sua decisão.

- **D1. Contorno vinho da folha atual na prévia do editor.** É um contorno de 2 px, vem da 6b (`editor.css`, `.ppreview__sheet`) e não aparece nos desenhos da 6c. Ele não sai no PDF. A escolha é manter, como na 6b, ou tirar para seguir os desenhos.
- **D2. Janela em arco na capa Linho.** As linhas são brancas com 80% de opacidade (`sheets.css`, `.pcover[data-cor='linho'] .pcover__window`). No 6c-02, elas são quase invisíveis. Isso também sai no PDF quando a capa não tem foto.
- **D3. Capa "Só tipografia".** O painel esconde o campo "Imagem da capa" e mostra "Nesta composição a capa não tem imagem. A imagem escolhida fica guardada e volta ao trocar a composição." Os desenhos 6c-06 a 6c-08 mostram o campo. A escolha é manter o aviso ou mostrar o campo, como no desenho.
- **D4. Texto & conceito, "Imagens uma abaixo da outra".** No 6c-13, os três blocos de texto se espalham ao longo da coluna. Na folha, eles ficam juntos no alto. Isso também sai no PDF.
- **D5. Desenho técnico.** O fundo do espaço de desenho é branco puro. No 6c-14 e no 6c-18, é um branco quente. Isso também sai no PDF.
- **D6. Texto sobre Duplicar na aba Páginas.** O 6c-21 diz que o que acontece com a página copiada "ainda não foi decidido". O 6c-22 diz que Duplicar "está em proposta e ainda não foi aprovado". O app usa o texto do 6c-22. A escolha é qual dos dois textos vale.
- **D7. Diálogo de remover página.** Abre no centro da tela, e o 6c-22 o mostra sobre o painel.
- **D8. Nome da apresentação no topo do editor.** Nos desenhos está em cinza, e no app está em azul-noite. Isso vem da 6b.
- **D9. Título da biblioteca de imagens.** Aberta num espaço de página, ela ainda diz "Escolher imagem para a capa". Não há desenho da biblioteca na 6c, então a proposta é trocar para um título que sirva aos dois casos.
