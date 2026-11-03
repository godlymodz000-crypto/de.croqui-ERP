import { useEffect, useRef } from 'react';
import type { AgendaEvent } from '../../api/events';
import { kindClass, originTag } from './agenda';
import { addDays, dayLabel, eventsOnDay, hourLabel, layoutDay, sameDay, startOfDay, timeRange } from './dates';

/** Altura de uma hora na grade de dia e de semana (px). */
const HOUR_PX = 50;
/** A grade abre rolada até esta hora; o resto do dia fica acessível pela rolagem. */
const FIRST_HOUR = 8;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

interface ViewProps {
  events: AgendaEvent[];
  onOpen: (e: AgendaEvent) => void;
  today?: Date;
}

/** Linha de horário e origem ("9h – 11h" e "Google", "ERP" ou "Pendente"). */
function EventMeta({ event, compact }: { event: AgendaEvent; compact?: boolean }) {
  const tag = originTag(event);
  return (
    <span className="agenda-event__meta">
      <span className="agenda-event__time">{timeRange(event)}</span>
      {!compact && <span className={`agenda-event__tag${tag.pending ? ' is-pending' : ''}`}>{tag.text}</span>}
    </span>
  );
}

function detail(e: AgendaEvent): string | null {
  return [e.projectName, e.location].filter(Boolean).join(' · ') || null;
}

/** Grade de horas: a visão de dia (uma coluna) e a de semana (sete). */
export function TimeGrid({ days, events, onOpen, today = new Date() }: ViewProps & { days: Date[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = FIRST_HOUR * HOUR_PX - 8;
  }, []);
  const allDay = events.filter((e) => e.allDay);
  const timed = events.filter((e) => !e.allDay);

  return (
    <div className="agenda-grid" style={{ ['--agenda-days' as string]: days.length }}>
      <div className="agenda-grid__head">
        <span />
        {days.map((d) => (
          <span key={d.toISOString()} className={`agenda-grid__day${sameDay(d, today) ? ' is-today' : ''}`}>
            {dayLabel(d)}
          </span>
        ))}
      </div>
      {allDay.length > 0 && (
        <div className="agenda-grid__allday">
          <span className="agenda-grid__hour">Dia todo</span>
          {days.map((d) => (
            <div key={d.toISOString()} className="agenda-grid__allday-cell">
              {eventsOnDay(allDay, d).map((e) => (
                <button key={e.id} type="button" className={`agenda-chip ${kindClass(e.kind)}`} onClick={() => onOpen(e)}>
                  {e.title}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
      <div className="agenda-grid__body" ref={scroller}>
        <div className="agenda-grid__canvas" style={{ height: 24 * HOUR_PX }}>
          <div className="agenda-grid__hours">
            {HOURS.map((h) => (
              <span key={h} className="agenda-grid__hour" style={{ top: h * HOUR_PX }}>
                {String(h).padStart(2, '0')}h
              </span>
            ))}
          </div>
          {days.map((d) => (
            <div key={d.toISOString()} className={`agenda-grid__column${sameDay(d, today) ? ' is-today' : ''}`}>
              {layoutDay(eventsOnDay(timed, d), d).map(({ event, start, end, lane, lanes }) => (
                <button
                  key={event.id}
                  type="button"
                  className={`agenda-event ${kindClass(event.kind)}`}
                  style={{
                    top: (start / 60) * HOUR_PX,
                    height: ((end - start) / 60) * HOUR_PX - 4,
                    left: `calc(${(lane / lanes) * 100}% + 3px)`,
                    width: `calc(${100 / lanes}% - 6px)`,
                  }}
                  onClick={() => onOpen(event)}
                >
                  <EventMeta event={event} compact={lanes > 2} />
                  <span className="agenda-event__title">{event.title}</span>
                  {detail(event) && <span className="agenda-event__detail">{detail(event)}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mês em seis semanas. Cada dia mostra até três eventos; o resto abre o dia. */
export function MonthGrid({ from, month, events, onOpen, onOpenDay, today = new Date() }: ViewProps & { from: Date; month: number; onOpenDay: (d: Date) => void }) {
  const days = Array.from({ length: 42 }, (_, i) => addDays(from, i));
  return (
    <div className="agenda-month">
      {days.slice(0, 7).map((d) => (
        <span key={`h${d.getDay()}`} className="agenda-month__weekday">
          {dayLabel(d).split(' ')[0]}
        </span>
      ))}
      {days.map((d) => {
        const list = eventsOnDay(events, d);
        return (
          <div key={d.toISOString()} className={`agenda-month__cell${d.getMonth() !== month ? ' is-outside' : ''}${sameDay(d, today) ? ' is-today' : ''}`}>
            <button type="button" className="agenda-month__date" onClick={() => onOpenDay(d)} aria-label={`Abrir o dia ${d.getDate()}`}>
              {d.getDate()}
            </button>
            {list.slice(0, 3).map((e) => (
              <button key={e.id} type="button" className={`agenda-chip ${kindClass(e.kind)}`} onClick={() => onOpen(e)}>
                {!e.allDay && <span className="agenda-chip__time">{hourLabel(new Date(e.startsAt))}</span>}
                {e.title}
              </button>
            ))}
            {list.length > 3 && (
              <button type="button" className="agenda-month__more" onClick={() => onOpenDay(d)}>
                Mais {list.length - 3}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Lista da semana, dia a dia (visão Lista no computador e a única no celular). */
export function ListView({ from, days = 7, events, onOpen, today = new Date() }: ViewProps & { from: Date; days?: number }) {
  const groups = Array.from({ length: days }, (_, i) => addDays(startOfDay(from), i))
    .map((d) => ({ day: d, items: eventsOnDay(events, d) }))
    .filter((g) => g.items.length);
  if (!groups.length) return <p className="agenda-empty">Nenhum evento neste período.</p>;
  return (
    <div className="agenda-list">
      {groups.map(({ day, items }) => (
        <section key={day.toISOString()} className="agenda-list__day" aria-label={dayLabel(day)}>
          <h2 className={`agenda-list__label${sameDay(day, today) ? ' is-today' : ''}`}>
            {dayLabel(day)}
            {sameDay(day, today) ? ' · hoje' : ''}
          </h2>
          {items.map((e) => (
            <button key={e.id} type="button" className={`agenda-card ${kindClass(e.kind)}`} onClick={() => onOpen(e)}>
              <EventMeta event={e} />
              <span className="agenda-card__title">{e.title}</span>
              {detail(e) && <span className="agenda-card__detail">{detail(e)}</span>}
            </button>
          ))}
        </section>
      ))}
    </div>
  );
}
