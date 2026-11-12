'use client';
import {useMemo,useState} from 'react';
import {useAgenda} from '@/context/AgendaContext';
import {formatDateIso,todayInSaoPaulo} from '@/lib/date-utils';
import {financialInsights} from '@/lib/financial-insights';
import type {TransacaoFinanceira,DespesaGravacao} from '@/types/database';
const money=(value:number)=>value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const labels:Record<string,string>={mensalidade_cliente:'Mensalidades',salario_equipe:'Folha de pagamento',custo_gravacao:'Gravações',equipamento:'Equipamentos',software_infra:'Software e infraestrutura',impostos:'Impostos',outros:'Outros'};
const statuses:Record<string,string>={pendente:'Em análise',aprovado:'Aprovados',reembolsado:'Reembolsados',recusado:'Recusados'};
export function FinancialInsights({transactions,reimbursements}:{transactions:TransacaoFinanceira[];reimbursements:DespesaGravacao[]}) {
 const {currentDate}=useAgenda();
 const [period,setPeriod]=useState(''),[view,setView]=useState('cash');
 const month=period||formatDateIso(currentDate).slice(0,7);
 const data=useMemo(()=>financialInsights(transactions,reimbursements,month,todayInSaoPaulo()),[transactions,reimbursements,month]);
 const tabs=[['cash','Caixa'],['receivables','A receber'],['costs','Custos'],['reimbursements','Reembolsos']];
 const metric=(title:string,value:number,note:string)=><article className="finance-metric" key={title}><span>{title}</span><strong>{money(value)}</strong><small>{note}</small></article>;
 const rows=view==='costs'?data.categories.map(row=>({label:labels[row.name]||row.name,value:row.value})):
   view==='reimbursements'?data.reimbursementStatuses.map(row=>({label:`${statuses[row.status]} · ${row.count}`,value:row.value})):
   data.customers.map(row=>({label:row.name,value:row.open})).filter(row=>row.value>0);
 const max=Math.max(...rows.map(row=>row.value),1);
 const trendMax=Math.max(...data.trend.flatMap(row=>[row.income,row.expense]),1);
 return <section className="finance-insights" aria-label="Painéis financeiros por período">
   <header className="finance-insights-heading"><div><p>VISÕES DA OPERAÇÃO</p><h2>Painéis financeiros</h2><span>Indicadores calculados com a origem de dados selecionada acima.</span></div><label>Mês de análise<input aria-label="Mês dos painéis financeiros" type="month" value={month} onInput={event=>{if(event.currentTarget.value)setPeriod(event.currentTarget.value);}} onChange={event=>{if(event.target.value)setPeriod(event.target.value);}}/></label></header>
   <div className="finance-view-tabs" role="tablist" aria-label="Visões financeiras">{tabs.map(([key,label])=><button role="tab" key={key} id={`finance-tab-${key}`} aria-controls="finance-view-panel" aria-selected={view===key} onClick={()=>setView(key)}>{label}</button>)}</div>
   <div role="tabpanel" id="finance-view-panel" aria-labelledby={`finance-tab-${view}`}>
   <div className="finance-metrics">{view==='cash'?<>{metric('Recebido',data.received,'Lançamentos de receita pagos no mês')}{metric('Pago',data.paid,'Lançamentos de despesa pagos no mês')}{metric('Saldo dos lançamentos',data.balance,'Recebido menos pago; não é saldo bancário')}{metric('A pagar',data.payable,'Despesas em aberto com vencimento no mês')}</>:
   view==='receivables'?<>{metric('A receber',data.receivable,'Receitas em aberto com vencimento no mês')}{metric('Vencido e não recebido',data.overdue,`${data.overdueCount} cobranças com vencimento anterior a hoje`)}</>:
   view==='costs'?<>{metric('Despesas lançadas',data.categories.reduce((sum,row)=>sum+row.value,0),'Pagas e em aberto, por vencimento')}{metric('A pagar',data.payable,'Despesas ainda não liquidadas')}</>:
   <>{metric('Reembolsos solicitados',data.totalReimbursements,'Solicitações do mês, excluindo recusadas')}{metric('Valor médio por solicitação',data.reimbursementAverage,'Média das solicitações não recusadas')}</>}</div>
   <article className="finance-chart"><h3>{view==='cash'?'Recebimentos e pagamentos · últimos 6 meses':view==='costs'?'Distribuição por categoria':view==='receivables'?'Valores em aberto por restaurante':'Solicitações por situação'}</h3>
   {view==='cash'?<><div className="finance-trend" role="img" aria-label="Comparação mensal de recebimentos e pagamentos">{data.trend.map(row=><div key={row.month}><div className="finance-trend-bars"><span style={{height:`${row.income/trendMax*100}%`}} title={`Recebido: ${money(row.income)}`}/><span style={{height:`${row.expense/trendMax*100}%`}} title={`Pago: ${money(row.expense)}`}/></div><small>{row.month.slice(5)}/{row.month.slice(2,4)}</small></div>)}</div><p className="finance-chart-legend">Azul: recebido · Amarelo: pago</p><div className="finance-trend-values">{data.trend.map(row=><p key={row.month}><span>{row.month.slice(5)}/{row.month.slice(0,4)}</span><span>{money(row.income)} / {money(row.expense)}</span></p>)}</div>{data.missingPaymentDates>0&&<p className="finance-chart-note">{data.missingPaymentDates} lançamentos pagos sem data de pagamento usam o vencimento como referência.</p>}</>:
   !rows.length?<p className="finance-empty">Sem registros para esta visão no período selecionado.</p>:<div className="finance-breakdown">{rows.map(row=><div key={row.label}><div><span>{row.label}</span><strong>{money(row.value)}</strong></div><progress max={max} value={row.value} aria-label={row.label}/></div>)}</div>}
   </article>
   </div>
   <p className="finance-chart-note">Caixa considera somente transações pagas. Folha e reembolsos não são somados novamente: entram no caixa quando lançados como transações. Solicitações de reembolso têm uma visão separada.</p>
 </section>;
}
