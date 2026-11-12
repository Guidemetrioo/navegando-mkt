'use client';
import { useAgenda, type AgendaView } from '@/context/AgendaContext';
import { canUserAccessView } from '@/lib/auth-users';

export function MobileBottomNav({ onOpenMenu, menuOpen }: { onOpenMenu: () => void; menuOpen: boolean }) {
  const { currentView, setCurrentView, canManage, employees, loggedEmployeeId } = useAgenda();
  const role = employees.find(employee => employee.id === loggedEmployeeId)?.funcao;
  const agendaView = canManage ? 'mes' : 'minha-agenda';
  const shortcuts: { view: AgendaView; label: string; active: boolean }[] = [
    { view: 'relatorios', label: 'Relatórios', active: currentView === 'relatorios' },
    { view: agendaView, label: 'Agenda', active: ['mes', 'semana', 'escala', 'minha-agenda'].includes(currentView) },
    { view: 'ponto', label: 'Ponto', active: currentView === 'ponto' },
    { view: 'reembolsos', label: 'Reembolsos', active: currentView === 'reembolsos' },
  ];
  const allowed = shortcuts.filter(item => canUserAccessView(role, item.view));

  return (
    <nav aria-label="Navegação no celular" className="text-mobile-nav lg:hidden" inert={menuOpen}>
      {allowed.map(item => (
        <button key={item.view} type="button" aria-current={item.active ? 'page' : undefined} onClick={() => setCurrentView(item.view)}>
          {item.label}
        </button>
      ))}
      <button type="button" aria-controls="workspace-navigation" aria-expanded={menuOpen} onClick={onOpenMenu}>Menu</button>
    </nav>
  );
}
