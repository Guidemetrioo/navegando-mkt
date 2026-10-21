'use client';

import React, { useState } from 'react';
import { useAgenda, AgendaView } from '@/context/AgendaContext';
import { EmployeeBadge } from '../agenda/EmployeeBadge';
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  MapPin,
  FolderOpen,
  Building,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  CheckCircle2,
  Sparkles,
  Camera,
  X,
  LogOut,
  Home,
  FileText,
} from 'lucide-react';
import { canUserAccessView } from '@/lib/auth-users';

interface AppSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AppSidebar({ isMobileOpen = false, onCloseMobile }: AppSidebarProps = {}) {
  const {
    currentView,
    setCurrentView,
    employees,
    loggedEmployeeId,
    setLoggedEmployeeId,
    theme,
    toggleTheme,
    deliverables,
    pontos,
    events,
    isDataSaved,
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

  const todayIso = '2026-10-14';
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
      groupTitle: 'Central Pessoal & Liderança',
      items: [
        {
          id: 'home',
          label: 'Início (Meu Painel)',
          icon: Sparkles,
          badge: 'Prioridades',
          badgeColor: 'bg-[#FF5A3C]/20 text-[#FF5A3C]',
        },
        {
          id: 'dashboard',
          label: 'Dashboard Executivo',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      groupTitle: 'Produção & Campo',
      items: [
        {
          id: 'mes',
          label: 'Agenda Geral',
          icon: Calendar,
          badge: todayEventsCount > 0 ? `${todayEventsCount} hoje` : undefined,
          badgeColor: 'bg-[#FF5A3C]/20 text-[#FF5A3C]',
        },
        {
          id: 'escala',
          label: 'Escala por Duplas',
          icon: Users,
        },
        {
          id: 'minha-agenda',
          label: 'Minha Escala',
          icon: UserCheck,
        },
        {
          id: 'ponto',
          label: 'Ponto & GPS Real',
          icon: MapPin,
          badge: 'GPS Ao Vivo',
          badgeColor: 'bg-emerald-500/15 text-emerald-400',
        },
        {
          id: 'relatorios',
          label: 'Relatórios dos Vídeos',
          icon: FileText,
          badge: 'Campo',
          badgeColor: 'bg-[#38bdf8]/15 text-[#38bdf8]',
        },
      ],
    },
    {
      groupTitle: 'Arquivos & Clientes (DAM)',
      items: [
        {
          id: 'arquivos',
          label: 'Central de Arquivos',
          icon: FolderOpen,
          badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} pend.` : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-400',
        },
        {
          id: 'clientes',
          label: 'Restaurantes Parceiros',
          icon: Building,
        },
      ],
    },
    {
      groupTitle: 'Redes Sociais & Métricas',
      items: [
        {
          id: 'metricas-reels',
          label: 'Analytics de Reels',
          icon: TrendingUp,
        },
        {
          id: 'mural-ugc',
          label: 'Mural UGC & Menções',
          icon: MessageSquare,
        },
      ],
    },
    {
      groupTitle: 'Dados & Segurança',
      items: [
        {
          id: 'backups',
          label: 'Segurança & Backup',
          icon: ShieldCheck,
          badge: isDataSaved ? 'Salvo' : 'Salvando...',
          badgeColor: 'bg-emerald-500/15 text-emerald-400',
        },
      ],
    },
  ];

  return (
    <>
      {/* Backdrop Mobile */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 md:sticky md:top-0 h-screen flex flex-col justify-between bg-[#111215] dark:bg-[#111215] bg-white border-r border-[#26282f] dark:border-[#26282f] border-slate-200 transition-all duration-300 z-50 md:z-30 shrink-0 ${
          isCollapsed ? 'md:w-20' : 'md:w-64 lg:md:w-72'
        } w-72 ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* 1. TOPO: Branding da Agência */}
        <div className="p-4 border-b border-[#26282f] dark:border-[#26282f] border-slate-200 flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF5A3C] via-[#e04a2f] to-[#b32b15] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[#FF5A3C]/25 shrink-0">
                N
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-black tracking-wider text-sm text-white dark:text-white text-zinc-900 truncate">
                    NAVEGANDO
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#FF5A3C]/15 text-[#FF5A3C] border border-[#FF5A3C]/30">
                    MKT
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 truncate">
                  Central de Gestão Social Media
                </p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 mx-auto rounded-2xl bg-[#FF5A3C] flex items-center justify-center text-white font-black text-lg">
              N
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1f2026] transition-colors cursor-pointer"
              title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="flex md:hidden p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1f2026] transition-colors cursor-pointer"
                title="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

      {/* 2. BOTÃO DE AÇÃO RÁPIDA PRINCIPAL */}
      <div className="p-3 border-b border-[#26282f]/60">
        {!isCollapsed ? (
          currentMember?.funcao === 'modelo' ? (
            <button
              type="button"
              onClick={() => {
                openPontoModal();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] active:scale-95 text-black font-bold text-xs shadow-md shadow-[#38bdf8]/20 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-black" />
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
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#FF5A3C] hover:bg-[#e04a2f] active:scale-95 text-white font-bold text-xs shadow-md shadow-[#FF5A3C]/20 transition-all cursor-pointer"
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
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#1c1d22] hover:bg-[#282a32] active:scale-95 text-zinc-200 border border-[#2b2d35] font-bold text-xs transition-all hover:text-white cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>Ponto</span>
              </button>
            </div>
          )
        ) : (
          <button
            type="button"
            onClick={() => (currentMember?.funcao === 'modelo' ? openPontoModal() : openNewEventModal())}
            className="w-10 h-10 mx-auto rounded-xl bg-[#FF5A3C] text-white flex items-center justify-center shadow-md cursor-pointer"
            title={currentMember?.funcao === 'modelo' ? 'Bater Ponto' : 'Nova Gravação'}
          >
            {currentMember?.funcao === 'modelo' ? <Camera className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* 3. NAVEGAÇÃO AGRUPADA COM CONTROLE RIGOROSO DE ACESSO */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
        {navGroups.map((group) => {
          const accessibleItems = group.items.filter((item) =>
            canUserAccessView(currentMember?.funcao, item.id)
          );
          if (accessibleItems.length === 0) return null;

          return (
            <div key={group.groupTitle} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {group.groupTitle}
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
                        ? 'bg-[#FF5A3C]/10 text-[#FF5A3C] font-bold border border-[#FF5A3C]/20 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1b20]'
                    } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                    title={item.label}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#FF5A3C]' : 'text-zinc-400'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          item.badgeColor || 'bg-[#26282f] text-zinc-300'
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

      {/* 4. RODAPÉ: MEMBRO LOGADO & CONTROLE DE TEMA */}
      <div className="p-3 border-t border-[#26282f] dark:border-[#26282f] border-slate-200 bg-[#0e0f12] dark:bg-[#0e0f12] bg-slate-50 flex flex-col gap-2">
        {!isCollapsed ? (
          <>
            {/* Seletor de Membro Atual */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#16171b] border border-[#26282f]">
              <div className="flex items-center gap-2 min-w-0">
                <EmployeeBadge employee={currentMember} size="sm" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {currentMember.nome}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    {currentMember.funcao === 'filmmaker' ? '🎥 Filmmaker' : '✨ Criadora'}
                  </div>
                </div>
              </div>

              <select
                value={loggedEmployeeId}
                onChange={(e) => setLoggedEmployeeId(e.target.value)}
                className="text-[10px] bg-[#1f2026] text-zinc-300 border border-[#2b2d35] rounded-lg px-1.5 py-1 focus:outline-none cursor-pointer"
                title="Trocar membro logado"
              >
                <optgroup label="Filmmakers">
                  {employees
                    .filter((e) => e.funcao === 'filmmaker')
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nome}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Criadoras">
                  {employees
                    .filter((e) => e.funcao === 'criadora')
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nome}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            {/* Status de Segurança e Toggle de Tema */}
            <div className="flex items-center justify-between px-1 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Base 100% Salva</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-1 rounded-lg hover:bg-[#26282f] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1 rounded-lg hover:bg-rose-500/15 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Sair / Trocar de Ponto"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <EmployeeBadge employee={currentMember} size="sm" />
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-[#26282f] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-xl hover:bg-rose-500/15 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Sair / Trocar Ponto"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
