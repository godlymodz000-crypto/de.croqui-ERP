/** @jsxRuntime automatic */
/** @jsxImportSource react */
// O JSX automático fica fixo aqui porque este arquivo também roda no servidor (PDF), compilado fora do Vite.
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { budgetView, ROOMS_PER_SHEET, type BudgetData, type RoomsPerSheet } from '../shared/budget-calc.js';

/**
 * Folhas A4 do orçamento, iguais às do arquivo offline (templates/orcamento no design system).
 * Os textos fixos (observações, inclusos, nota) não são editáveis na folha: só o painel muda o documento.
 * O mesmo componente monta a prévia do editor e a página que vira PDF (api/_app/budget-pdf.ts).
 * Por isso o CSS (sheets.css) é importado por quem usa: o servidor lê o arquivo e o embute no HTML do PDF.
 */
export function BudgetSheets({ data, logoSrc, cap = ROOMS_PER_SHEET }: { data: BudgetData; logoSrc: string; cap?: RoomsPerSheet }) {
  const v = budgetView(data, cap);

  const header = (
    <div className="bsheet__head">
      <img src={logoSrc} alt="De.Croqui" className="bsheet__logo" />
      <div className="bsheet__contacts">
        <span>{data.email}</span>
        <span>{data.contatoProjetista}</span>
        <span className="bsheet__region">{data.regiao}</span>
      </div>
    </div>
  );

  const facts = (
    <div className="bsheet__facts">
      <Fact label="Projetista" value={data.projetista} />
      <Fact label="Contato" value={data.contatoProjetista} />
      <Fact label="Data" value={v.resumo.data} />
      <Fact label="Cliente" value={data.cliente} />
      <Fact label="Contato" value={data.contatoCliente} />
    </div>
  );

  const property = (
    <div className="bsheet__property">
      <span className="bsheet__label bsheet__label--brand">Imóvel</span>
      <span className="bsheet__property-text">{data.imovel}</span>
    </div>
  );

  return (
    <>
      <Sheet label="01 Resumo" page={v.resumo.pagina}>
        {header}
        <div className="bsheet__title-block">
          <span className="bsheet__eyebrow">Orçamento · Design de interiores residencial</span>
          <div className="bsheet__title bsheet__title--cover">
            Proposta para <em>{data.cliente}</em>
          </div>
        </div>
        {facts}
        <div className="bsheet__investment">
          <span className="bsheet__investment-title">{v.resumo.tituloInvestimento}</span>
          <span className="bsheet__label">{v.resumo.contagem}</span>
        </div>
        <div className="bsheet__cards">
          {v.resumo.cartoes.map((c) => (
            <div key={c.nome} className={`bsheet__card${c.nome === 'Projeto completo' ? ' bsheet__card--night' : ''}`}>
              <span className="bsheet__card-tag">{c.etiqueta}</span>
              <span className="bsheet__card-name">{c.nome}</span>
              <span className="bsheet__card-total">{c.total}</span>
              <span className="bsheet__card-text">{c.descricao}</span>
            </div>
          ))}
        </div>
        <div className="bsheet__two-cols bsheet__two-cols--notes">
          <div className="bsheet__ruled">
            <span className="bsheet__label bsheet__label--brand">Observações</span>
            <div className="bsheet__list">
              <span>— O orçamento foi desenvolvido considerando o nível atual de intervenção informado para cada ambiente.</span>
              <span>— Alterações significativas no escopo poderão gerar reajuste de valor.</span>
              <span>— Serviços extras, visitas adicionais ou detalhamentos não previstos inicialmente poderão ser contratados separadamente.</span>
              <span>— O projeto será desenvolvido de forma personalizada, respeitando o estilo e as necessidades do cliente.</span>
            </div>
          </div>
          <div className="bsheet__ruled">
            <span className="bsheet__label bsheet__label--brand">Condições de pagamento</span>
            <div className="bsheet__pay">
              <span className="bsheet__pay-title">Em dinheiro</span>
              <span>50% do valor total no fechamento do projeto e 50% na entrega do projeto.</span>
            </div>
            <div className="bsheet__pay">
              <span className="bsheet__pay-title">No cartão</span>
              <span>{data.cartao}</span>
            </div>
            <div className="bsheet__pay bsheet__pay--validity">
              <span className="bsheet__label bsheet__label--brand">Validade da proposta</span>
              <span>{v.resumo.validade}</span>
            </div>
          </div>
        </div>
        <p className="bsheet__closing">Por favor, entre em contato para esclarecimentos ou aprovação. Estamos ansiosos para trabalhar juntos.</p>
      </Sheet>

      {v.opcao01 && (
        <Sheet label="02 Opção 01" page={v.opcao01.pagina}>
          {header}
          <div className="bsheet__title-block">
            <span className="bsheet__eyebrow">{v.opcao01.sobretitulo}</span>
            <div className="bsheet__title">
              Com parceria <em>em marcenaria</em>
            </div>
          </div>
          {facts}
          {property}
          <div className="bsheet__two-cols">
            <div className="bsheet__ruled bsheet__ruled--offer">
              <span className="bsheet__label">01 · Por ambiente</span>
              <span className="bsheet__offer-title">
                Investimento por ambiente <em>(apenas render 3D)</em>
              </span>
              <span className="bsheet__offer-value">
                {v.opcao01.valorPorAmbiente} <span>por ambiente</span>
              </span>
              <span className="bsheet__text">
                <strong>Incluso:</strong> briefing, consultoria estética e imagens 3D ilustrativas (render).
              </span>
            </div>
            <div className="bsheet__ruled bsheet__ruled--offer">
              <span className="bsheet__label">02 · Taxa única</span>
              <span className="bsheet__offer-title">
                Projeto executivo detalhado <em>(geral)</em>
              </span>
              <span className="bsheet__offer-value">
                {v.opcao01.valorExecutivo} <span>para o projeto</span>
              </span>
              <div className="bsheet__list bsheet__list--tight">
                <span>
                  <strong>Incluso:</strong> um único projeto executivo geral que abrange todos os ambientes, contendo:
                </span>
                <span>— Iluminação</span>
                <span>— Bancadas</span>
                <span>— Pintura</span>
                <span>— Paginação de piso / revestimentos</span>
              </div>
            </div>
          </div>
          <div className="bsheet__summary">
            <span className="bsheet__summary-title">Resumo do orçamento</span>
            <Line label={v.opcao01.linhaRender} value={v.opcao01.valorRender} />
            <Line label="Projeto executivo detalhado (geral)" value={v.opcao01.valorExecutivo} />
            <Total tone="wine" value={v.opcao01.total} />
          </div>
          {v.opcao01.nota && (
            <p className="bsheet__note">Nota: caso opte por executar a marcenaria com a nossa marcenaria parceira, mantemos essa facilidade no escopo.</p>
          )}
        </Sheet>
      )}

      {v.opcao02 &&
        v.opcao02.folhas.map((folha, i) => (
          <Sheet key={folha.pagina} label={i === 0 ? '03 Opção 02' : `03 Opção 02 · continuação ${i}`} page={folha.pagina} roomsSheet={i}>
            {header}
            <div className="bsheet__title-block">
              <span className="bsheet__eyebrow">
                {v.opcao02!.sobretitulo}
                {i > 0 && ' · continuação'}
              </span>
              <div className="bsheet__title">
                Projeto <em>completo</em>
              </div>
            </div>
            {i === 0 && (
              <>
                {facts}
                {property}
                <div className="bsheet__two-cols">
                  <div className="bsheet__ruled bsheet__ruled--offer">
                    <span className="bsheet__label">Por ambiente</span>
                    <span className="bsheet__offer-title">
                      Projeto completo por ambiente <em>(com detalhamento incluso)</em>
                    </span>
                    <span className="bsheet__offer-value">{v.opcao02!.porAmbiente}</span>
                  </div>
                  <div className="bsheet__ruled bsheet__list bsheet__list--tight">
                    <span className="bsheet__label bsheet__label--spaced">O que está incluso</span>
                    <span>— Briefing completo e consultoria técnica/estética</span>
                    <span>— Imagens 3D ilustrativas (render)</span>
                    <span>
                      — Projeto executivo detalhado completo (iluminação, bancadas, pintura e paginação de piso/revestimentos para todos os
                      ambientes)
                    </span>
                  </div>
                </div>
              </>
            )}
            <div className="bsheet__summary">
              <div className="bsheet__summary-head">
                <span className="bsheet__summary-title">Resumo dos ambientes</span>
                <span className="bsheet__label">{v.opcao02!.contagem}</span>
              </div>
              {folha.ambientes.map((a, j) => (
                <Line key={j} label={a.nome} value={a.valor} rooms />
              ))}
              {folha.ultima ? <Total tone="night" value={v.opcao02!.total} /> : <p className="bsheet__continues">Continua na página seguinte.</p>}
            </div>
          </Sheet>
        ))}
    </>
  );
}

function Sheet({ label, page, roomsSheet, children }: { label: string; page: string; roomsSheet?: number; children: ReactNode }) {
  return (
    <section className="bsheet" data-sheet data-screen-label={label} data-rooms-sheet={roomsSheet}>
      {children}
      <div className="bsheet__foot">
        <span>De.Croqui · Design de interiores</span>
        <span>{page}</span>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bsheet__fact">
      <span className="bsheet__fact-label">{label}</span>
      <span className="bsheet__fact-value">{value}</span>
    </div>
  );
}

function Line({ label, value, rooms }: { label: string; value: string; rooms?: boolean }) {
  return (
    <div className={`bsheet__line${rooms ? ' bsheet__line--room' : ''}`}>
      <span>{label}</span>
      <span className="bsheet__line-value">{value}</span>
    </div>
  );
}

function Total({ tone, value }: { tone: 'wine' | 'night'; value: string }) {
  return (
    <div className={`bsheet__total bsheet__total--${tone}`}>
      <span className="bsheet__total-label">Valor total do projeto</span>
      <span className="bsheet__total-value">{value}</span>
    </div>
  );
}

/**
 * Folhas com a divisão dos ambientes medida: se uma folha da Opção 02 passa de 297 mm (nomes longos,
 * imóvel com várias linhas), um ambiente por vez vai para a folha seguinte até tudo caber.
 * A medição roda antes de pintar a tela, então a pessoa não vê a folha estourada.
 */
export function FittedBudgetSheets({ data, logoSrc, onFit }: { data: BudgetData; logoSrc: string; onFit?: (cap: RoomsPerSheet) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(data);
  const [fit, setFit] = useState<{ key: string; limits: number[] }>({ key, limits: [] });
  const limits = fit.key === key ? fit.limits : [];
  const cap: RoomsPerSheet = { ...ROOMS_PER_SHEET, limits };

  useLayoutEffect(() => {
    const sheets = ref.current?.querySelectorAll<HTMLElement>('[data-rooms-sheet]') ?? [];
    for (const sheet of sheets) {
      if (sheet.scrollHeight <= sheet.clientHeight + 1) continue;
      const index = Number(sheet.dataset.roomsSheet);
      const rows = sheet.querySelectorAll('.bsheet__line--room').length;
      if (rows <= 1) continue;
      const next = [...limits];
      next[index] = rows - 1;
      setFit({ key, limits: next });
      return;
    }
    onFit?.(cap);
  });

  return (
    <div ref={ref} style={{ display: 'contents' }}>
      <BudgetSheets data={data} logoSrc={logoSrc} cap={cap} />
    </div>
  );
}

/** O imóvel ocupa no máximo três linhas na folha, como no arquivo original (textarea de 3 linhas). */
export const PROPERTY_MAX_LINES = 3;

/**
 * Conta as linhas que o texto do imóvel ocupa na folha, medindo um elemento invisível com a mesma
 * largura e a mesma letra do quadro Imóvel. Serve para o painel avisar quando o texto passa de três
 * linhas, mesmo no celular, onde as folhas podem estar escondidas.
 */
export function usePropertyLines(text: string): number {
  const [lines, setLines] = useState(0);
  useLayoutEffect(() => {
    if (!text.trim()) {
      setLines(0);
      return;
    }
    const el = document.createElement('span');
    el.className = 'bsheet__property-text bsheet__property-text--measure';
    el.textContent = text;
    document.body.appendChild(el);
    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 1;
      setLines(Math.round(el.scrollHeight / lineHeight));
    };
    measure();
    let alive = true;
    void document.fonts?.ready.then(() => alive && measure());
    return () => {
      alive = false;
      el.remove();
    };
  }, [text]);
  return lines;
}
