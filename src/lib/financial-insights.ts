import type { TransacaoFinanceira, DespesaGravacao } from '@/types/database';
export function financialInsights(transactions:TransacaoFinanceira[], reimbursements:DespesaGravacao[], month:string, today:string) {
  const active=transactions.filter(row=>row.status!=='cancelado');
  const scheduled=active.filter(row=>row.data_vencimento?.slice(0,7)===month);
  const settled=active.filter(row=>row.status==='pago' && (row.data_pagamento || row.data_vencimento)?.slice(0,7)===month);
  const sum=(rows:TransacaoFinanceira[])=>rows.reduce((total,row)=>total+Number(row.valor || 0),0);
  const received=sum(settled.filter(row=>row.tipo==='receita'));
  const paid=sum(settled.filter(row=>row.tipo==='despesa'));
  const receivables=scheduled.filter(row=>row.tipo==='receita' && row.status!=='pago');
  const payables=scheduled.filter(row=>row.tipo==='despesa' && row.status!=='pago');
  const overdue=receivables.filter(row=>row.data_vencimento<today);
  const categories=new Map<string,number>();
  for(const row of scheduled.filter(row=>row.tipo==='despesa')) categories.set(row.categoria,(categories.get(row.categoria)||0)+row.valor);
  const customers=new Map<string,{name:string,total:number,open:number}>();
  for(const row of scheduled.filter(row=>row.tipo==='receita')) {
    const key=row.client_id || row.cliente_nome || 'other';
    const entry=customers.get(key)||{name:row.cliente_nome || 'Receitas sem restaurante vinculado',total:0,open:0};
    entry.total+=row.valor; if(row.status!=='pago')entry.open+=row.valor; customers.set(key,entry);
  }
  const expenses=reimbursements.filter(row=>row.data?.slice(0,7)===month);
  const reimbursementStatuses=(['pendente','aprovado','reembolsado','recusado'] as const).map(status=>({status,count:expenses.filter(row=>row.status===status).length,value:expenses.filter(row=>row.status===status).reduce((sum,row)=>sum+row.valor,0)}));
  const accepted=expenses.filter(row=>row.status!=='recusado');
  const totalReimbursements=accepted.reduce((total,row)=>total+row.valor,0);
  const [year,number]=month.split('-').map(Number);
  const trend=Array.from({length:6},(_,index)=>{
    const date=new Date(Date.UTC(year,number-1-(5-index),1)); const key=date.toISOString().slice(0,7);
    const rows=active.filter(row=>row.status==='pago' && (row.data_pagamento||row.data_vencimento)?.slice(0,7)===key);
    return {month:key,income:sum(rows.filter(row=>row.tipo==='receita')),expense:sum(rows.filter(row=>row.tipo==='despesa'))};
  });
  return {received,paid,balance:received-paid,receivable:sum(receivables),payable:sum(payables),overdue:sum(overdue),overdueCount:overdue.length,
    categories:[...categories].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value),
    customers:[...customers.values()].sort((a,b)=>b.total-a.total),reimbursementStatuses,totalReimbursements,reimbursementAverage:accepted.length?totalReimbursements/accepted.length:0,trend,
    missingPaymentDates:settled.filter(row=>!row.data_pagamento).length,scheduledCount:scheduled.length};
}
