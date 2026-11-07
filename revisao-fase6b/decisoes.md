# Decisões da Fase 6 (Orçamento e Apresentação)

Decisões aceitas pelo usuário em 2026-11-04 (6a) e em 2026-11-06/07 (6b, planejamento).

## Estado
- Fase 6a (Orçamento): fechada e em produção. PR #2 (PDF e orçamentos) e PR #4 (não gera PDF repetido, com hash e migração 0010) mesclados. Teste real validado pelo usuário.
- Fase 6b (Apresentação): E0 aprovada em 2026-11-07. O planejamento (`planejamento.md`), estas decisões e os desenhos 6b-01 a 6b-13 estão aprovados. O código começa na E1, que depende de aprovação.

## Dados e armazenamento
- Textos, números e estrutura dos documentos ficam no Supabase, em JSON (budgets.data e presentations.data).
- Imagens de apresentação são enviadas direto do navegador para o Drive, não pela API. O banco guarda só o endereço delas, numa tabela própria (presentation_images), para o servidor conferir cada imagem.
- PDF de orçamento e de apresentação é salvo no Drive, na pasta Orçamentos ou Apresentações do projeto. Para documentos avulsos, na pasta Avulsos dentro da pasta do ERP.
- Salvamento automático. Ao reabrir, o documento aparece como foi deixado. Mostrar aviso discreto "Salvo às ...".
- Limite de tamanho do documento de apresentação: 512 KB, com mensagem clara no editor. A API mede o documento como ele chega, antes de descartar campos desconhecidos. Vale desde a 6b (2026-11-07).

## Vínculo com projeto
- Orçamentos e apresentações podem ser avulsos (sem projeto). O campo de projeto é opcional no banco.
- Aba "Sem projeto" em Orçamentos e em Apresentações. Depois é possível vincular um documento avulso a um projeto, e as pastas no Drive são movidas.
- Ao criar a partir de um projeto, os dados do projeto (nome e cliente) são copiados como texto editável. Mudar o cadastro depois não altera a apresentação já feita.
- Localização: o cadastro do projeto não tem esse campo. A apresentação começa com a localização vazia, que é preenchida no editor (2026-11-07).
- Nome do documento é obrigatório, para a lista ficar legível.
- Vários orçamentos ou apresentações por projeto são aceitos.

## Criação
- Orçamento e apresentação não são criados automaticamente com o projeto. Só existem quando o usuário clica em "Novo orçamento" ou "Nova apresentação".
- Todo documento novo começa zerado: sem texto, valores ou imagens de exemplo.
- Apresentação nova começa só com a capa. As outras páginas são adicionadas conforme o tipo de apresentação.
- Botão "Novo" fica só na lista de apresentações, não no editor.

## Biblioteca de imagens
- Imagens enviadas ficam na subpasta "Imagens" dentro de Apresentações do projeto (ou dentro de Avulsos, para apresentações avulsas). Não aparecem em Arquivos do projeto.
- As imagens do projeto são reutilizáveis entre as apresentações do mesmo projeto. Quem tem permissão de editor vê a biblioteca e pode adicionar imagens já enviadas.
- Remover uma imagem de uma apresentação só tira o vínculo. A imagem continua na biblioteca.
- Apagar do Drive (lixeira) só acontece quando nenhuma apresentação usa mais a imagem.
- Trocar uma imagem numa página segue a mesma regra: só o vínculo muda. A antiga vai para a lixeira apenas se nenhuma outra apresentação a usa.
- Duplicar página com imagem cria cópia do arquivo no Drive, para que apagar uma página não afete a outra.

## Celular e computador
- Celular: lista de apresentações, visualização e PDF. Edição só no computador.
- Computador: editor com painel à esquerda (edição por campos) e visualização à direita.
- Edição direta na folha (clicar no texto da visualização e editar) não entra na 6b. Fica para a fase própria (6e).

## Cálculo (Orçamento)
- Cálculos idênticos ao arquivo original, exceto o arredondamento.
- Arredondamento corrigido: o total é a soma das linhas já arredondadas em centavos. Ex.: R$ 100,01 + R$ 0,01 = R$ 100,02. Mudança intencional, registrada no relatório.

## Exportação e PDF
- Botão "Salvar em PDF", igual ao orçamento.
- Nome do PDF e número sequencial, no mesmo padrão do orçamento.
- Página com conteúdo além do limite bloqueia o PDF até ser corrigida (não sai cortada).
- Aviso de "Tamanho real" aparece no diálogo de exportar, perto do botão.

## Escala e folha (prancha de detalhamento)
- Não há ferramenta de escala nem medição de cota no sistema.
- A escala vem da moldura de tamanho fixo (A4 ou A3), baixada pelo ERP ("folha-modelo", em PNG a 300 dpi) e usada no SketchUp LayOut. A página offline deixa de ser a fonte da moldura.
- O fluxo: escolher a moldura, desenhar no LayOut, exportar PNG, importar na prancha de detalhamento.
- Moldura: no ERP, como arquivo pronto, em PNG (sem JPEG, que borra linhas finas e cotas). Dois arquivos PNG: um A4 e outro A3.
- Resolução: qualquer valor a partir de 200 dpi, desde que a proporção seja exata. 300 dpi é a recomendação.
- Proporção fora do padrão: recusa acima de 0,5% de diferença.
- A prancha aceita só PNG nesta versão. JPEG, WebP e PDF (inclusive o PDF do LayOut) são recusados.
- Desenho da moldura congelado. Mudanças futuras viram nova versão, e as pranchas antigas continuam com a versão antiga.
- Tipo "Desenho técnico": imagem mais campo de texto para a escala digitada (ex.: 1:50). Sem cota automática, sem escala gráfica e sem carimbo automático.
- Folha-modelo: os dois PNG ficam prontos no repositório e são baixados pelo ERP, direto no navegador, sem ir ao Drive.
- Teste da M7 (LayOut com a moldura no tamanho exato): não será feito agora. A conferência de pixels fica para a 6d, quando a prancha existir.

## Divisão da fase 6b
- 6b (base): lista, criação com capa, editor no painel, visualização, salvamento automático, imagens com os limites, biblioteca do projeto, vínculo com projeto e avulsa, PDF com o mesmo padrão do orçamento.
- 6c (tipos de página): os tipos de página, sem ferramentas de escala.
- 6d (prancha): prancha de detalhamento com imagem do LayOut na moldura A4 ou A3, rodapé escrito nas posições da moldura, teste do Chromium com páginas de tamanhos diferentes, e formatos A3 e 16:9.
- 6e (edição direta): clicar no texto da visualização e editar no computador.

## Limites de imagem (motivo)
- 40 MB por arquivo: evita envio pesado ao Drive e carregamento lento.
- 4000 px no lado maior: reduz antes do PDF, para não estourar memória ou tempo da função da Vercel.
- 7200 px na prancha: a prancha precisa de mais resolução para a cota ficar nítida.
- 512 KB no documento: o salvamento automático envia o documento inteiro a cada alteração.
- WebP sem redução continua WebP, como no arquivo offline. O tipo guardado é PNG, JPEG ou WebP. A prancha continua aceitando só PNG (2026-11-07).

## Respostas às perguntas em aberto do planejamento (2026-11-07)
- P7: a data no nome do PDF segue o padrão do orçamento, com a data de emissão do documento.
- P8: a visualização usa imagem de 1600 px; a exportação usa a resolução original.
- P22: remover da apresentação só tira o vínculo; a lixeira só entra quando nenhuma apresentação usa a imagem.
- P23: cada apresentação avulsa tem a sua biblioteca, dentro de Avulsos; só as de um mesmo projeto compartilham.
- P24: duplicar apresentação fica fora da 6b.
- P25: o aviso de "Tamanho real" aparece no diálogo de exportar, em qualquer apresentação.
- P26: vínculo de orçamento avulso a projeto fica fora desta fase, como tarefa separada.
- P27: ao vincular a projeto, o PDF é movido junto com a apresentação.
- P28: sem contagem fixa de imagens por apresentação; o limite de 512 KB do documento controla o tamanho.

## Dados de exemplo
- Os nomes e telefones de pessoas reais dos arquivos offline saem. Qualquer exemplo fica fictício.

## Testes
- Prévias da Vercel não são usadas para gravar dados, porque ainda apontam para o banco de produção. Testes de gravação são feitos em banco de teste (PGlite).
- Regras de produção continuam valendo: migração, deploy e teste que grava dados só com aprovação explícita do usuário, a cada vez.
