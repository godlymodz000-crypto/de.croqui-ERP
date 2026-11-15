# Fase 6d — Roteiro M7: a moldura no SketchUp LayOut

- **Para quem:** você, no SketchUp LayOut. Esta conferência não é automática.
- **O que confere:** se o LayOut coloca a moldura v1 com 297 × 210 mm ao inserir, e se a imagem exportada depois entra na prancha sem recusa (riscos R3 e R6 do planejamento).
- **Já conferido por teste (E1):** os dois PNG têm o tamanho certo, 300 dpi gravado no bloco `pHYs`, modo RGB sem transparência, e as faixas, a linha vinho e as 6 divisórias nas posições e cores da moldura (`tests/phase6d-moldura.test.ts`).

## Arquivos

| Folha | Arquivo | Pixels | Tamanho esperado a 300 dpi |
|---|---|---|---|
| A4 paisagem | `public/molduras/DeCroqui-folha-modelo-A4-v1.png` | 3508 × 2480 | 297 × 210 mm |
| A3 paisagem | `public/molduras/DeCroqui-folha-modelo-A3-v1.png` | 4961 × 3508 | 420 × 297 mm |

Faça os 4 passos com o A4. Se der certo, repita com o A3.

## 1. Inserir o PNG

1. Crie um documento novo no LayOut com papel **A4 paisagem**, sem margens de impressão.
2. Insira o PNG da moldura A4 (menu Arquivo, Inserir).
3. Não redimensione a imagem.

## 2. Ler o tamanho

1. Selecione a imagem e leia a largura e a altura no painel de forma e tamanho.
2. **Esperado:** 297 × 210 mm, com a imagem cobrindo a folha inteira, de borda a borda.
3. Anote o que aparece.
   - Se aparecer outro tamanho (por exemplo, em 72 ou 96 dpi), o LayOut não respeitou o dpi gravado.
   - Nesse caso, ajuste a imagem para 297 × 210 mm à mão, encostada no canto de cima à esquerda, e anote que foi preciso ajustar (R6).

## 3. Exportar

1. Desenhe qualquer coisa simples sobre a moldura, por exemplo um retângulo com uma cota.
2. Exporte a página inteira em **PNG** (menu Arquivo, Exportar, Imagem), sem margens e sem borda.
3. Use **300 dpi**, ou pelo menos 200 dpi.
4. Anote o tamanho em pixels do arquivo exportado.
   - **Esperado a 300 dpi:** 3508 × 2480 px.
   - **Mínimo aceito:** 2339 × 1654 px, que é 200 dpi.

## 4. Importar

Quando a E3 estiver pronta, importe o PNG exportado numa prancha A4 do ERP, no ambiente local.

- **Esperado:** a imagem entra sem recusa.
- **Proporção:** diferença menor que 0,5% de 297/210.
- **Resolução:** a partir de 200 dpi.
- **Moldura:** o rodapé da moldura fica alinhado com os valores escritos pela página.
- **Se houver recusa:** anote a mensagem exata. Na de proporção, anote o valor encontrado. Ela indica margem ou borda na exportação (R3).

## Resultado (preencher)

| Passo | A4 | A3 |
|---|---|---|
| 2. Tamanho lido ao inserir | | |
| 2. Precisou ajustar à mão? | | |
| 3. Pixels do PNG exportado | | |
| 4. Entrou na prancha sem recusa? | | |

Com o resultado, a decisão M7 de `revisao-fase6b/molduras.md` deixa de estar pendente.
