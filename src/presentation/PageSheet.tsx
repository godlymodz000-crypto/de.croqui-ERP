import type { CSSProperties, ReactNode } from 'react';
import type {
  PresentationContentPage,
  PresentationImageRef,
  PresentationMoodboardPage,
  PresentationNotesPage,
  PresentationProject,
  PresentationRightsPage,
  PresentationTechnicalPage,
  PresentationTextPage,
  PresentationVisualPage,
  TextBlock,
  TextBlockImage,
} from '../shared/presentation-data.js';
import { coverImageStyle, type CoverMode } from './cover.js';
import {
  filled,
  gridShape,
  MATERIAL_ROWS,
  moodboardColumns,
  pageChrome,
  PLACEHOLDERS as PH,
  RIGHTS_MODELS,
  RIGHTS_NOTE,
  RIGHTS_ROWS,
  SLOT_HINT,
  SLOT_MISSING,
  SLOT_TITLES,
  visibleDrawings,
  visibleVisualImages,
} from './pages.js';

/**
 * Página interna da apresentação em A4 deitado (1123 × 794 px), nos seis tipos e nas composições do arquivo
 * offline (desenhos 6c-12 a 6c-20). Com a Prévia desligada (`edit`), o que falta aparece em cinza e os espaços
 * de imagem vazios dizem o que vai neles; com a Prévia ligada (`print`), só o que está preenchido, como no PDF.
 * As imagens guardadas e escondidas de uma composição com menos imagens não aparecem (P32).
 * `imageSrc` devolve o endereço de uma imagem da biblioteca (na tela, a de 1600 px; no PDF, a original).
 * `isotipoSrc` é a marca da página de direitos autorais.
 */
export function PageSheet({
  page,
  projeto,
  mode,
  index,
  total,
  imageSrc = () => undefined,
  isotipoSrc,
}: {
  page: PresentationContentPage;
  projeto: PresentationProject;
  mode: CoverMode;
  /** Posição da página no documento: 0 é a capa. */
  index: number;
  total: number;
  imageSrc?: (id: string) => string | undefined;
  isotipoSrc: string;
}) {
  const chrome = pageChrome(projeto, page.tipo, index, total);
  const ctx: Ctx = { mode, imageSrc };
  return (
    <div
      className="psheet"
      data-mode={mode}
      data-tipo={page.tipo}
      data-composicao={'composicao' in page ? page.composicao : undefined}
      data-page={page.id}
    >
      <div className="psheet__head">
        <span className="psheet__brandline">
          <span className="psheet__brand">{chrome.marca}</span>
          {chrome.projeto && <span>{chrome.projeto}</span>}
        </span>
        <span>{chrome.secao}</span>
      </div>
      <div className="psheet__body">{body(page, ctx, isotipoSrc)}</div>
      <div className="psheet__foot">
        <span>{chrome.esquerda}</span>
        <span>{chrome.numero}</span>
      </div>
    </div>
  );
}

interface Ctx {
  mode: CoverMode;
  imageSrc: (id: string) => string | undefined;
}

function body(page: PresentationContentPage, ctx: Ctx, isotipoSrc: string): ReactNode {
  switch (page.tipo) {
    case 'texto':
      return <TextPage page={page} ctx={ctx} />;
    case 'moodboard':
      return <MoodboardPage page={page} ctx={ctx} />;
    case 'visual':
      return <VisualPage page={page} ctx={ctx} />;
    case 'tecnico':
      return <TechnicalPage page={page} ctx={ctx} />;
    case 'notas':
      return <NotesPage page={page} ctx={ctx} />;
    case 'direitos':
      return <RightsPage page={page} ctx={ctx} isotipoSrc={isotipoSrc} />;
  }
}

/**
 * Texto de um campo. Preenchido: o valor. Vazio: com a Prévia desligada, o texto do que falta em cinza;
 * com a Prévia ligada, nada.
 */
function T({ value, ph, className, ctx, as = 'span' }: { value: string; ph: string; className: string; ctx: Ctx; as?: 'span' | 'div' }) {
  const Tag = as;
  if (filled(value)) return <Tag className={className}>{value}</Tag>;
  if (ctx.mode !== 'edit') return null;
  return <Tag className={`${className} is-pending`}>{ph}</Tag>;
}

/** Linha com rótulo (ficha, materiais, direitos). Vazia some com a Prévia ligada. */
function Row({ label, value, ph, ctx, className }: { label: string; value: string; ph: string; ctx: Ctx; className: string }) {
  if (!filled(value) && ctx.mode !== 'edit') return null;
  return (
    <div className={className}>
      <span className="psheet__label">{label}</span>
      <T value={value} ph={ph} className="psheet__value" ctx={ctx} />
    </div>
  );
}

/**
 * Espaço de imagem. Com imagem: a imagem com o enquadramento escolhido. Vazio: o fundo do espaço e, com a
 * Prévia desligada, o texto do que vai nele (não sai no PDF).
 */
function Slot({
  img,
  title,
  ctx,
  className = '',
  style,
  tone,
}: {
  img: PresentationImageRef | null;
  title: string;
  ctx: Ctx;
  className?: string;
  style?: CSSProperties;
  tone?: 'white';
}) {
  const src = img ? ctx.imageSrc(img.id) : undefined;
  return (
    <div className={`psheet__slot ${className}`.trim()} data-tone={tone} style={style}>
      {src && img && <img className="psheet__img" src={src} alt="" draggable={false} style={coverImageStyle(img)} />}
      {!src && ctx.mode === 'edit' && (
        <span className="psheet__slot-empty">
          <span className="psheet__slot-title">{img ? SLOT_MISSING : title}</span>
          {!img && <span className="psheet__slot-hint">{SLOT_HINT}</span>}
        </span>
      )}
    </div>
  );
}

function Heading({
  eyebrow,
  title,
  titlePh,
  size,
  ctx,
}: {
  eyebrow: string;
  title: string;
  titlePh: string;
  size: 'xl' | 'l' | 'm' | 's';
  ctx: Ctx;
}) {
  return (
    <>
      <T value={eyebrow} ph={PH.sobretitulo} className="psheet__eyebrow" ctx={ctx} />
      <T value={title} ph={titlePh} className={`psheet__title psheet__title--${size}`} ctx={ctx} as="div" />
    </>
  );
}

// ---------------------------------------------------------------------------------------------------
// Texto & conceito: cinco composições das imagens.

function TextBlockView({ b, ctx }: { b: Extract<TextBlock, { tipo: 'texto' }>; ctx: Ctx }) {
  return (
    <div className="psheet__block">
      <T value={b.titulo} ph={PH.tituloBloco} className="psheet__block-title" ctx={ctx} as="div" />
      <T value={b.texto} ph={PH.textoBloco} className="psheet__block-text" ctx={ctx} as="div" />
    </div>
  );
}

function TextImageView({ b, ctx, free, grow }: { b: TextBlockImage; ctx: Ctx; free?: boolean; grow?: boolean }) {
  return (
    <div
      className={`psheet__figure${grow ? ' psheet__figure--grow' : ''}`}
      data-posicao={free ? b.posicao : undefined}
      data-altura={free ? b.altura : undefined}
    >
      <div className={`psheet__shape psheet__shape--${b.formato}`}>
        <Slot img={b.imagem} title={SLOT_TITLES.texto} ctx={ctx} />
      </div>
      <T value={b.legenda} ph={PH.legenda} className="psheet__caption" ctx={ctx} />
    </div>
  );
}

function TextPage({ page, ctx }: { page: PresentationTextPage; ctx: Ctx }) {
  const texts = page.blocos.filter((b): b is Extract<TextBlock, { tipo: 'texto' }> => b.tipo === 'texto');
  const imgs = page.blocos.filter((b): b is TextBlockImage => b.tipo === 'imagem');
  const lead = <T value={page.introducao} ph={PH.introducaoTexto} className="psheet__lead" ctx={ctx} as="div" />;

  if (page.composicao === 'destaque') {
    return (
      <div className="psheet__texto-destaque">
        <div className="psheet__texto-top">
          <div className="psheet__stack">
            <Heading eyebrow={page.sobretitulo} title={page.titulo} titlePh={PH.tituloSecao} size="xl" ctx={ctx} />
          </div>
          {lead}
        </div>
        {texts.length > 0 && (
          <div className="psheet__texts" style={{ gridTemplateColumns: `repeat(${Math.min(4, texts.length)}, minmax(0, 1fr))` }}>
            {texts.map((b) => (
              <TextBlockView key={b.id} b={b} ctx={ctx} />
            ))}
          </div>
        )}
        <div className="psheet__imgrow">
          {imgs.map((b, i) => (
            <TextImageView key={b.id} b={b} ctx={ctx} grow={i === 0} />
          ))}
        </div>
      </div>
    );
  }

  let right: ReactNode;
  if (page.composicao === 'diagonal' || page.composicao === 'livre') {
    const free = page.composicao === 'livre';
    right = (
      <div className={`psheet__blocks${free ? ' psheet__blocks--livre' : ''}`}>
        {page.blocos.map((b) => (b.tipo === 'texto' ? <TextBlockView key={b.id} b={b} ctx={ctx} /> : <TextImageView key={b.id} b={b} ctx={ctx} free={free} />))}
      </div>
    );
  } else if (page.composicao === 'lado') {
    right = (
      <div className="psheet__texto-lado">
        <div className="psheet__blocks">
          {texts.map((b) => (
            <TextBlockView key={b.id} b={b} ctx={ctx} />
          ))}
        </div>
        <div className="psheet__imggrid" style={{ gridTemplateColumns: `repeat(${Math.min(6, Math.max(1, imgs.length))}, minmax(0, 1fr))` }}>
          {imgs.map((b) => (
            <TextImageView key={b.id} b={b} ctx={ctx} grow />
          ))}
        </div>
      </div>
    );
  } else {
    right = (
      <div className="psheet__texto-coluna">
        <div className="psheet__stack psheet__stack--blocks">
          {texts.map((b) => (
            <TextBlockView key={b.id} b={b} ctx={ctx} />
          ))}
        </div>
        <div className="psheet__stack psheet__stack--imgs">
          {imgs.map((b) => (
            <TextImageView key={b.id} b={b} ctx={ctx} grow />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="psheet__texto-side">
      <div className="psheet__stack">
        <Heading eyebrow={page.sobretitulo} title={page.titulo} titlePh={PH.tituloSecao} size="xl" ctx={ctx} />
        {lead}
      </div>
      {right}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------
// Moodboard de materiais.

function MoodboardPage({ page, ctx }: { page: PresentationMoodboardPage; ctx: Ctx }) {
  const cols = moodboardColumns(page.materiais.length);
  return (
    <>
      <div className="psheet__split">
        <div className="psheet__stack psheet__stack--tight">
          <Heading eyebrow={page.sobretitulo} title={page.titulo} titlePh={PH.titulo} size="l" ctx={ctx} />
        </div>
        <T value={page.introducao} ph={PH.introducaoMood} className="psheet__side psheet__side--mood" ctx={ctx} as="div" />
      </div>
      <div className="psheet__materials" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {page.materiais.map((m) => (
          <div key={m.id} className="psheet__material">
            <Slot img={m.imagem} title={SLOT_TITLES.moodboard} ctx={ctx} className="psheet__slot--material" />
            <T value={m.nome} ph={PH.nomeMaterial} className="psheet__material-name" ctx={ctx} as="div" />
            <div className="psheet__meta">
              {MATERIAL_ROWS.map((r) => (
                <Row key={r.key} label={r.label} value={m[r.key]} ph={PH.metaVazia} ctx={ctx} className="psheet__meta-row" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------------------------------
// Apresentação visual: cinco composições.

function VisualFicha({ page, ctx, withImage, small }: { page: PresentationVisualPage; ctx: Ctx; withImage: boolean; small?: boolean }) {
  const cls = `psheet__ficha-row${small ? ' psheet__ficha-row--s' : ''}`;
  return (
    <div className="psheet__ficha">
      <Row label="Programas" value={page.programas} ph={PH.programas} ctx={ctx} className={cls} />
      <Row label="Observações" value={page.observacoes} ph={PH.observacoesVisual} ctx={ctx} className={cls} />
      {withImage && page.imagens[0] && (
        <Row label="Imagem" value={page.imagens[0].legenda} ph={PH.imagemPrincipal} ctx={ctx} className={cls} />
      )}
    </div>
  );
}

function VisualPage({ page, ctx }: { page: PresentationVisualPage; ctx: Ctx }) {
  const shown = visibleVisualImages(page);
  const main = shown[0];
  const slotTitle = page.composicao === 'iso' ? SLOT_TITLES.iso : SLOT_TITLES.visual;

  if (page.composicao === 'duo' || page.composicao === 'grade') {
    return (
      <GridPage
        eyebrow={page.sobretitulo}
        title={page.titulo}
        side={page.descricao}
        sidePh={PH.descricaoGrade}
        items={shown.map((i) => ({ id: i.id, img: i.imagem, caption: i.legenda }))}
        captionPh={PH.legenda}
        slotTitle={SLOT_TITLES.visual}
        shape={gridShape(page)}
        ctx={ctx}
        footer={
          <div className="psheet__line">
            <Row label="Programas" value={page.programas} ph={PH.programas} ctx={ctx} className="psheet__line-row" />
            <Row label="Observações" value={page.observacoes} ph={PH.observacoesVisual} ctx={ctx} className="psheet__line-row" />
          </div>
        }
      />
    );
  }

  const mainSlot = main && <Slot img={main.imagem} title={slotTitle} ctx={ctx} className="psheet__slot--main" />;
  if (page.composicao === 'principal') {
    return (
      <div className="psheet__visual psheet__visual--principal">
        {mainSlot}
        <div className="psheet__stack psheet__stack--principal">
          <Heading eyebrow={page.sobretitulo} title={page.titulo} titlePh={PH.ambiente} size="s" ctx={ctx} />
          <T value={page.descricao} ph={PH.descricaoCurta} className="psheet__desc psheet__desc--s" ctx={ctx} as="div" />
          <div className="psheet__rest">
            {shown.slice(1).map((i) => (
              <div key={i.id} className="psheet__rest-item">
                <Slot img={i.imagem} title={SLOT_TITLES.visual} ctx={ctx} className="psheet__slot--grow" />
                <T value={i.legenda} ph={PH.legenda} className="psheet__rest-caption" ctx={ctx} />
              </div>
            ))}
          </div>
          <VisualFicha page={page} ctx={ctx} withImage small />
        </div>
      </div>
    );
  }

  const iso = page.composicao === 'iso';
  return (
    <div className={`psheet__visual psheet__visual--${page.composicao}`}>
      {mainSlot}
      <div className="psheet__stack psheet__stack--visual">
        <Heading eyebrow={page.sobretitulo} title={page.titulo} titlePh={iso ? PH.peca : PH.ambiente} size={iso ? 'm' : 'l'} ctx={ctx} />
        <T value={page.descricao} ph={iso ? PH.descricaoIso : PH.descricaoLado} className="psheet__desc" ctx={ctx} as="div" />
        <div className="psheet__bottom">
          {iso && <span className="psheet__ficha-title">Ficha técnica</span>}
          <VisualFicha page={page} ctx={ctx} withImage />
        </div>
      </div>
    </div>
  );
}

/** Cabeçalho com texto ao lado, grade de imagens numeradas e uma linha final (visual em grade e desenho técnico). */
function GridPage({
  eyebrow,
  title,
  side,
  sidePh,
  items,
  captionPh,
  slotTitle,
  shape,
  ctx,
  footer,
  tone,
  spanFirst,
}: {
  eyebrow: string;
  title: string;
  side: string;
  sidePh: string;
  items: { id: string; img: PresentationImageRef | null; caption: string }[];
  captionPh: string;
  slotTitle: string;
  shape: { cols: string; rows: number };
  ctx: Ctx;
  footer: ReactNode;
  tone?: 'white';
  spanFirst?: boolean;
}) {
  return (
    <>
      <div className="psheet__split psheet__split--grid">
        <div className="psheet__stack psheet__stack--grid">
          <Heading eyebrow={eyebrow} title={title} titlePh={PH.titulo} size="s" ctx={ctx} />
        </div>
        <T value={side} ph={sidePh} className="psheet__side" ctx={ctx} as="div" />
      </div>
      <div className="psheet__grid" style={{ gridTemplateColumns: shape.cols, gridTemplateRows: `repeat(${shape.rows}, minmax(0, 1fr))` }}>
        {items.map((it, i) => (
          <div key={it.id} className="psheet__cell" style={spanFirst && i === 0 ? { gridRow: '1 / span 2' } : undefined}>
            <Slot img={it.img} title={slotTitle} ctx={ctx} className="psheet__slot--grow" tone={tone} />
            <div className="psheet__cell-caption">
              <span className="psheet__num">{String(i + 1).padStart(2, '0')}</span>
              <T value={it.caption} ph={captionPh} className="psheet__cell-text" ctx={ctx} />
            </div>
          </div>
        ))}
      </div>
      {footer}
    </>
  );
}

// ---------------------------------------------------------------------------------------------------
// Desenho técnico: quatro composições, sem carimbo, escala gráfica nem cota.

function TechnicalPage({ page, ctx }: { page: PresentationTechnicalPage; ctx: Ctx }) {
  const shown = visibleDrawings(page);
  const hasScaleLine = ctx.mode === 'edit' || filled(page.escala) || filled(page.unidade);
  return (
    <GridPage
      eyebrow={page.sobretitulo}
      title={page.titulo}
      side={page.observacoes}
      sidePh={PH.observacoesTecnico}
      items={shown.map((d) => ({ id: d.id, img: d.imagem, caption: d.titulo }))}
      captionPh={PH.tituloDesenho}
      slotTitle={SLOT_TITLES.tecnico}
      shape={gridShape(page)}
      ctx={ctx}
      tone="white"
      spanFirst={page.composicao === '3'}
      footer={
        hasScaleLine && (
          // Escala e unidade: só o texto digitado, numa linha simples.
          <div className="psheet__line psheet__line--escala">
            <Row label="Escala" value={page.escala} ph={PH.escala} ctx={ctx} className="psheet__line-row" />
            <Row label="Unidade" value={page.unidade} ph={PH.unidade} ctx={ctx} className="psheet__line-row" />
          </div>
        )
      }
    />
  );
}

// ---------------------------------------------------------------------------------------------------
// Notas técnicas e direitos autorais.

function NotesPage({ page, ctx }: { page: PresentationNotesPage; ctx: Ctx }) {
  return (
    <div className="psheet__notas">
      <div className="psheet__stack">
        <Heading eyebrow={page.sobretitulo} title={page.titulo} titlePh={PH.titulo} size="m" ctx={ctx} />
        <T value={page.introducao} ph={PH.introducaoNotas} className="psheet__desc" ctx={ctx} as="div" />
      </div>
      <div className="psheet__notes">
        {page.notas.map((n, i) => (
          <div key={n.id} className="psheet__note">
            <span className="psheet__note-num">{String(i + 1).padStart(2, '0')}</span>
            <div className="psheet__note-body">
              <T value={n.categoria} ph={PH.categoria} className="psheet__note-cat" ctx={ctx} />
              <T value={n.titulo} ph={PH.tituloNota} className="psheet__note-title" ctx={ctx} as="div" />
              <T value={n.texto} ph={PH.textoNota} className="psheet__note-text" ctx={ctx} as="div" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RightsPage({ page, ctx, isotipoSrc }: { page: PresentationRightsPage; ctx: Ctx; isotipoSrc: string }) {
  return (
    <div className="psheet__direitos">
      <div className="psheet__stack">
        <img className="psheet__isotipo" src={isotipoSrc} alt="" />
        <Heading eyebrow={page.sobretitulo} title={page.titulo} titlePh={PH.titulo} size="l" ctx={ctx} />
        {ctx.mode === 'edit' && <span className="psheet__note-box">{RIGHTS_NOTE}</span>}
      </div>
      <div className="psheet__rights">
        {RIGHTS_ROWS.map((r) => (
          <Row key={r.key} label={r.label} value={page[r.key]} ph={RIGHTS_MODELS[r.key]} ctx={ctx} className="psheet__rights-row" />
        ))}
      </div>
    </div>
  );
}
