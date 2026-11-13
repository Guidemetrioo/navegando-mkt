'use client';

import { useAgenda } from '@/context/AgendaContext';
import { todayInSaoPaulo } from '@/lib/date-utils';
import { canUserAccessView } from '@/lib/auth-users';
import { CalendarDays, Users, Receipt, FileText, ArrowRight, Plus, Check, Clock } from 'lucide-react';

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const time = (value: string) => new Date(value).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });

export function ControlCenterDashboard() {
  const { employees, clients, events, pontos, allDespesasGravacao, transacoes, loggedEmployeeId,
    canManage, setCurrentView, openNewEventModal, openPontoModal, openEditEventModal } = useAgenda();
  const member = employees.find(e => e.id === loggedEmployeeId);
  if (!member) return <p className="cc-empty" role="status">Carregando seu painel…</p>;
  const today = todayInSaoPaulo();
  const visibleEvents = events.filter(e => canManage || e.assigned_employee_ids?.includes(member.id));
  const todayEvents = visibleEvents.filter(e => e.data === today && e.status !== 'cancelado').sort((a,b) => a.hora_inicio.localeCompare(b.hora_inicio));
  const todayPoints = pontos.filter(p => todayInSaoPaulo(new Date(p.data_hora)) === today);
  const peoplePresent = new Set(todayPoints.filter(p => p.tipo === 'entrada').map(p => p.employee_id)).size;
  const pending = allDespesasGravacao.filter(d => d.status === 'pendente');
  const weekStart = new Date(`${today}T12:00:00-03:00`);
  const weekday = weekStart.getUTCDay();
  weekStart.setUTCDate(weekStart.getUTCDate() - (weekday === 0 ? 6 : weekday - 1));
  const start = todayInSaoPaulo(weekStart);
  const weekEnd = new Date(weekStart); weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const end = todayInSaoPaulo(weekEnd);
  const weekEvents = visibleEvents.filter(e => e.data >= start && e.data <= end && e.status !== 'cancelado');
  const completed = weekEvents.filter(e => e.status === 'realizado').length;
  const percentage = weekEvents.length ? Math.round(completed / weekEvents.length * 100) : 0;
  const reports = weekEvents.filter(e => e.relatorio_filmmaker?.preenchido).length;
  const allRecordingEvents = events.filter(e => e.status !== 'cancelado' && (e.tipo === 'gravacao' || e.tipo === 'foto' || e.tipo === 'edicao'));
  const totalBriefingsVideoDone = allRecordingEvents.filter(e => Boolean(e.briefing_gravacao && e.briefing_gravacao.trim().length > 0)).length;
  const totalBriefingsEdicaoDone = allRecordingEvents.filter(e => Boolean(e.briefing_edicao && e.briefing_edicao.trim().length > 0)).length;
  const totalBriefingsPending = Math.max(0, allRecordingEvents.length - totalBriefingsVideoDone);
  const clientName = (id: string) => clients.find(c => c.id === id)?.nome || 'Restaurante';
  const employeeName = (id: string) => employees.find(e => e.id === id)?.nome || 'Colaborador';
  const dateLabel = new Date(`${today}T12:00:00-03:00`).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: 'long' });
  const activities = [
    ...pontos.slice().sort((a,b) => b.data_hora.localeCompare(a.data_hora)).slice(0,3).map(p => ({ id: `p-${p.id}`, title: `Ponto de ${p.tipo === 'almoco' ? 'intervalo' : p.tipo} registrado`, sub: employeeName(p.employee_id), at: p.data_hora, view: 'ponto' as const, kind: 'point' })),
    ...allDespesasGravacao.slice().sort((a,b) => b.created_at.localeCompare(a.created_at)).slice(0,3).map(d => ({ id: `d-${d.id}`, title: d.status === 'pendente' ? 'Reembolso para análise' : 'Solicitação de reembolso', sub: `${d.employee_nome} · ${money(d.valor)}`, at: d.created_at, view: 'reembolsos' as const, kind: 'expense' })),
    ...visibleEvents.filter(e => e.relatorio_filmmaker?.preenchido && e.relatorio_filmmaker.preenchido_em).map(e => ({ id: `r-${e.id}`, title: 'Relatório de gravação enviado', sub: clientName(e.client_id), at: e.relatorio_filmmaker!.preenchido_em!, view: 'relatorios' as const, kind: 'report' })),
  ].filter(a => canUserAccessView(member.funcao, a.view)).sort((a,b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0,4);
  const month = today.slice(0,7);
  const expenses = transacoes.filter(t => t.tipo === 'despesa' && t.status !== 'cancelado' && t.data_vencimento.startsWith(month)).reduce((sum,t) => sum + t.valor, 0);
  const outstanding = allDespesasGravacao.filter(d => d.status === 'pendente' || d.status === 'aprovado').reduce((sum,d) => sum + d.valor, 0);
  const stats = [
    { label: canManage ? 'Gravações hoje' : 'Minhas gravações hoje', value: todayEvents.length, note: `Em ${new Set(todayEvents.map(e => e.client_id)).size} restaurantes`, Icon: CalendarDays, tone: 'cyan' },
    { label: canManage ? 'Equipe com entrada hoje' : 'Meus pontos hoje', value: canManage ? peoplePresent : todayPoints.length, note: canManage ? 'Colaboradores com entrada registrada' : 'Batidas registradas no dia', Icon: Users, tone: 'green' },
    { label: 'Reembolsos', value: pending.length, note: 'Aguardando análise', Icon: Receipt, tone: 'amber' },
    { label: canManage ? 'Performance Briefings' : 'Relatórios da semana', value: canManage ? totalBriefingsVideoDone : reports, note: canManage ? `${totalBriefingsVideoDone} feitos · ${totalBriefingsPending} pendentes` : 'Gravações com relatório preenchido', Icon: FileText, tone: 'blue' },
  ];
  return <div className="cc-dashboard">
    <section className="cc-welcome"><div><p className="cc-eyebrow">{dateLabel}</p><h1>Olá, {member.nome.split(' ')[0]}</h1><p className="cc-subtitle">{canManage ? 'A visão de hoje para acompanhar o trabalho da agência.' : 'Seus compromissos e registros em um só lugar.'}</p></div>
      <button className="cc-primary" onClick={() => canManage ? openNewEventModal() : openPontoModal()}><Plus size={15} />{canManage ? 'Nova gravação' : 'Registrar ponto'}</button>
    </section>
    <section className="cc-stats" aria-label="Resumo da operação">{stats.map(({label,value,note,Icon,tone}) => <article className="cc-card cc-stat" key={label}><div className="cc-stat-label"><span>{label}</span><Icon size={15} className={`cc-tone-${tone}`} /></div><strong>{String(value).padStart(2,'0')}</strong><span className="cc-stat-note">{note}</span></article>)}</section>
    <div className="cc-main-grid">
      <section className="cc-card"><div className="cc-card-heading"><h2>Agenda de hoje</h2><button className="cc-link" onClick={() => setCurrentView(canManage ? 'mes' : 'minha-agenda')}>Ver agenda <ArrowRight size={13}/></button></div>
        {todayEvents.length ? todayEvents.slice(0,4).map(event => <button className="cc-agenda-row" key={event.id} onClick={() => canManage ? openEditEventModal(event) : setCurrentView('minha-agenda')}><time>{event.hora_inicio.slice(0,5)}</time><span className="cc-event-copy"><strong>{event.tipo === 'gravacao' ? 'Captação' : 'Compromisso'} · {clientName(event.client_id)}</strong><small>{event.assigned_employee_ids?.map(employeeName).join(' · ') || 'Equipe a definir'}</small></span><span className={`cc-badge ${event.status === 'realizado' ? 'cc-badge-green' : 'cc-badge-blue'}`}>{event.status === 'realizado' ? 'Realizada' : event.status === 'confirmado' ? 'Confirmada' : 'Agendada'}</span></button>) : <p className="cc-empty">Nenhum compromisso programado para hoje.</p>}
      </section>
      <section className="cc-card"><div className="cc-card-heading"><h2>Atividade recente</h2></div><div className="cc-activities">{activities.length ? activities.map(a => <button key={a.id} className="cc-activity" onClick={() => setCurrentView(a.view)}><span className={`cc-activity-icon cc-tone-${a.kind === 'point' ? 'green' : a.kind === 'expense' ? 'amber' : 'blue'}`}>{a.kind === 'point' ? <Check size={14}/> : a.kind === 'expense' ? <Receipt size={14}/> : <FileText size={14}/>}</span><span><strong>{a.title}</strong><small>{a.sub}</small><time>{new Date(a.at).toLocaleDateString('pt-BR', { timeZone:'America/Sao_Paulo' })} · {time(a.at)}</time></span></button>) : <p className="cc-empty">Os registros da equipe aparecerão aqui.</p>}</div></section>
    </div>
    <div className="cc-bottom-grid"><section className="cc-card"><div className="cc-card-heading"><h2>Produção da semana</h2><span className="cc-badge cc-badge-green">{percentage}% concluída</span></div><div className="cc-progress" role="progressbar" aria-label="Gravações realizadas na semana" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${percentage}%`}}/></div><div className="cc-progress-caption"><span>Gravações realizadas</span><strong>{completed} de {weekEvents.length}</strong></div></section>
      {canManage ? <section className="cc-card"><div className="cc-card-heading"><h2>Análise de Performance · Briefings & Financeiro</h2><button className="cc-link" onClick={() => setCurrentView('briefing')}>Ver briefings <ArrowRight size={13}/></button></div><div className="cc-finance-row"><span>Briefings de Vídeo concluídos</span><strong className="cc-tone-green">{totalBriefingsVideoDone} de {allRecordingEvents.length} ({totalBriefingsPending} pendentes)</strong></div><div className="cc-finance-row"><span>Briefings de Edição (Modelos)</span><strong>{totalBriefingsEdicaoDone} feitos</strong></div><div className="cc-finance-row"><span>Despesas do mês / Reembolsos pendentes</span><strong className="cc-tone-amber">{money(expenses)} · {money(outstanding)}</strong></div></section> : <section className="cc-card"><div className="cc-card-heading"><h2>Meu próximo passo</h2><Clock size={15}/></div><p className="cc-subtitle">Consulte sua escala e prepare as informações para a próxima atividade.</p><button className="cc-link" onClick={() => setCurrentView('minha-agenda')}>Abrir minha agenda <ArrowRight size={13}/></button></section>}
    </div>
  </div>;
}
