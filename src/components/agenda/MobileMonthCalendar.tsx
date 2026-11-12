'use client';
import { useState } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { MONTH_NAMES, todayInSaoPaulo } from '@/lib/date-utils';

export function MobileMonthCalendar() {
  const {currentDate, filteredEvents, navigate, openDayDetailModal, openEditEventModal, openNewEventModal, canManage} = useAgenda();
  const [selected, setSelected] = useState('');
  const year=currentDate.getFullYear(), month=currentDate.getMonth();
  const prefix=`${year}-${String(month+1).padStart(2,'0')}`;
  const today=todayInSaoPaulo();
  const chosen=selected.startsWith(prefix) ? selected : today.startsWith(prefix) ? today : `${prefix}-01`;
  const days=new Date(year,month+1,0).getDate(), offset=new Date(year,month,1).getDay();
  const cells=Array.from({length:Math.ceil((days+offset)/7)*7},(_,index)=>{const day=index-offset+1; return day>0 && day<=days ? day : null;});
  const events=filteredEvents.filter(event=>event.status!=='cancelado').sort((a,b)=>a.hora_inicio.localeCompare(b.hora_inicio));
  const agenda=events.filter(event=>event.data===chosen);
  return <section className="mobile-month sm:hidden" aria-label="Calendário mensal no celular">
    <div className="mobile-calendar-tools"><span>{year}</span><div><button onClick={()=>navigate('prev')} aria-label="Mês anterior">Anterior</button><button onClick={()=>{setSelected(today);navigate('today');}}>Hoje</button><button onClick={()=>navigate('next')} aria-label="Próximo mês">Próximo</button></div></div>
    <h1>{MONTH_NAMES[month]}</h1>
    <div className="mobile-calendar-weekdays" aria-hidden="true">{['D','S','T','Q','Q','S','S'].map((day,index)=><span key={index}>{day}</span>)}</div>
    <div className="mobile-calendar-grid">{cells.map((day,index)=>{
      if(!day)return <div className="mobile-calendar-blank" key={`blank-${index}`} aria-hidden="true"/>;
      const iso=`${prefix}-${String(day).padStart(2,'0')}`, list=events.filter(event=>event.data===iso);
      return <button key={iso} className="mobile-calendar-day" data-today={iso===today} data-selected={iso===chosen} data-weekend={index%7===0||index%7===6} aria-label={`${day} de ${MONTH_NAMES[month]}, ${list.length} compromissos`} aria-pressed={iso===chosen} onClick={()=>setSelected(iso)}>
        <span className="calendar-day-number">{day}</span><span className="calendar-day-events">{list.slice(0,2).map(event=><span key={event.id} className="calendar-event-pill" data-type={event.tipo}>{event.client?.nome || event.local || 'Compromisso'}</span>)}{list.length>2&&<span className="calendar-more">+{list.length-2}</span>}</span>
      </button>;
    })}</div>
    <div className="mobile-day-agenda"><div className="mobile-day-heading"><h2>{Number(chosen.slice(-2))} de {MONTH_NAMES[month].toLowerCase()}</h2><button onClick={()=>openDayDetailModal(chosen)}>Ver dia</button></div>
      {!agenda.length&&<p>Sem compromissos neste dia.</p>}
      {agenda.map(event=><button className="mobile-day-event" key={event.id} onClick={()=>openEditEventModal(event)}><time>{event.hora_inicio.slice(0,5)}<small>{event.hora_fim.slice(0,5)}</small></time><span><strong>{event.client?.nome || 'Compromisso'}</strong><small>{event.local || 'Local não informado'} · {event.status}</small></span></button>)}
      {canManage&&<button className="mobile-calendar-add" onClick={()=>openNewEventModal(chosen)}>Novo agendamento</button>}
    </div>
  </section>;
}
