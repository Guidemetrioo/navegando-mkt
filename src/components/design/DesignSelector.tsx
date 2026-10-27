'use client';

import { useEffect, useId, useRef, useSyncExternalStore } from 'react';
import { Check, ChevronDown, Sun, Moon, X } from 'lucide-react';

const storageKey = 'navegando-design';
const designs = [
  { id: 'editorial', name: 'Claro', subtitle: 'Editorial · leitura e organização', description: 'Tema claro com superfícies leves, tons quentes e mais respiro para acompanhar os detalhes.' },
  { id: 'operations', name: 'Escuro', subtitle: 'Operacional · informação e agilidade', description: 'Tema escuro em grafite, com layout compacto e mais informação visível na mesma tela.' },
] as const;
type Design = typeof designs[number]['id'];
let current: Design = 'operations';
const listeners = new Set<() => void>();
function isDesign(value: string | null): value is Design {
  return designs.some((design) => design.id === value);
}
function publish(value: Design) {
  current = value;
  document.documentElement.dataset.design = value;
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function DesignAppearance() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const next = isDesign(saved) ? saved : 'operations';
      publish(next);
      if (saved !== next) localStorage.setItem(storageKey, next);
    } catch { publish('operations'); }
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) {
        publish(isDesign(event.newValue) ? event.newValue : 'operations');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return null;
}

export function DesignSelector() {
  const design = useSyncExternalStore(subscribe, () => current, () => 'operations');
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const selected = designs.find((item) => item.id === design)!;
  const choose = (value: Design) => {
    publish(value);
    try { localStorage.setItem(storageKey, value); } catch { /* Keep the selection for this session. */ }
    panel.current?.hidePopover();
  };
  return (
    <div className="design-selector">
      <button type="button" className="design-trigger" popoverTarget={id} aria-label={`Escolher tema. Atual: ${selected.name}`}>
        {design === 'editorial' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        <span className="design-trigger-label">Tema</span>
        <span className="design-current">{selected.name}</span>
        <ChevronDown size={12} aria-hidden="true" />
      </button>
      <div ref={panel} id={id} popover="auto" className="design-panel" aria-label="Escolha o tema do CRM">
        <div className="design-panel-heading">
          <div><p>Aparência do sistema</p><span>Escolha entre o tema claro e o escuro.</span></div>
          <button type="button" popoverTarget={id} popoverTargetAction="hide" aria-label="Fechar seletor de tema"><X size={17} /></button>
        </div>
        <div className="design-options" role="group" aria-label="Opções de tema">
          {designs.map((item) => (
            <button key={item.id} type="button" className="design-option" aria-pressed={design === item.id} onClick={() => choose(item.id)}>
              <span className={`design-preview design-preview-${item.id}`} aria-hidden="true"><i /><span><b /><em /><em /></span></span>
              <span className="design-option-copy"><strong>{item.name}</strong><span>{item.subtitle}</span></span>
              <span className="design-check" aria-hidden="true">{design === item.id && <Check size={14} />}</span>
            </button>
          ))}
        </div>
        <p className="design-description" aria-live="polite">{selected.description}</p>
        <div className="design-panel-footer">Sua escolha fica salva neste navegador.</div>
      </div>
    </div>
  );
}
