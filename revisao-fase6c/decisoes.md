# Decisões da Fase 6c (Apresentação, tipos de página)

Decisões aceitas pelo usuário em 2026-11-08. As decisões da 6a e da 6b continuam em `revisao-fase6b/decisoes.md` e valem aqui, salvo o que está abaixo.

## Estado
- Desenhos 6c-01 a 6c-21 aprovados em 2026-11-08.
- E0 aprovada em 2026-11-08: o planejamento (`planejamento.md`) e as respostas às perguntas P29 a P37. O código começa na E1. Cada etapa seguinte depende de aprovação.

## Respostas às perguntas do planejamento (2026-11-08)
- P29: duplicar página mantém a decisão P11 da 6b: a cópia cria um arquivo novo no Drive, para que apagar uma página não afete a outra.
- P30: a página nova começa com os títulos e as categorias do arquivo offline, como nos desenhos, e os textos longos vazios.
- P31: limites aprovados: 12 blocos de texto, 12 materiais, 12 notas, de 4 a 8 imagens em "Várias imagens do ambiente" e 40 páginas.
- P32: imagens que sobram ao trocar para uma composição com menos imagens ficam guardadas e escondidas, como no arquivo offline.
- P33: a imagem escolhida fica guardada na capa "Só tipografia", mas não aparece na folha nem no PDF.
- P34: remover página pede confirmação; remover item não pede. O diálogo de página é desenhado junto da E5.
- P35: o aviso de limite é o mesmo aviso terracota da 6b, com o número da página.
- P36: a ordem dos tipos no menu de adicionar é a mesma de 6c-21.
- P37: duplicar apresentação não entra na 6c; continua como proposta.

## Decisões da E2 (2026-11-08)
- Duplicar página: quando entrar, cria um arquivo novo no Drive (P29). Na 6c o botão fica desligado como proposta (6c-21). Duplicar apresentação não entra na 6c.
- Limite do documento: sobe de 512 KB para 1 MiB. Acima de 1 MiB, o servidor responde 413 `too_large` com o tamanho e o limite. O corpo aceito na rota de salvamento sobe para 2 MiB, só para que essa resposta chegue.
- Editor (E4): aviso a partir de 80% do limite, com o texto "O documento está perto do limite de tamanho. Remova conteúdo ou divida a apresentação.". Acima do limite, recusa o salvamento com a mensagem já existente, sem perder o que foi escrito.

## Decisões da E3 (2026-11-08)
- Espaço de imagem vazio com a Prévia ligada e no PDF: continua como fundo bege, sem o texto em cinza, para a composição não mudar, como no arquivo offline e na capa em arco da 6b.

## Escolhas da E4 (2026-11-08), para conferir
- Itens da lista: clicar no item abre os campos dele logo abaixo, um por vez. Os desenhos 6c-15 a 6c-20 mostram só a lista fechada.
- Apresentação visual: "+ Imagem" só fica ligado em "Várias imagens do ambiente", até 8. Nas outras composições fica desligado, com o motivo escrito. Os desenhos 6c-17 e 6c-18 não mostram "+ item".
- Desenho técnico: sem "+ item". A quantidade de desenhos vem da composição, como no arquivo offline.
- Visual e técnico: o × fica desligado quando a lista já tem só o que a composição usa.
- Itens guardados e escondidos pela composição (P32) continuam na lista, com "Guardada · não aparece nesta composição".
- Botões ‹ › da visualização ligados no computador, porque sem eles não se chega às páginas internas antes da E5. A aba Páginas, o leitor e o celular ficam para a E5.
- Página interna sem a moldura vinho da capa (6b-04), como nos desenhos 6c.
- Recusa acima de 1 MB: a mensagem diz o tamanho que a API devolveu. Recusa 400 com motivo: a mensagem da API, sem nova tentativa automática.

## Regras que continuam
- Sem migração na 6c: tudo cabe em `presentations.data`.
- Sem push, merge ou deploy sem aprovação. Prévias da Vercel não são usadas para gravar. Testes de gravação só em PGlite.
- Dados de exemplo fictícios: "Cliente Avulso", "Colaborador Teste", "(00) 00000-0000" e e-mails @exemplo.com.
