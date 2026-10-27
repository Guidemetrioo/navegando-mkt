'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAgenda, AgendaView } from '@/context/AgendaContext';
import {
  Search,
  Building,
  Calendar,
  FolderOpen,
  Users,
  Sparkles,
  MapPin,
  Plus,
  ArrowRight,
  Clock,
  X,
  ExternalLink,
  ShieldCheck,
  Moon,
  Sun,
  LayoutDashboard,
} from 'lucide-react';
import { EmployeeBadge } from '../agenda/EmployeeBadge';

interface PaletteItem {
  id: string;
  category?: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  badge?: string;
  badgeColor?: string;
  action: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPaletteModal({ isOpen, onClose }: CommandPaletteModalProps) {
  const {
    clients,
    events,
    deliverables,
    employees,
    setCurrentView,
    openNewEventModal,
    openDeliverableModal,
    openClientModal,
    openPontoModal,
    openDayDetailModal,
    openEditEventModal,
    openEditDeliverableModal,
    toggleTheme,
    theme,
  } = useAgenda();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Foco no input ao abrir
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the command palette on its externally controlled opening.
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Tecla ESC para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Ações rápidas fixas
  const quickActions: PaletteItem[] = useMemo(() => [
    {
      id: 'action-new-event',
      title: 'Agendar Nova Gravação',
      subtitle: 'Escalar dupla e horário no restaurante',
      icon: Plus,
      iconColor: 'text-[var(--ui-accent)]',
      action: () => {
        onClose();
        openNewEventModal();
      },
    },
    {
      id: 'action-new-deliverable',
      title: 'Subir Novo Entregável / Reel',
      subtitle: 'Cadastrar link de Drive ou vídeo para aprovação',
      icon: FolderOpen,
      iconColor: 'text-[#38bdf8]',
      action: () => {
        onClose();
        openDeliverableModal();
      },
    },
    {
      id: 'action-new-client',
      title: 'Cadastrar Novo Restaurante Parceiro',
      subtitle: 'Adicionar dados do cliente ao CRM',
      icon: Building,
      iconColor: 'text-amber-400',
      action: () => {
        onClose();
        openClientModal();
      },
    },
    {
      id: 'action-ponto',
      title: 'Registrar Ponto Eletrônico & GPS',
      subtitle: 'Check-in presencial com foto e satélite',
      icon: MapPin,
      iconColor: 'text-emerald-400',
      action: () => {
        onClose();
        openPontoModal();
      },
    },
    {
      id: 'action-toggle-theme',
      title: theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro',
      subtitle: 'Ajustar contraste da interface',
      icon: theme === 'dark' ? Sun : Moon,
      iconColor: 'text-zinc-300',
      action: () => {
        toggleTheme();
        onClose();
      },
    },
  ], [onClose, openNewEventModal, openDeliverableModal, openClientModal, openPontoModal, toggleTheme, theme]);

  // Resultados pesquisados
  const results: PaletteItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return quickActions.slice(0, 4);
    }

    const items: PaletteItem[] = [];

    // 1. Clientes / Restaurantes
    clients.forEach((c) => {
      if (
        c.nome.toLowerCase().includes(q) ||
        (c.instagram_handle && c.instagram_handle.toLowerCase().includes(q)) ||
        (c.endereco && c.endereco.toLowerCase().includes(q)) ||
        (c.responsavel && c.responsavel.toLowerCase().includes(q))
      ) {
        items.push({
          id: `client-${c.id}`,
          category: 'Restaurantes Parceiros',
          title: c.nome,
          subtitle: `${c.instagram_handle || ''} • ${c.responsavel || c.endereco?.split('-')[0] || 'São Paulo'}`,
          icon: Building,
          iconColor: 'text-[var(--ui-accent)]',
          badge: c.plano?.split('(')[0] || 'Gastro Pro',
          badgeColor: 'bg-[var(--ui-accent)]/10 text-[var(--ui-accent)] border border-[var(--ui-accent)]/20',
          action: () => {
            onClose();
            setCurrentView('clientes');
          },
        });
      }
    });

    // 2. Gravações na Agenda
    events.forEach((ev) => {
      const clientName = ev.client?.nome || '';
      if (
        clientName.toLowerCase().includes(q) ||
        (ev.local && ev.local.toLowerCase().includes(q)) ||
        (ev.observacoes && ev.observacoes.toLowerCase().includes(q)) ||
        ev.data.includes(q)
      ) {
        items.push({
          id: `event-${ev.id}`,
          category: 'Gravações na Agenda',
          title: `${clientName} (${ev.tipo.toUpperCase()})`,
          subtitle: `Data: ${ev.data} às ${ev.hora_inicio} • ${ev.local || 'No Restaurante'}`,
          icon: Calendar,
          iconColor: 'text-purple-400',
          badge: ev.status,
          badgeColor: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
          action: () => {
            onClose();
            openEditEventModal(ev);
          },
        });
      }
    });

    // 3. Entregáveis / Reels no DAM
    deliverables.forEach((d) => {
      const clientName = d.client?.nome || '';
      if (
        d.titulo.toLowerCase().includes(q) ||
        clientName.toLowerCase().includes(q) ||
        (d.descricao && d.descricao.toLowerCase().includes(q))
      ) {
        items.push({
          id: `deliv-${d.id}`,
          category: 'Central de Arquivos & Reels',
          title: d.titulo,
          subtitle: `${clientName} • Formato: ${d.formato} (v${d.versao})`,
          icon: FolderOpen,
          iconColor: 'text-[#38bdf8]',
          badge: d.status.replace('_', ' '),
          badgeColor: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
          action: () => {
            onClose();
            openEditDeliverableModal(d);
          },
        });
      }
    });

    // 4. Membros da Equipe
    employees.forEach((emp) => {
      if (emp.nome.toLowerCase().includes(q) || (emp.funcao && emp.funcao.toLowerCase().includes(q))) {
        items.push({
          id: `emp-${emp.id}`,
          category: 'Equipe da Agência',
          title: emp.nome,
          subtitle: emp.funcao === 'filmmaker' ? 'Filmmaker / Câmera' : emp.funcao === 'criadora' ? 'Apresentadora / Vídeos' : 'Gestão',
          icon: Users,
          iconColor: 'text-emerald-400',
          badge: emp.funcao || 'Equipe',
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          action: () => {
            onClose();
            setCurrentView('escala');
          },
        });
      }
    });

    // 5. Ações rápidas que combinam
    quickActions.forEach((qa) => {
      if (qa.title.toLowerCase().includes(q) || qa.subtitle.toLowerCase().includes(q)) {
        items.push({
          id: qa.id,
          category: 'Ações do Sistema',
          title: qa.title,
          subtitle: qa.subtitle,
          icon: qa.icon,
          iconColor: qa.iconColor,
          action: qa.action,
        });
      }
    });

    return items;
  }, [
    query,
    clients,
    events,
    deliverables,
    employees,
    quickActions,
    onClose,
    setCurrentView,
    openEditEventModal,
    openEditDeliverableModal,
  ]);

  // Navegação pelo teclado
  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-3 sm:px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDownList}
      >
        {/* Input de Busca */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-[var(--ui-border)] bg-[var(--ui-surface)]">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buscar restaurantes, gravações, reels, equipe ou comandos..."
            className="w-full bg-transparent text-sm sm:text-base text-foreground placeholder-zinc-500 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-zinc-400 hover:text-foreground hover:bg-[var(--ui-border)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-zinc-400 bg-[var(--ui-hover)] border border-[var(--ui-border)] rounded-md">
              ESC
            </kbd>
          )}
        </div>

        {/* Lista de Resultados */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-[var(--ui-border)]/30">
          {results.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-zinc-400">
              <Search className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
              <p className="text-xs">Nenhum resultado encontrado para &quot;{query}&quot;</p>
              <span className="text-[11px] text-zinc-400">
                Tente buscar pelo nome do restaurante, data ou formato de vídeo.
              </span>
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--ui-hover)] text-foreground shadow-sm'
                      : 'text-zinc-300 hover:bg-[var(--ui-raised)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[var(--ui-accent)]/20' : 'bg-[var(--ui-raised)]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${item.iconColor || 'text-zinc-300'}`} />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold truncate text-foreground">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase shrink-0 ${
                              item.badgeColor || 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 truncate">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${
                      isSelected ? 'translate-x-0.5 text-[var(--ui-accent)]' : 'opacity-0'
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé de Dicas */}
        <div className="px-4 py-2.5 bg-[var(--ui-surface)] border-t border-[var(--ui-border)] flex items-center justify-between text-[10px] text-zinc-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-[var(--ui-raised)] rounded text-zinc-400 font-mono">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-[var(--ui-raised)] rounded text-zinc-400 font-mono">↓</kbd> Navegar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-[var(--ui-raised)] rounded text-zinc-400 font-mono">ENTER</kbd> Abrir
            </span>
          </div>

          <span className="hidden sm:inline">Navegando MKT • Sistema Integrado</span>
        </div>
      </div>
    </div>
  );
}
