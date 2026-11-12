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
    <nav
      aria-label="Navegação no celular"
      className="text-mobile-nav lg:hidden"
      style={{ backgroundColor: '#101f2c', color: '#eef7fa', borderTop: '1px solid #244052' }}
      inert={menuOpen}
    >
      {allowed.map(item => (
        <button
          key={item.view}
          type="button"
          aria-current={item.active ? 'page' : undefined}
          onClick={() => setCurrentView(item.view)}
          style={{
            backgroundColor: item.active ? '#182b3a' : 'transparent',
            color: item.active ? '#55c4d5' : '#eef7fa',
            WebkitTextFillColor: item.active ? '#55c4d5' : '#eef7fa',
          }}
        >
          {item.label}
        </button>
      ))}
      <button
        type="button"
        aria-controls="workspace-navigation"
        aria-expanded={menuOpen}
        onClick={onOpenMenu}
        style={{
          backgroundColor: menuOpen ? '#182b3a' : 'transparent',
          color: menuOpen ? '#55c4d5' : '#eef7fa',
          WebkitTextFillColor: menuOpen ? '#55c4d5' : '#eef7fa',
        }}
      >
        Menu
      </button>
    </nav>
  );
}
