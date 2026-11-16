import fs from 'node:fs/promises';
import path from 'node:path';

export interface DevAnnotationItem {
  id: string;
  index: number;
  createdAt: string;
  category: string;
  comment: string;
  url: string;
  activeContext: string;
  viewport: { width: number; height: number; scrollX: number; scrollY: number };
  rect: { x: number; y: number; width: number; height: number };
  elements: Array<{ tag: string; label: string; selector: string }>;
  cropFile?: string;
}

const DIR = path.join(process.cwd(), '.dev-annotations');
const JSON_FILE = path.join(DIR, 'annotations.json');
const MD_FILE = path.join(DIR, 'annotations.md');
const CROPS_DIR = path.join(DIR, 'crops');

function devOnly() {
  return process.env.NODE_ENV === 'development';
}

function buildMarkdown(items: DevAnnotationItem[]): string {
  if (items.length === 0) {
    return '# Marcações de Revisão (Localhost)\n\nNenhuma marcação registrada ainda.\n';
  }
  const lines: string[] = [
    '# Marcações de Revisão (Localhost)',
    '',
    `Total: ${items.length} marcação(ões)`,
    '',
  ];
  for (const item of items) {
    lines.push(`## #${item.index} [${item.category}] ${item.activeContext || item.url}`);
    lines.push(`- **O que corrigir:** ${item.comment}`);
    lines.push(
      `- **Área (viewport ${item.viewport.width}x${item.viewport.height}, scroll ${item.viewport.scrollX},${item.viewport.scrollY}):** x=${item.rect.x}px, y=${item.rect.y}px, ${item.rect.width}x${item.rect.height}px`
    );
    if (item.elements.length > 0) {
      lines.push(
        `- **Elementos na área:** ${item.elements
          .map((el) => `\`${el.selector}\`${el.label ? ` ("${el.label}")` : ''}`)
          .join(' | ')}`
      );
    }
    if (item.cropFile) {
      lines.push(`- **Recorte PNG:** \`.dev-annotations/crops/${item.cropFile}\``);
    }
    lines.push(`- **Data:** ${item.createdAt}`);
    lines.push('');
  }
  return lines.join('\n');
}

async function readAll(): Promise<DevAnnotationItem[]> {
  try {
    const raw = await fs.readFile(JSON_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(items: DevAnnotationItem[]) {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(JSON_FILE, JSON.stringify(items, null, 2), 'utf8');
  await fs.writeFile(MD_FILE, buildMarkdown(items), 'utf8');
}

export async function GET() {
  if (!devOnly()) return new Response('Not Found', { status: 404 });
  const items = await readAll();
  return Response.json({ items }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  if (!devOnly()) return new Response('Not Found', { status: 404 });
  try {
    const body = (await request.json()) as {
      action?: 'create' | 'delete';
      id?: string;
      annotation?: Omit<DevAnnotationItem, 'index' | 'cropFile'>;
      cropDataUrl?: string;
    };

    const current = await readAll();

    if (body.action === 'delete' && typeof body.id === 'string') {
      const target = current.find((item) => item.id === body.id);
      if (target?.cropFile) {
        await fs.unlink(path.join(CROPS_DIR, path.basename(target.cropFile))).catch(() => {});
      }
      const next = current
        .filter((item) => item.id !== body.id)
        .map((item, idx) => ({ ...item, index: idx + 1 }));
      await writeAll(next);
      return Response.json({ items: next });
    }

    const ann = body.annotation;
    if (!ann || typeof ann.comment !== 'string' || !ann.comment.trim()) {
      return Response.json({ error: 'Comentário obrigatório.' }, { status: 400 });
    }

    const safeId = String(ann.id || `ann-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '');
    let cropFile: string | undefined;

    if (typeof body.cropDataUrl === 'string' && body.cropDataUrl.startsWith('data:image/png;base64,')) {
      const b64 = body.cropDataUrl.slice('data:image/png;base64,'.length);
      if (b64.length > 0 && b64.length < 4_000_000) {
        await fs.mkdir(CROPS_DIR, { recursive: true });
        cropFile = `${safeId}.png`;
        await fs.writeFile(path.join(CROPS_DIR, cropFile), Buffer.from(b64, 'base64'));
      }
    }

    const nextItem: DevAnnotationItem = {
      id: safeId,
      index: current.length + 1,
      createdAt: ann.createdAt || new Date().toISOString(),
      category: String(ann.category || 'Visual / Layout'),
      comment: ann.comment.trim(),
      url: String(ann.url || '/'),
      activeContext: String(ann.activeContext || ''),
      viewport: ann.viewport,
      rect: ann.rect,
      elements: Array.isArray(ann.elements) ? ann.elements.slice(0, 8) : [],
      ...(cropFile ? { cropFile } : {}),
    };

    const next = [...current, nextItem];
    await writeAll(next);
    return Response.json({ items: next, item: nextItem });
  } catch {
    return Response.json({ error: 'Falha ao salvar marcação.' }, { status: 500 });
  }
}

export async function DELETE() {
  if (!devOnly()) return new Response('Not Found', { status: 404 });
  await fs.rm(DIR, { recursive: true, force: true }).catch(() => {});
  return Response.json({ items: [] });
}
