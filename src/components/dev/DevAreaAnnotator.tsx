'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Crosshair,
  ListTodo,
  Trash2,
  Copy,
  Check,
  X,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
} from 'lucide-react';
import type { DevAnnotationItem } from '@/app/api/dev-annotations/route';

interface RectBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CapturedElement {
  tag: string;
  label: string;
  selector: string;
}

const CATEGORIES = ['Visual / Layout', 'Bug / Erro', 'Texto / Rótulo', 'Comportamento'] as const;

function describeElement(el: Element): CapturedElement {
  const tag = el.tagName.toLowerCase();
  const idPart = el.id ? `#${el.id}` : '';
  const rawClass = typeof (el as HTMLElement).className === 'string' ? (el as HTMLElement).className : '';
  const classes = rawClass
    .trim()
    .split(/\s+/)
    .filter((c) => c && !c.startsWith('hover:') && !c.startsWith('focus:'))
    .slice(0, 2)
    .map((c) => `.${c}`)
    .join('');
  const aria = el.getAttribute('aria-label') || el.getAttribute('placeholder') || '';
  const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
  const label = (aria || text).slice(0, 70);
  return {
    tag,
    label,
    selector: `${tag}${idPart}${classes}`,
  };
}

function collectElementsInRect(rect: RectBox): CapturedElement[] {
  const seen = new Set<string>();
  const out: CapturedElement[] = [];
  const stepX = Math.max(12, Math.floor(rect.width / 5));
  const stepY = Math.max(12, Math.floor(rect.height / 5));

  for (let y = rect.y + 4; y <= rect.y + rect.height - 2; y += stepY) {
    for (let x = rect.x + 4; x <= rect.x + rect.width - 2; x += stepX) {
      const stack = document.elementsFromPoint(x, y);
      for (const el of stack) {
        if (el.closest('[data-dev-annotator="true"]')) continue;
        if (el.tagName === 'HTML' || el.tagName === 'BODY') continue;
        const info = describeElement(el);
        const key = `${info.selector}|${info.label}`;
        if (!info.label && info.tag === 'div') continue;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(info);
        if (out.length >= 6) return out;
        break;
      }
    }
  }
  return out;
}

function detectActiveContext(): string {
  const activeNav = document.querySelector('[aria-current="page"], nav button[data-active="true"]');
  const heading = document.querySelector('main h1, main h2, [role="dialog"] h2, [role="dialog"] h3');
  const parts = [activeNav?.textContent?.trim(), heading?.textContent?.trim()].filter(Boolean);
  return parts.join(' • ').slice(0, 90) || window.location.pathname;
}

async function captureCropPng(rect: RectBox): Promise<string | undefined> {
  try {
    const html2canvas = (await import('html2canvas-pro')).default;
    const scale = Math.min(window.devicePixelRatio || 1, 1.5);
    const canvas = await html2canvas(document.body, {
      x: rect.x + window.scrollX,
      y: rect.y + window.scrollY,
      width: Math.max(20, rect.width),
      height: Math.max(20, rect.height),
      scale,
      logging: false,
      useCORS: true,
      ignoreElements: (el) => el instanceof HTMLElement && el.dataset.devAnnotator === 'true',
    });
    return canvas.toDataURL('image/png');
  } catch {
    return undefined;
  }
}

export function DevAreaAnnotator() {
  const [selecting, setSelecting] = useState(false);
  const [showPins, setShowPins] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [items, setItems] = useState<DevAnnotationItem[]>([]);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [draftRect, setDraftRect] = useState<RectBox | null>(null);
  const [lockedRect, setLockedRect] = useState<RectBox | null>(null);
  const [capturedElements, setCapturedElements] = useState<CapturedElement[]>([]);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/dev-annotations', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { items?: DevAnnotationItem[] } | null) => {
        if (active && data && Array.isArray(data.items)) {
          setItems(data.items);
        }
      })
      .catch(() => {
        // Ignore network hiccups in dev
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setLockedRect(null);
        setDraftRect(null);
        setSelecting((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (lockedRect) {
          setLockedRect(null);
          setComment('');
        } else if (selecting) {
          setSelecting(false);
          setDragStart(null);
          setDraftRect(null);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lockedRect, selecting]);

  useEffect(() => {
    if (lockedRect) {
      setTimeout(() => textareaRef.current?.focus(), 30);
    }
  }, [lockedRect]);

  const finalizeSelection = useCallback((rawRect: RectBox, clickPoint?: { x: number; y: number }) => {
    let finalRect = rawRect;
    if ((rawRect.width < 14 || rawRect.height < 14) && clickPoint) {
      const target = document
        .elementsFromPoint(clickPoint.x, clickPoint.y)
        .find((el) => !el.closest('[data-dev-annotator="true"]') && el.tagName !== 'HTML' && el.tagName !== 'BODY');
      if (target) {
        const box = target.getBoundingClientRect();
        finalRect = {
          x: Math.max(0, Math.round(box.left)),
          y: Math.max(0, Math.round(box.top)),
          width: Math.max(24, Math.round(box.width)),
          height: Math.max(24, Math.round(box.height)),
        };
      }
    }

    if (finalRect.width < 12 || finalRect.height < 12) return;

    setSelecting(false);
    setLockedRect(finalRect);
    setCapturedElements(collectElementsInRect(finalRect));
    setComment('');
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!selecting) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const point = { x: Math.round(e.clientX), y: Math.round(e.clientY) };
    setDragStart(point);
    setDraftRect({ x: point.x, y: point.y, width: 0, height: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!selecting || !dragStart) return;
    const x1 = Math.min(dragStart.x, Math.round(e.clientX));
    const y1 = Math.min(dragStart.y, Math.round(e.clientY));
    const x2 = Math.max(dragStart.x, Math.round(e.clientX));
    const y2 = Math.max(dragStart.y, Math.round(e.clientY));
    setDraftRect({ x: x1, y: y1, width: x2 - x1, height: y2 - y1 });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!selecting || !dragStart) return;
    const current = draftRect || { x: dragStart.x, y: dragStart.y, width: 0, height: 0 };
    const clickPoint = { x: Math.round(e.clientX), y: Math.round(e.clientY) };
    setDragStart(null);
    setDraftRect(null);
    finalizeSelection(current, clickPoint);
  };

  const handleSaveAnnotation = async () => {
    if (!lockedRect || !comment.trim() || saving) return;
    setSaving(true);
    setStatusMessage('');
    try {
      const rect = {
        x: Math.round(lockedRect.x),
        y: Math.round(lockedRect.y),
        width: Math.round(lockedRect.width),
        height: Math.round(lockedRect.height),
      };
      const cropDataUrl = await captureCropPng(rect);
      const id = `ann-${Date.now()}`;
      const res = await fetch('/api/dev-annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          cropDataUrl,
          annotation: {
            id,
            createdAt: new Date().toISOString(),
            category,
            comment: comment.trim(),
            url: `${window.location.pathname}${window.location.search}`,
            activeContext: detectActiveContext(),
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
              scrollX: Math.round(window.scrollX),
              scrollY: Math.round(window.scrollY),
            },
            rect,
            elements: capturedElements,
          },
        }),
      });
      if (!res.ok) throw new Error('Falha ao salvar');
      const data = (await res.json()) as { items?: DevAnnotationItem[] };
      if (Array.isArray(data.items)) setItems(data.items);
      setLockedRect(null);
      setComment('');
      setStatusMessage('Marcação salva!');
      setTimeout(() => setStatusMessage(''), 2500);
    } catch {
      setStatusMessage('Erro ao salvar marcação.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOne = async (id: string) => {
    const res = await fetch('/api/dev-annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    if (res.ok) {
      const data = (await res.json()) as { items?: DevAnnotationItem[] };
      if (Array.isArray(data.items)) setItems(data.items);
    }
  };

  const handleClearAll = async () => {
    const res = await fetch('/api/dev-annotations', { method: 'DELETE' });
    if (res.ok) setItems([]);
  };

  const markdownSummary = useMemo(() => {
    return items
      .map(
        (item) =>
          `#${item.index} [${item.category}] (${item.activeContext || item.url}) — Área ${item.rect.width}x${item.rect.height}px em (${item.rect.x}, ${item.rect.y}):\nCorrigir: ${item.comment}${
            item.elements.length > 0 ? `\nElementos: ${item.elements.map((e) => e.selector).join(', ')}` : ''
          }`
      )
      .join('\n\n');
  }, [items]);

  const handleCopyPrompt = async () => {
    if (!markdownSummary) return;
    try {
      await navigator.clipboard.writeText(markdownSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  const popoverStyle = useMemo<React.CSSProperties>(() => {
    if (!lockedRect || typeof window === 'undefined') return {};
    const panelWidth = Math.min(360, window.innerWidth - 24);
    const fitsRight = lockedRect.x + lockedRect.width + 16 + panelWidth <= window.innerWidth;
    const fitsBelow = lockedRect.y + lockedRect.height + 290 <= window.innerHeight;
    const left = fitsRight
      ? lockedRect.x + lockedRect.width + 12
      : Math.max(12, Math.min(lockedRect.x, window.innerWidth - panelWidth - 12));
    const top = fitsRight
      ? Math.max(12, Math.min(lockedRect.y, window.innerHeight - 310))
      : fitsBelow
        ? lockedRect.y + lockedRect.height + 12
        : Math.max(12, lockedRect.y - 290);
    return { left, top, width: panelWidth };
  }, [lockedRect]);

  return (
    <div data-dev-annotator="true" className="fixed inset-0 pointer-events-none z-[9999] select-none">
      {/* Pinos das marcações já salvas */}
      {showPins &&
        items.map((item) => (
          <div
            key={item.id}
            style={{
              left: item.rect.x,
              top: item.rect.y,
              width: item.rect.width,
              height: item.rect.height,
            }}
            className="fixed border-2 border-[#d9ff3f]/80 bg-[#d9ff3f]/10 rounded-md pointer-events-none"
          >
            <span
              title={item.comment}
              className="pointer-events-auto inline-flex items-center justify-center min-w-6 h-6 px-1.5 -translate-x-2 -translate-y-3 rounded-full bg-[#d9ff3f] text-black font-black text-xs shadow-lg cursor-pointer"
              onClick={() => setDrawerOpen(true)}
            >
              #{item.index}
            </span>
          </div>
        ))}

      {/* Camada de desenho quando em modo de seleção */}
      {selecting && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="fixed inset-0 pointer-events-auto cursor-crosshair bg-black/25 backdrop-blur-[0.5px]"
        >
          <div className="fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[#111827] border border-[#d9ff3f]/70 text-white text-xs font-semibold shadow-2xl flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d9ff3f] animate-pulse" />
            <span>Arraste na tela para selecionar a área (ou clique em um elemento) • ESC cancela</span>
          </div>

          {draftRect && draftRect.width > 4 && draftRect.height > 4 && (
            <div
              style={{
                left: draftRect.x,
                top: draftRect.y,
                width: draftRect.width,
                height: draftRect.height,
              }}
              className="fixed border-2 border-[#d9ff3f] bg-[#d9ff3f]/15 rounded-md shadow-[0_0_0_9999px_rgba(0,0,0,0.2)]"
            >
              <span className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-[#d9ff3f] text-black font-mono font-bold text-[10px]">
                {draftRect.width} × {draftRect.height} px
              </span>
            </div>
          )}
        </div>
      )}

      {/* Retângulo travado + formulário para escrever o que corrigir */}
      {lockedRect && (
        <>
          <div
            style={{
              left: lockedRect.x,
              top: lockedRect.y,
              width: lockedRect.width,
              height: lockedRect.height,
            }}
            className="fixed border-2 border-[#d9ff3f] bg-[#d9ff3f]/15 rounded-md ring-4 ring-[#d9ff3f]/25"
          />

          <div
            style={popoverStyle}
            className="fixed pointer-events-auto rounded-2xl bg-[#0f172a] border border-[#d9ff3f]/50 text-white shadow-2xl p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold text-[#d9ff3f] flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" />
                <span>
                  Área selecionada ({lockedRect.width}×{lockedRect.height}px)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLockedRect(null);
                  setComment('');
                }}
                aria-label="Cancelar marcação"
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {capturedElements.length > 0 && (
              <div className="text-[11px] text-zinc-300 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 truncate">
                Elemento: <span className="text-white font-medium">{capturedElements[0].label || capturedElements[0].selector}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    category === cat
                      ? 'bg-[#d9ff3f] text-black border-[#d9ff3f]'
                      : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  void handleSaveAnnotation();
                }
              }}
              placeholder="Escreva exatamente o que deseja corrigir nesta área..."
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-xs text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#d9ff3f]"
            />

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setLockedRect(null);
                  setSelecting(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refazer área</span>
              </button>

              <button
                type="button"
                onClick={() => void handleSaveAnnotation()}
                disabled={!comment.trim() || saving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#d9ff3f] hover:brightness-95 disabled:opacity-40 text-black text-xs font-black cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Salvando...' : 'Salvar marcação'}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Gaveta com todas as marcações salvas */}
      {drawerOpen && (
        <aside className="fixed right-4 bottom-16 pointer-events-auto w-[360px] max-w-[calc(100vw-2rem)] max-h-[65vh] rounded-2xl bg-[#0f172a] border border-white/15 text-white shadow-2xl flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-white/10 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-white">Marcações para correção ({items.length})</h3>
              <p className="text-[10px] text-zinc-400">Salvas localmente para revisão imediata</p>
            </div>
            <div className="flex items-center gap-1">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-[#d9ff3f]" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              )}
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => void handleClearAll()}
                  title="Limpar todas"
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Fechar lista"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3 overflow-y-auto flex flex-col gap-2.5">
            {items.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-6">
                Clique em &ldquo;Selecionar Área&rdquo; para marcar uma parte da tela e escrever o ajuste desejado.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#d9ff3f]">
                      #{item.index} • {item.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleDeleteOne(item.id)}
                      aria-label={`Remover marcação ${item.index}`}
                      className="text-zinc-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-white leading-snug whitespace-pre-wrap">{item.comment}</p>
                  <span className="text-[10px] text-zinc-400">
                    {item.activeContext} • {item.rect.width}×{item.rect.height}px
                  </span>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* Barra flutuante sempre acessível em localhost dev */}
      <div className="fixed right-4 bottom-4 pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-[#0f172a]/95 border border-white/20 shadow-2xl backdrop-blur-md">
        {statusMessage && (
          <span className="px-2.5 text-[11px] font-bold text-[#d9ff3f]">{statusMessage}</span>
        )}
        <button
          type="button"
          onClick={() => {
            setLockedRect(null);
            setSelecting((prev) => !prev);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
            selecting
              ? 'bg-rose-500 text-white'
              : 'bg-[#d9ff3f] text-black hover:brightness-95'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>{selecting ? 'Cancelar seleção' : 'Selecionar Área'}</span>
        </button>

        <button
          type="button"
          onClick={() => setDrawerOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer"
        >
          <ListTodo className="w-3.5 h-3.5 text-[#d9ff3f]" />
          <span>{items.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowPins((prev) => !prev)}
          title={showPins ? 'Ocultar caixas na tela' : 'Mostrar caixas na tela'}
          className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 cursor-pointer"
        >
          {showPins ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
