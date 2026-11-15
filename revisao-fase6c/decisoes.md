# Decisões da Fase 6c (Apresentação, tipos de página)

Decisões aceitas pelo usuário em 2026-11-08. As decisões da 6a e da 6b continuam em `revisao-fase6b/decisoes.md` e valem aqui, salvo o que está abaixo.

## Estado
- Desenhos 6c-01 a 6c-21 aprovados em 2026-11-08. 6c-22 (diálogo de remover página) desenhado na E6, com as escolhas aprovadas da E5.
- E0 aprovada em 2026-11-08: o planejamento (`planejamento.md`) e as respostas às perguntas P29 a P37. O código começa na E1. Cada etapa seguinte depende de aprovação.

## Respostas às perguntas do planejamento (2026-11-08)
- P29: duplicar página mantém a decisão P11 da 6b: a cópia cria um arquivo novo no Drive, para que apagar uma página não afete a outra.
- P30: a página nova começa com os títulos e as categorias do arquivo offline, como nos desenhos, e os textos longos vazios.
- P31: limites aprovados: 12 blocos de texto, 12 materiais, 12 notas, de 4 a 8 imagens em "Várias imagens do ambiente" e 40 páginas. Revisto na E6 (abaixo): blocos de texto, materiais e notas baixam para 6, e cada apresentação tem no máximo 50 fotos.
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

## Decisões da E6 ajustada (2026-11-08)
- P8 muda: no PDF, cada foto com lado maior acima de 3000 px é reduzida para 3000 px, com a proporção mantida (cerca de 250 dpi na folha A4). Foto menor entra como está, sem ampliar nem recodificar. A redução vale só para a exportação: a foto guardada no Drive e a visualização do editor (1600 px) não mudam. Motivo: na resolução original o Chromium fechava a partir de cerca de 45 fotos (medição da E6, `planejamento.md`, seção 11.3).
- Como a redução é feita: no próprio Chromium que imprime o PDF, uma foto por vez, numa aba própria, antes de montar as folhas. PNG continua PNG (pode ter transparência); JPEG e WebP viram JPEG com qualidade 0,9, a mesma do envio. A orientação gravada na foto é aplicada ao desenhar. As fotos não vão mais embutidas no HTML do PDF: cada uma chega à página num pedido próprio, que o gerador responde, e qualquer outro endereço é bloqueado. Sem isso, só a redução não bastava: com 45 fotos o HTML passava de 100 MB e o Chromium fechava (`planejamento.md`, seção 11.4). Nenhuma dependência nova: a biblioteca `sharp` foi tentada e descartada, porque precisa de um script de instalação que o npm do projeto bloqueia e poderia quebrar o build na Vercel.
- P31 muda: o limite de blocos da página Texto & conceito baixa de 12 para 6, contando os blocos de imagem. Vale no módulo de regras (`presentation-data.ts`), que a API usa para validar, e no "+ item" do editor. Materiais e notas continuam com 12, até a medição com 12 itens cheios.
- "+ item" no limite: "Limite de 6 blocos nesta página, contando os de imagem. Com mais, os textos não cabem na folha do PDF."
- Recusa da API com lista acima do limite: o editor diz a página e o limite da lista, por exemplo "A página 02 pode ter até 6 blocos, contando os de imagem.", "A página 03 pode ter até 12 materiais." e "A página 06 pode ter até 12 notas.". Sem a lista, continua o texto geral.
- Documento salvo antes com mais de 6 blocos numa página continua abrindo no editor, mas o salvamento é recusado com essa mensagem e o PDF responde 422 `invalid_data`, até a página voltar a 6 blocos. Só existe em dados locais de teste: a 6c não foi para produção.

## Decisões da E6 ajustada, segunda parte (2026-11-15)
- A entrega de cada foto ao gerador do PDF num pedido próprio, sem sair para a rede, fica como está.
- Materiais e notas baixam de 12 para 6 itens, como os blocos de texto. Vale no módulo de regras (`presentation-data.ts`), que a API usa para validar, e no "+ item" do editor: "Limite de 6 materiais nesta página. Com mais, os textos não cabem na folha do PDF." e "Limite de 6 notas nesta página. Com mais, os textos não cabem na folha do PDF.". A recusa da API diz o limite da lista: "A página 03 pode ter até 6 materiais." e "A página 06 pode ter até 6 notas.". A página de moodboard nova já começa com 6 materiais, então nela o "+ item" começa desligado. Medição: com 6 itens cabem 269 caracteres por material e 431 por nota (`planejamento.md`, seção 11.5).
- Teto de 50 fotos por apresentação: contam as fotos diferentes da capa e de todas as páginas, inclusive as guardadas e escondidas (P32, P33), porque todas vão para o gerador do PDF. A mesma foto em vários espaços conta uma vez.
- No editor, ao chegar a 50, o envio de imagens fica desligado: clicar, arrastar ou "Enviar nova imagem" mostra o aviso "Esta apresentação já tem 50 fotos, o limite para gerar o PDF. Remova alguma foto para adicionar outra.", que também fica escrito abaixo do espaço de imagem. Na biblioteca, "Enviar nova imagem" fica desligado e "Usar esta imagem" só fica ligado para fotos que já estão na apresentação. Trocar a foto de um espaço que só ele usa continua possível, porque a conta não aumenta. O salvamento não é bloqueado pelo teto.
- Na API, o salvamento que leva a apresentação a mais de 50 fotos é recusado com 400 `too_many_photos`, a conta e o limite, e o editor mostra "A apresentação pode ter até 50 fotos, o limite para gerar o PDF. Remova alguma foto para adicionar outra.". Só é recusado o que aumenta a conta acima do teto: um documento que já passava dele continua salvando enquanto não ganha foto nova. Só existe em dados locais de teste.
- Com o teto, o caso de 120 fotos da 11.4 não acontece mais. 50 fotos de 4000 px em 40 páginas geram em 53,5 s no Edge local, com 88,7 MB.

## Escolhas da E6 (2026-11-08), para conferir
- O PDF desenha todas as folhas na ordem da lista, com os mesmos componentes da Prévia ligada: a capa com a composição, a cor e a marca escolhidas (marca escura na Linho) e as páginas internas com "NN / TT". A rota, o nome, as versões, a pasta, o hash e o 409 `no_changes` são os da 6b, sem mudança na API nem no banco: o hash já cobre o documento inteiro, então mudar só a ordem das páginas gera versão nova.
- Medição: cada folha interna é medida por partes (`data-part`), com nomes em pt-BR: cabeçalho, rodapé, sobretítulo, título, introdução, blocos, imagens, materiais, ficha, descrição, programas e observações, desenhos, observações, escala e unidade, notas e direitos. Uma parte passa do limite quando sai da área entre o cabeçalho e o rodapé ou quando tem texto escondido além de 30% da fonte (folga das letras de título, que desenham 2 a 3 px além da linha). Um espaço de imagem também passa do limite quando o texto o esmaga (menos de 40 px de altura ou mais de 4 vezes mais largo que alto): sem essa regra, observações longas deixavam o desenho técnico numa faixa fina e faziam sumir as imagens da grade, sem aviso. A capa continua com nome, dados e contato, agora com a coluna de cada composição.
- Aviso de limite (P35): "O PDF não foi gerado: a página 03 passou do limite da folha em blocos e introdução. Encurte os textos dessa página e tente de novo.", com o botão "Ver a página 03" no computador. No celular, sem o botão. O texto geral, sem detalhe, deixou de dizer "da capa".

## Escolhas da E5 (2026-11-08), aprovadas
- Diálogo de remover página (P34): o mesmo padrão da confirmação de remover imagem, com "Remover a página NN?", o nome da página, "Não dá para desfazer." e, quando há, quantas imagens só aparecem nela. Botões "Cancelar" e "Remover página" (contorno, não Vinho). Esc e clique fora cancelam. Desenhado em 6c-22.
- Página atual depois de remover: a que ficou no lugar dela ou, se era a última, a anterior. Depois de ↑ ↓: segue a página que estava sendo vista.
- Adicionar página: a nova passa a ser a atual, e a aba Páginas continua aberta.
- No limite de 40 páginas, os seis tipos ficam desligados, com o motivo escrito abaixo.
- Aviso de Duplicar: "Duplicar está em proposta e ainda não foi aprovado.", seguido de "A capa não pode ser movida, duplicada nem excluída.".
- Celular: ‹ › abaixo da folha para passar pelas páginas, sem edição.

## Escolhas da E4 (2026-11-08), aprovadas
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
