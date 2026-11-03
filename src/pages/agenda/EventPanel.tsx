import { useEffect } from 'react';
import { Link } from 'react-router';
import { Button, Icon, IconButton } from '../../ui/ds';
import { AppIcon } from '../../ui/AppIcon';
import { useIsMobile } from '../../ui/useMediaQuery';
import type { AgendaEvent, CalendarInfo } from '../../api/events';
import { conflictNote, kindClass, kindLabel, originLine } from './agenda';
import { addDays, longDate, sameDay, startOfDay, timeRange } from './dates';

/** "Terça, 3 de novembro de 2026" e o horário; no dia inteiro de vários dias, o período. */
function when(e: AgendaEvent): string[] {
  const start = new Date(e.startsAt);
  if (e.allDay) {
    const last = addDays(startOfDay(new Date(e.endsAt)), -1);
    return sameDay(start, last) ? [longDate(start), 'Dia inteiro'] : [`${longDate(start)} a`, longDate(last)];
  }
  return [longDate(start), timeRange(e)];
}

/** Painel do evento aberto (quadros "evento aberto"). Quem não pode editar só vê. */
export function EventPanel({
  event,
  calendar,
  canEdit,
  canOpenGoogle,
  onClose,
  onEdit,
  onRemove,
}: {
  event: AgendaEvent;
  calendar: CalendarInfo;
  canEdit: boolean;
  canOpenGoogle: boolean;
  onClose: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const isMobile = useIsMobile();
  const origin = originLine(event, calendar);
  const conflict = conflictNote(event);
  const [day, time] = when(event);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <aside className="side-panel event-panel" aria-labelledby="event-panel-title">
      <div className="side-panel__form">
        <div className="side-panel__top">
          <span className={`event-panel__kind ${kindClass(event.kind)}`}>{kindLabel(event.kind)}</span>
          <IconButton icon="x" label="Fechar" variant="ghost" size={isMobile ? 'md' : 'sm'} onClick={onClose} />
        </div>
        <div className="event-panel__heading">
          <h2 id="event-panel-title" className="event-panel__title">
            {event.title}
          </h2>
          <p className={`event-panel__origin${origin.tone === 'danger' ? ' is-danger' : ''}`}>
            <AppIcon name="refresh-cw" size={12} />
            {origin.text}
          </p>
          {conflict && <p className="event-panel__origin">{conflict}</p>}
        </div>
        <hr className="event-panel__rule" />
        <div className="event-panel__facts">
          <p className="event-panel__fact">
            <Icon name="clock" size={16} strokeWidth={1.25} />
            <span>
              {day}
              <br />
              {time}
            </span>
          </p>
          {event.location && (
            <p className="event-panel__fact">
              <Icon name="map-pin" size={16} strokeWidth={1.25} />
              <span>{event.location}</span>
            </p>
          )}
        </div>
        {event.description && (
          <div className="event-panel__section">
            <h3 className="event-panel__label">Descrição</h3>
            <p className="event-panel__text">{event.description}</p>
          </div>
        )}
        {event.projectId && event.projectName && (
          <div className="event-panel__section">
            <h3 className="event-panel__label">Projeto vinculado</h3>
            <Link to={`/projetos/${event.projectId}`} className="event-panel__project">
              <span className="event-panel__arch" aria-hidden />
              <span className="event-panel__project-name">{event.projectName}</span>
              <Icon name="chevron-right" size={16} strokeWidth={1.25} />
            </Link>
          </div>
        )}

        <div className="side-panel__spacer" />

        {(canOpenGoogle && event.googleUrl) || canEdit ? (
          <div className="event-panel__links">
            {canOpenGoogle && event.googleUrl ? (
              <a className="link-button" href={event.googleUrl} target="_blank" rel="noreferrer">
                Abrir no Google Agenda
              </a>
            ) : (
              <span />
            )}
            {canEdit && (
              <button type="button" className="link-button" onClick={onRemove}>
                Remover evento
              </button>
            )}
          </div>
        ) : null}
        {canEdit && (
          <Button variant="outline" fullWidth onClick={onEdit}>
            Editar evento
          </Button>
        )}
      </div>
    </aside>
  );
}
