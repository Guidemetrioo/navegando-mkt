'use client';
import { useAgenda, type AgendaView } from '@/context/AgendaContext';

export function MobileBottomNav({onOpenMenu}:{onOpenMenu:()=>void}) {
  const {currentView,setCurrentView}=useAgenda();
  const items: {view:AgendaView;label:string;active:boolean}[]=[
    {view:'home',label:'Início',active:currentView==='home'},
    {view:'mes',label:'Agenda',active:['mes','semana','escala','minha-agenda'].includes(currentView)},
    {view:'ponto',label:'Ponto',active:currentView==='ponto'},
    {view:'briefing',label:'Briefing',active:currentView==='briefing'},
  ];
  return <nav aria-label="Navegação Mobile" className="text-mobile-nav lg:hidden">
    {items.map(item=><button key={item.view} type="button" aria-current={item.active?'page':undefined} onClick={()=>setCurrentView(item.view)}>{item.label}</button>)}
    <button type="button" onClick={onOpenMenu}>Mais</button>
  </nav>;
}
