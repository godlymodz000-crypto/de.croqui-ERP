import { and, eq, isNull } from 'drizzle-orm';
import type { Db } from './db/client.js';
import { presentationImages, presentations, projectFiles, type Presentation } from './db/schema.js';
import { audit } from './audit.js';
import { projectSubfolderId, type DriveClient } from './drive.js';
import { IMAGES_FOLDER } from './presentation-images.js';

// Vincular uma apresentação avulsa a um projeto (Fase 6b, etapa E5; P21 e P27). As imagens da biblioteca
// da avulsa vão para "<projeto>/Apresentações/Imagens" e o PDF mais recente para "<projeto>/Apresentações".
// O ID de cada arquivo no Drive não muda ao trocar de pasta. Ordem: primeiro o Drive, depois o banco numa
// transação só. Se o Drive falhar no meio, o que já foi movido volta para a pasta de antes e o banco não
// muda; se o banco falhar depois, os arquivos também voltam.

export type LinkResult =
  | { ok: true; presentation: Presentation; moved: { images: number; pdf: boolean } }
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

  let pdf: { id: string; name: string; size: number } | null = null;
  try {
    const presentationsFolder = await projectSubfolderId(drive, project.driveFolderId, 'presentations');
    if (p.pdfDriveFileId) {
      const file = await drive.getFile(p.pdfDriveFileId);
      // PDF apagado no Drive (lixeira ou sumiu): não há o que mover nem mostrar em Arquivos.
      if (file && !file.trashed) {
        const from = await drive.moveFile(file.id, presentationsFolder);
        if (from) {
          moved.push({ fileId: file.id, from });
          pdf = { id: file.id, name: file.name, size: file.size };
        }
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
      if (pdf) {
        // O PDF movido passa a aparecer em Arquivos do projeto, como os PDFs exportados.
        await tx.insert(projectFiles).values({
          projectId: project.id,
          driveFileId: pdf.id,
          name: pdf.name,
          mimeType: 'application/pdf',
          sizeBytes: pdf.size,
          subfolder: 'presentations',
          source: 'pdf_export',
          uploadedBy: actorId,
        });
      }
      await audit(tx, {
        userId: actorId,
        action: 'presentation.link',
        entity: 'presentation',
        entityId: p.id,
        payload: {
          projectId: project.id,
          images: images.length,
          movedImages: moved.length - (pdf ? 1 : 0),
          pdf: pdf ? { driveFileId: pdf.id, name: pdf.name } : null,
        },
      });
      return row;
    });
    return { ok: true, presentation: updated, moved: { images: moved.length - (pdf ? 1 : 0), pdf: !!pdf } };
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
