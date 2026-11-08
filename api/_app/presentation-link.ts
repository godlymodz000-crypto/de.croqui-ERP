import { and, asc, eq, isNull } from 'drizzle-orm';
import type { Db } from './db/client.js';
import { auditLog, presentationImages, presentations, projectFiles, type Presentation } from './db/schema.js';
import { audit } from './audit.js';
import { projectSubfolderId, type DriveClient } from './drive.js';
import { IMAGES_FOLDER } from './presentation-images.js';

// Vincular uma apresentação avulsa a um projeto (Fase 6b, etapa E5; P21 e P27). As imagens da biblioteca
// da avulsa vão para "<projeto>/Apresentações/Imagens" e os PDFs para "<projeto>/Apresentações": o mais recente e,
// desde a E9, as versões anteriores exportadas enquanto ela era avulsa, para a pasta do projeto ficar completa.
// O ID de cada arquivo no Drive não muda ao trocar de pasta. Ordem: primeiro o Drive, depois o banco numa
// transação só. Se o Drive falhar no meio, o que já foi movido volta para a pasta de antes e o banco não
// muda; se o banco falhar depois, os arquivos também voltam.

export type LinkResult =
  | { ok: true; presentation: Presentation; moved: { images: number; pdf: boolean; pdfs: number } }
  | { ok: false; error: 'already_linked' }
  | { ok: false; error: 'drive_failed'; rolledBack: boolean };

interface Move {
  fileId: string;
  from: string[];
}

export async function linkPresentationToProject(input: {
  db: Db;
  drive: DriveClient;
  presentation: Presentation;
  project: { id: string; driveFolderId: string };
  actorId: string;
  log: (err: unknown, msg: string) => void;
}): Promise<LinkResult> {
  const { db, drive, presentation: p, project, actorId, log } = input;
  if (p.projectId) return { ok: false, error: 'already_linked' };

  // Biblioteca da avulsa. As que já foram para a lixeira não mudam de pasta, mas também passam ao projeto.
  const images = await db
    .select({ id: presentationImages.id, driveFileId: presentationImages.driveFileId, trashedAt: presentationImages.trashedAt })
    .from(presentationImages)
    .where(eq(presentationImages.ownerPresentationId, p.id));
  const toMove = images.filter((i) => !i.trashedAt);

  const moved: Move[] = [];
  /** Desfaz as mudanças de pasta, da última para a primeira. Devolve falso se alguma não voltou. */
  async function rollback(): Promise<boolean> {
    let ok = true;
    for (const m of [...moved].reverse()) {
      if (!m.from.length) continue;
      try {
        await drive.moveFile(m.fileId, m.from[0]);
      } catch (err) {
        ok = false;
        log(err, 'falha ao devolver arquivo para a pasta anterior');
      }
    }
    moved.length = 0;
    return ok;
  }

  // PDFs da avulsa: cada exportação fica registrada no histórico (presentation.export) com o arquivo no Drive.
  // Só leitura do histórico. O mais recente vem primeiro na lista.
  const exports = await db
    .select({ payload: auditLog.payload })
    .from(auditLog)
    .where(and(eq(auditLog.entity, 'presentation'), eq(auditLog.entityId, p.id), eq(auditLog.action, 'presentation.export')))
    .orderBy(asc(auditLog.at));
  const pdfIds = [
    ...new Set(
      [p.pdfDriveFileId, ...exports.reverse().map((e) => (e.payload as { driveFileId?: unknown } | null)?.driveFileId)].filter(
        (id): id is string => typeof id === 'string' && !!id,
      ),
    ),
  ];

  const pdfs: { id: string; name: string; size: number }[] = [];
  try {
    const presentationsFolder = await projectSubfolderId(drive, project.driveFolderId, 'presentations');
    for (const id of pdfIds) {
      const file = await drive.getFile(id);
      // PDF apagado no Drive (lixeira ou sumiu): não há o que mover nem mostrar em Arquivos.
      if (!file || file.trashed) continue;
      const from = await drive.moveFile(file.id, presentationsFolder);
      if (from) {
        moved.push({ fileId: file.id, from });
        pdfs.push({ id: file.id, name: file.name, size: file.size });
      }
    }
    if (toMove.length) {
      const imagesFolder =
        (await drive.findChildFolder(presentationsFolder, IMAGES_FOLDER)) ?? (await drive.createFolder(IMAGES_FOLDER, presentationsFolder));
      for (const img of toMove) {
        const from = await drive.moveFile(img.driveFileId, imagesFolder);
        if (from) moved.push({ fileId: img.driveFileId, from });
      }
    }
  } catch (err) {
    log(err, 'falha no Google Drive ao vincular a apresentação');
    return { ok: false, error: 'drive_failed', rolledBack: await rollback() };
  }

  /** O PDF mais recente, se ele estava no Drive e foi movido. */
  const latest = pdfs.find((f) => f.id === p.pdfDriveFileId) ?? null;
  try {
    const updated = await db.transaction(async (tx) => {
      // Só vincula se ainda for avulsa: outro pedido pode ter vinculado nesse meio tempo.
      const [row] = await tx
        .update(presentations)
        .set({ projectId: project.id, updatedAt: new Date() })
        .where(and(eq(presentations.id, p.id), isNull(presentations.projectId)))
        .returning();
      if (!row) throw new AlreadyLinkedError();
      await tx
        .update(presentationImages)
        .set({ projectId: project.id, ownerPresentationId: null })
        .where(eq(presentationImages.ownerPresentationId, p.id));
      if (pdfs.length) {
        // Os PDFs movidos passam a aparecer em Arquivos do projeto, como os PDFs exportados.
        await tx.insert(projectFiles).values(
          pdfs.map((f) => ({
            projectId: project.id,
            driveFileId: f.id,
            name: f.name,
            mimeType: 'application/pdf',
            sizeBytes: f.size,
            subfolder: 'presentations' as const,
            source: 'pdf_export' as const,
            uploadedBy: actorId,
          })),
        );
      }
      await audit(tx, {
        userId: actorId,
        action: 'presentation.link',
        entity: 'presentation',
        entityId: p.id,
        payload: {
          projectId: project.id,
          images: images.length,
          movedImages: moved.length - pdfs.length,
          pdf: latest ? { driveFileId: latest.id, name: latest.name } : null,
          pdfs: pdfs.map((f) => ({ driveFileId: f.id, name: f.name })),
        },
      });
      return row;
    });
    return { ok: true, presentation: updated, moved: { images: moved.length - pdfs.length, pdf: !!latest, pdfs: pdfs.length } };
  } catch (err) {
    if (err instanceof AlreadyLinkedError) {
      // Outro pedido vinculou primeiro. Os arquivos só voltam se ele vinculou a outro projeto.
      const [now] = await db.select({ projectId: presentations.projectId }).from(presentations).where(eq(presentations.id, p.id));
      if (now?.projectId !== project.id) await rollback();
      return { ok: false, error: 'already_linked' };
    }
    // O banco falhou depois de mover: os arquivos voltam para onde estavam.
    await rollback();
    throw err;
  }
}

class AlreadyLinkedError extends Error {
  constructor() {
    super('apresentação já vinculada');
  }
}
