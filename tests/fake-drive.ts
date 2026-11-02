import { DriveError, type DriveClient, type DriveFile } from '../api/_app/drive.js';

interface Item {
  id: string;
  name: string;
  parentId: string | null;
  trashed: boolean;
  folder: boolean;
  mimeType: string;
  size: number;
}

/** Drive em memória para os testes. `failOn` faz uma operação falhar (na N-ésima chamada, quando indicado). */
export class FakeDrive implements DriveClient {
  folders = new Map<string, Item>();
  calls: string[] = [];
  failOn: { op: keyof DriveClient; nth?: number } | null = null;
  sessions = new Map<string, { name: string; mimeType: string; size: number; parentId: string; origin: string }>();
  private seq = 0;
  private count: Record<string, number> = {};

  private check(op: keyof DriveClient) {
    this.calls.push(op);
    this.count[op] = (this.count[op] ?? 0) + 1;
    if (this.failOn?.op === op && (this.failOn.nth === undefined || this.failOn.nth === this.count[op])) {
      throw new DriveError(`falha simulada em ${op}`);
    }
  }
  private add(name: string, parentId: string | null, folder: boolean, mimeType = 'application/vnd.google-apps.folder', size = 0) {
    const id = `${folder ? 'pasta' : 'arquivo'}-${++this.seq}`;
    this.folders.set(id, { id, name, parentId, trashed: false, folder, mimeType, size });
    return id;
  }

  async createFolder(name: string, parentId: string | null) {
    this.check('createFolder');
    return this.add(name, parentId, true);
  }
  async renameFolder(id: string, name: string) {
    this.check('renameFolder');
    const f = this.folders.get(id);
    if (!f) throw new DriveError('não existe');
    f.name = name;
  }
  async folderExists(id: string) {
    this.check('folderExists');
    const f = this.folders.get(id);
    return !!f && !f.trashed;
  }
  async trashFolder(id: string) {
    this.check('trashFolder');
    const f = this.folders.get(id);
    if (f) f.trashed = true;
  }
  async trashFile(id: string) {
    this.check('trashFile');
    const f = this.folders.get(id);
    if (f) f.trashed = true;
  }
  async findChildFolder(parentId: string, name: string) {
    this.check('findChildFolder');
    return [...this.folders.values()].find((f) => f.folder && !f.trashed && f.parentId === parentId && f.name === name)?.id ?? null;
  }
  async createUploadSession(input: { name: string; mimeType: string; size: number; parentId: string; origin: string }) {
    this.check('createUploadSession');
    const url = `https://upload.fake/sessao-${++this.seq}`;
    this.sessions.set(url, input);
    return url;
  }
  async getFile(id: string): Promise<DriveFile | null> {
    this.check('getFile');
    const f = this.folders.get(id);
    if (!f || f.folder) return null;
    return { id: f.id, name: f.name, mimeType: f.mimeType, size: f.size, parents: f.parentId ? [f.parentId] : [], trashed: f.trashed };
  }
  async thumbnail(id: string) {
    this.check('thumbnail');
    const f = this.folders.get(id);
    if (!f || !f.mimeType.startsWith('image/')) return null;
    return { contentType: 'image/png', body: new Uint8Array([137, 80, 78, 71]).buffer };
  }

  /** O que o navegador faz: envia o arquivo para a sessão. Devolve o ID que o Drive responde. */
  browserUpload(url: string, override: Partial<{ size: number; name: string; parentId: string }> = {}) {
    const s = this.sessions.get(url);
    if (!s) throw new Error('sessão inexistente');
    return this.add(override.name ?? s.name, override.parentId ?? s.parentId, false, s.mimeType, override.size ?? s.size);
  }

  childrenOf(id: string) {
    return [...this.folders.values()].filter((f) => f.parentId === id && !f.trashed);
  }
  byName(name: string) {
    return [...this.folders.values()].filter((f) => f.name === name && !f.trashed);
  }
  resetCalls() {
    this.calls = [];
  }
}
