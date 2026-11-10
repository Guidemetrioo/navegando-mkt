'use client';
import { todayInSaoPaulo } from '@/lib/date-utils';

import React, { useState } from 'react';
import { useAgenda, AgendaView } from '@/context/AgendaContext';
import { LayoutDashboard, Calendar, Users, UserCheck, MapPin, Building, ShieldCheck, Plus, Sparkles, Camera, Home, FileText, ClipboardList, Receipt, DollarSign, Smartphone, Clock, LogOut } from 'lucide-react';
import { canUserAccessView } from '@/lib/auth-users';
import { NavegandoLogo } from '../brand/NavegandoLogo';

interface AppSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AppSidebar({ isMobileOpen = false, onCloseMobile }: AppSidebarProps = {}) {
  const {
    currentView,
    isDataSaved,
    userRole,
    canManage,
    setCurrentView,
    employees,
    loggedEmployeeId,
    setLoggedEmployeeId,
    deliverables,
    pontos,
    events,
    openNewEventModal,
    openDeliverableModal,
    openPontoModal,
    logout,
  } = useAgenda();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentMember = employees.find((e) => e.id === loggedEmployeeId) || employees[0];

  // Contagens para badges
  const pendingApprovalsCount = deliverables.filter(
    (d) => d.status === 'aguardando_aprovacao'
  ).length;

  const todayIso = todayInSaoPaulo();
  const todayEventsCount = events.filter((e) => e.data === todayIso).length;

  interface NavItem {
    id: AgendaView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }

  interface NavGroup {
    groupTitle: string;
    items: NavItem[];
  }

  const navGroups: NavGroup[] = [
    {
      groupTitle: 'Visão geral',
      items: [
        {
          id: 'home',
          label: 'Meu painel',
          icon: Home,
          badgeColor: 'bg-[var(--ui-accent)]/20 text-[var(--ui-accent)]',
        },
        {
          id: 'dashboard',
          label: 'Indicadores',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      groupTitle: 'Produção',
      items: [
        {
          id: 'mes',
          label: 'Agenda Geral',
          icon: Calendar,
          badge: todayEventsCount > 0 ? `${todayEventsCount} hoje` : undefined,
          badgeColor: 'bg-[var(--ui-accent)]/20 text-[var(--ui-accent)]',
        },
        {
          id: 'escala',
          label: 'Escalas (Auto & CLT)',
          icon: Users,
        },
        {
          id: 'minha-agenda',
          label: 'Minha Escala',
          icon: UserCheck,
        },
        {
          id: 'ponto',
          label: 'Ponto e localização',
          icon: MapPin,
          badgeColor: 'bg-emerald-500/15 text-emerald-400',
        },
        {
          id: 'banco-horas',
          label: 'Banco de Horas',
          icon: Clock,
          badge: '42h',
          badgeColor: 'bg-[#38bdf8]/15 text-[#38bdf8]',
        },
        {
          id: 'relatorios',
          label: 'Relatórios dos Vídeos',
          icon: FileText,
          badgeColor: 'bg-[#38bdf8]/15 text-[#38bdf8]',
        },
        {
          id: 'briefing',
          label: 'Briefing & Roteiros',
          icon: ClipboardList,
          badge: 'Diretrizes',
          badgeColor: 'bg-[var(--ui-accent)]/20 text-[var(--ui-accent)]',
        },
        {
          id: 'reembolsos',
          label: 'Reembolsos',
          icon: Receipt,
          badge: '3 Campos',
          badgeColor: 'bg-emerald-500/20 text-emerald-400',
        },
      ],
    },
    {
      groupTitle: 'Relacionamento',
      items: [
        {
          id: 'clientes',
          label: 'Restaurantes',
          icon: Building,
        },
      ],
    },
    ...(canManage
      ? [
          {
            groupTitle: 'Gestão Executiva',
            items: [
              {
                id: 'financeiro' as AgendaView,
                label: 'Controle Financeiro',
                icon: DollarSign,
                badgeColor: 'bg-amber-500/20 text-amber-400',
              },
              {
                id: 'whatsapp' as AgendaView,
                label: 'WhatsApp & Bot',
                icon: Smartphone,
                badge: 'Automação',
                badgeColor: 'bg-emerald-500/20 text-emerald-400',
              },
            ],
          },
        ]
      : []),
    {
      groupTitle: 'Sistema',
      items: [
        {
          id: 'backups',
          label: 'Backup',
          icon: ShieldCheck,
          badge: isDataSaved ? 'Salvo' : 'Salvando...',
          badgeColor: 'bg-emerald-500/15 text-emerald-400',
        },
      ],
    },
  ];

  const orderedGroups: { groupTitle: string; ids: AgendaView[] }[] = [
    { groupTitle: 'Visão geral', ids: ['home', 'dashboard'] },
    { groupTitle: 'Produção', ids: ['mes', 'escala', 'minha-agenda', 'ponto', 'banco-horas', 'relatorios', 'briefing'] },
    { groupTitle: 'Gestão', ids: ['reembolsos', 'financeiro', 'clientes', 'whatsapp'] },
    { groupTitle: 'Sistema', ids: ['backups'] },
  ];
  const controlGroups: NavGroup[] = orderedGroups.map(group => ({
    groupTitle: group.groupTitle,
    items: group.ids.flatMap(id => navGroups.flatMap(g => g.items).filter(item => item.id === id))
      .map(item => ({ ...item, badge: ['briefing', 'reembolsos'].includes(item.id) ? undefined : item.badge })),
  }));

  return (
    <>
      {/* Backdrop Mobile */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
        />
      )}

      <aside
        id="workspace-navigation"
        role={isMobileOpen ? 'dialog' : undefined}
        aria-label={isMobileOpen ? 'Menu do sistema' : undefined}
        aria-modal={isMobileOpen || undefined}
        data-collapsed={isCollapsed}
        data-mobile-open={isMobileOpen}
        className={`crm-sidebar fixed inset-y-0 left-0 lg:sticky lg:top-0 h-screen flex flex-col justify-between bg-[var(--ui-surface)] border-r border-[var(--ui-border)] transition-all duration-300 z-50 lg:z-30 shrink-0 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64 xl:w-72'
        } w-72 ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* 1. TOPO: Branding da Agência Navegando MKT */}
        <div className="p-4 border-b border-[var(--ui-border)] flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex flex-col gap-1 min-w-0">
              <NavegandoLogo variant="horizontal" size="md" showTagline withGlow={false} />
              {currentMember?.funcao === 'modelo' && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] border border-[var(--ui-accent)]/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    #influencer gastronômica
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="mx-auto">
              <NavegandoLogo variant="symbol" size="sm" withGlow={false} />
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-xl text-zinc-400 hover:text-foreground hover:bg-[var(--ui-raised)] transition-colors cursor-pointer"
              title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
             data-text-action="true"><span className="text-action-label">{isCollapsed ? 'Expandir' : 'Recolher'}</span></button>
            {onCloseMobile && (
              <button
                id="close-workspace-navigation"
                type="button"
                onClick={onCloseMobile}
                className="flex lg:hidden p-1.5 rounded-xl text-zinc-400 hover:text-foreground hover:bg-[var(--ui-raised)] transition-colors cursor-pointer"
                title="Fechar menu"
               data-text-action="true"><span className="text-action-label">{"Fechar"}</span></button>
            )}
          </div>
        </div>

      {/* 2. BOTÃO DE AÇÃO RÁPIDA PRINCIPAL */}
      <div className="control-sidebar-quick p-3 border-b border-[var(--ui-border)]/60">
        {!isCollapsed ? (
          userRole!=='admin' ? (
            <button
              type="button"
              onClick={() => {
                openPontoModal();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-xl gradient-cta active:scale-95 text-foreground font-extrabold text-xs shadow-lg shadow-[var(--ui-accent)]/25 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-foreground" />
              <span>Bater Ponto no Restaurante</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  openNewEventModal();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl gradient-cta active:scale-95 text-foreground font-bold text-xs shadow-md shadow-[var(--ui-accent)]/25 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Gravação</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  openPontoModal();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[var(--ui-raised)] hover:bg-[var(--ui-hover)] active:scale-95 text-zinc-200 border border-[var(--ui-border)] font-bold text-xs transition-all hover:text-foreground cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>Ponto</span>
              </button>
            </div>
          )
        ) : (
          <button
            type="button"
            onClick={() => (userRole!=='admin' ? openPontoModal() : openNewEventModal())}
            className="w-10 h-10 mx-auto rounded-xl brand-solid bg-[var(--ui-accent)] text-foreground flex items-center justify-center shadow-md cursor-pointer"
            title={userRole!=='admin' ? 'Bater Ponto' : 'Nova Gravação'}
           data-text-action="true"><span className="text-action-label">{userRole !== 'admin' ? 'Ponto' : 'Criar'}</span></button>
        )}
      </div>

      {/* 3. NAVEGAÇÃO AGRUPADA COM CONTROLE RIGOROSO DE ACESSO */}
      <nav aria-label="Navegação principal" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 space-y-1.5 custom-scrollbar">
        {controlGroups.map((group) => {
          const accessibleItems = group.items.filter((item) =>
            canUserAccessView(currentMember?.funcao, item.id)
          );
          if (accessibleItems.length === 0) return null;

          return (
            <div key={group.groupTitle} className="space-y-1">
              {!isCollapsed && (
                <div className="hidden">
              {/* Sem títulos de categorias: apenas botões diretos na barra */}
                </div>
              )}
              {accessibleItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  currentView === item.id ||
                  (item.id === 'mes' && (currentView === 'semana' || currentView === 'mes'));

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCurrentView(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] font-bold border border-[var(--ui-accent)]/30 shadow-[0_0_15px_rgba(255,102,0,0.15)]'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                    } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                    aria-current={isActive ? 'page' : undefined}
                    title={item.label}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--ui-accent)] drop-shadow-[0_0_8px_rgba(255,102,0,0.5)]' : 'text-zinc-400'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          item.badgeColor || 'bg-[var(--ui-border)] text-zinc-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* 4. RODAPÉ: BOTÃO DE SAIR */}
      <div className="p-3 border-t border-[var(--ui-border)] bg-[var(--ui-page)]">
        <button
          type="button"
          onClick={logout}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs transition-all cursor-pointer ${
            isCollapsed ? 'justify-center' : 'justify-center'
          }`}
          title="Sair da conta"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
