import { useCallback, useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button, Icon, Toast } from '../../ui/ds';
import { useSession } from '../../session';
import { useIsMobile } from '../../ui/useMediaQuery';
import { LoadError } from '../../ui/LoadError';
import { boardApi, withCardIn, type Board, type BoardCard, type Stage } from '../../api/board';
import { RowMenu, type RowMenuEntry } from '../collaborators/RowMenu';
import { ProjectPanel } from '../projects/ProjectPanel';
import { canWriteProjects } from '../projects/shared';
import { cardDeadline, initials, STAGE_TONES } from './cards';
import { StageForm } from './StageForm';
import { RemoveStageDialog } from './RemoveStageDialog';
import { createCardGesture, isCardBackground } from './cardDrag';

const LOAD_ERROR = 'Não foi possível carregar os processos.';

interface Notice {
  tone: 'neutral' | 'danger';
  message: string;
  retry?: () => void;
}

/**
 * Processos em Kanban (quadros "ERP · Processos" no Figcraft). Uma leitura traz etapas e cartões;
 * mover um cartão muda a tela na hora e só busca o quadro de novo se o servidor recusar ou divergir.
 * No celular, as colunas viram uma lista por etapa e o cartão se move pelo "Mover para".
 */
export function ProcessesPage() {
  const session = useSession();
  const me = session.status === 'authenticated' ? session.user : null;
  const canMove = canWriteProjects(me);
  const canManage = me?.role === 'admin';
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [board, setBoardState] = useState<Board | null>(null);
  const boardRef = useRef<Board | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Stage | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [dragging, setDragging] = useState<BoardCard | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const gesture = useRef(createCardGesture());

  // O ref acompanha o estado para as gravações guardarem no cache o quadro que está na tela.
  const setBoard = useCallback((next: Board | null) => {
    boardRef.current = next;
    setBoardState(next);
  }, []);

  const load = useCallback(
    async (force = false) => {
      try {
        setBoard(await boardApi.get({ force }));
        setLoadError(null);
      } catch (err) {
        setLoadError(err);
      }
    },
    [setBoard],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), notice.retry ? 10_000 : 6000);
    return () => clearTimeout(t);
  }, [notice]);

  function stageName(id: string) {
    return boardRef.current?.stages.find((s) => s.id === id)?.name ?? '';
  }

  function remember(next: Board) {
    setBoard(next);
    boardApi.remember(next);
  }

  async function move(card: BoardCard, toStageId: string) {
    const current = boardRef.current;
    if (!current || card.stageId === toStageId) return;
    const fromStageId = card.stageId;
    const toName = stageName(toStageId);
    setBoard(withCardIn(current, card.id, toStageId));
    setNotice(null);
    try {
      const res = await boardApi.move(card.id, toStageId);
      if (res.stageId !== toStageId) {
        await load(true);
        return;
      }
      if (boardRef.current) boardApi.remember(boardRef.current);
      setNotice({ tone: 'neutral', message: `Etapa atualizada para ${toName}.` });
    } catch {
      // Volta o cartão e confere com o servidor; o aviso oferece repetir o mesmo movimento.
      if (boardRef.current) setBoard(withCardIn(boardRef.current, card.id, fromStageId));
      setNotice({
        tone: 'danger',
        message: `Não conseguimos mover ${card.name} para ${toName}.`,
        retry: () => move({ ...card, stageId: fromStageId }, toStageId),
      });
      await load(true);
    }
  }

  async function createStage(name: string) {
    const stage = await boardApi.createStage(name);
    const current = boardRef.current;
    if (current) remember({ ...current, stages: [...current.stages, stage] });
    setAdding(false);
    setNotice({ tone: 'neutral', message: `Etapa ${stage.name} criada.` });
  }

  async function renameStage(id: string, name: string) {
    const stage = await boardApi.renameStage(id, name);
    const current = boardRef.current;
    if (current) remember({ ...current, stages: current.stages.map((s) => (s.id === id ? stage : s)) });
    setRenaming(null);
  }

  async function removeStage(stage: Stage, destinationStageId: string | null) {
    try {
      await boardApi.removeStage(stage.id, destinationStageId);
    } catch (err) {
      // O quadro pode ter mudado (projeto novo na etapa, destino removido): confere antes de pedir de novo.
      await load(true);
      throw err;
    }
    const current = boardRef.current;
    if (current) {
      remember({
        stages: current.stages.filter((s) => s.id !== stage.id),
        projects: destinationStageId
          ? current.projects.reduce((b, p) => (p.stageId === stage.id ? withCardIn(b, p.id, destinationStageId) : b), current).projects
          : current.projects,
      });
    }
    setRemoving(null);
    setNotice({ tone: 'neutral', message: `Etapa ${stage.name} removida.` });
  }

  // Arrastar só no desktop e para quem pode mover.
  const draggable = canMove && !isMobile;

  function onDragStart(e: DragEvent, card: BoardCard) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
    setDragging(card);
  }

  function onDragEnd() {
    setDragging(null);
    setDropTarget(null);
  }

  function columnDragProps(stage: Stage) {
    if (!draggable) return {};
    return {
      onDragOver: (e: DragEvent) => {
        if (!dragging) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dropTarget !== stage.id) setDropTarget(stage.id);
      },
      onDragLeave: (e: DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropTarget((t) => (t === stage.id ? null : t));
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        const card = dragging;
        onDragEnd();
        if (card) move(card, stage.id);
      },
    };
  }

  function cardMenu(card: BoardCard, stages: Stage[]): RowMenuEntry[] {
    return [
      { label: 'Abrir projeto', onSelect: () => navigate(`/projetos/${card.id}`) },
      { heading: 'Mover para' },
      ...stages.map((s) =>
        s.id === card.stageId
          ? { label: `${s.name} · etapa atual`, disabled: true, onSelect: () => {} }
          : { label: s.name, onSelect: () => move(card, s.id) },
      ),
    ];
  }

  function stageMenu(stage: Stage, stages: Stage[]): RowMenuEntry[] {
    const entries: RowMenuEntry[] = [{ label: 'Renomear etapa', onSelect: () => setRenaming(stage.id) }];
    // O quadro precisa de ao menos uma etapa: a última não oferece remover.
    if (stages.length > 1) entries.push({ label: 'Remover etapa', onSelect: () => setRemoving(stage) });
    return entries;
  }

  let content: ReactNode = null;
  if (loadError != null && !board) {
    content = <LoadError error={loadError} message={LOAD_ERROR} onRetry={() => load(true)} />;
  } else if (!board) {
    content = <p className="board__loading">Carregando os processos.</p>;
  } else {
    const { stages, projects } = board;
    content = (
      <div className={`board${dragging ? ' is-dragging' : ''}`} aria-label="Quadro de processos">
        {stages.map((stage, index) => {
          const cards = projects.filter((p) => p.stageId === stage.id);
          const isTarget = dropTarget === stage.id && dragging?.stageId !== stage.id;
          return (
            <section
              key={stage.id}
              className={`board-column board-column--tone-${index % STAGE_TONES}${isTarget ? ' is-drop-target' : ''}`}
              aria-labelledby={`etapa-${stage.id}`}
              {...columnDragProps(stage)}
            >
              {renaming === stage.id ? (
                <StageForm
                  label="Renomear etapa"
                  initial={stage.name}
                  submitLabel="Salvar"
                  onCancel={() => setRenaming(null)}
                  onSubmit={(name) => renameStage(stage.id, name)}
                />
              ) : (
                <header className="board-column__header">
                  <h2 className="board-column__title" id={`etapa-${stage.id}`}>
                    {stage.name} <span className="board-column__count">{cards.length}</span>
                  </h2>
                  {canManage && <RowMenu label={`Ações da etapa ${stage.name}`} actions={stageMenu(stage, stages)} />}
                </header>
              )}

              <ul className="board-column__cards">
                {cards.map((card) => {
                  const deadline = cardDeadline(card.deadline);
                  return (
                    <li
                      key={card.id}
                      className={`board-card${dragging?.id === card.id ? ' is-dragging' : ''}`}
                      draggable={draggable}
                      onDragStart={draggable ? (e) => onDragStart(e, card) : undefined}
                      onDragEnd={draggable ? onDragEnd : undefined}
                      onPointerDown={(e) => e.button === 0 && gesture.current.down({ x: e.clientX, y: e.clientY })}
                      onPointerMove={(e) => e.buttons & 1 && gesture.current.move({ x: e.clientX, y: e.clientY })}
                      onClickCapture={(e) => {
                        // Clique com movimento não abre nada, nem pelo link do nome.
                        if (!gesture.current.isClick()) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      onClick={(e) => isCardBackground(e.target as Element) && navigate(`/projetos/${card.id}`)}
                    >
                      <Link to={`/projetos/${card.id}`} className="board-card__link" draggable={false}>
                        <span className="board-card__name">{card.name}</span>
                        <span className="board-card__client">{card.clientName}</span>
                      </Link>
                      <div className="board-card__footer">
                        {card.owner ? (
                          <span className="board-card__avatar" title={card.owner} aria-label={`Responsável: ${card.owner}`}>
                            {initials(card.owner)}
                          </span>
                        ) : (
                          <span />
                        )}
                        {deadline && (
                          <span className={deadline.overdue ? 'board-card__deadline is-overdue' : 'board-card__deadline'}>
                            {deadline.text}
                          </span>
                        )}
                      </div>
                      {canMove && (
                        <RowMenu className="board-card__menu" label={`Ações de ${card.name}`} actions={cardMenu(card, stages)} />
                      )}
                    </li>
                  );
                })}
              </ul>
              {isTarget && <div className="board-column__drop" aria-hidden />}
              {cards.length === 0 && (
                <p className="board-column__empty">
                  Nenhum projeto nesta etapa ainda.
                  {canMove && (isMobile ? ' Use Mover para no menu do cartão.' : ' Arraste um cartão para cá.')}
                </p>
              )}
            </section>
          );
        })}

        {canManage &&
          (adding ? (
            <div className="board-column board-column--new">
              <StageForm label="Nome da etapa" submitLabel="Criar etapa" onCancel={() => setAdding(false)} onSubmit={createStage} />
            </div>
          ) : (
            <button type="button" className="board__add-stage" onClick={() => setAdding(true)}>
              <Icon name="plus" size={16} strokeWidth={1.25} />
              Nova etapa
            </button>
          ))}
      </div>
    );
  }

  return (
    <section className="processes">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Estúdio · Processos</p>
          <h1 className="page-header__title">Processos</h1>
        </div>
        {canMove && (
          <Button variant="primary" iconLeft="plus" onClick={() => setCreatingProject(true)}>
            Novo projeto
          </Button>
        )}
      </header>

      {content}

      {creatingProject && (
        <ProjectPanel
          onClose={() => setCreatingProject(false)}
          onSaved={async (p) => {
            setCreatingProject(false);
            await load(true);
            const first = boardRef.current?.projects.find((c) => c.id === p.id);
            setNotice({ tone: 'neutral', message: `Projeto ${p.name} criado${first ? ` em ${stageName(first.stageId)}` : ''}.` });
          }}
        />
      )}

      {removing && board && (
        <RemoveStageDialog
          stage={removing}
          stages={board.stages}
          cards={board.projects.filter((p) => p.stageId === removing.id)}
          onClose={() => setRemoving(null)}
          onRemove={(dest) => removeStage(removing, dest)}
        />
      )}

      <div className="toast-slot" aria-live="polite">
        {notice && (
          <Toast
            tone={notice.tone}
            message={notice.message}
            onClose={() => setNotice(null)}
            action={
              notice.retry ? (
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    const retry = notice.retry!;
                    setNotice(null);
                    retry();
                  }}
                >
                  Tentar de novo
                </button>
              ) : undefined
            }
          />
        )}
      </div>
    </section>
  );
}
