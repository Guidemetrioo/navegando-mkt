import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);require('./load-ts.cjs');const {financialInsights}=require('../src/lib/financial-insights.ts');
const row=(id,patch={})=>({id,tipo:'receita',categoria:'mensalidade_cliente',valor:100,status:'pendente',data_vencimento:'2026-11-05',...patch});
test('cash uses payment date, excludes cancelled transactions and does not sum reimbursements twice',()=>{
 const data=financialInsights([row('income',{status:'pago',data_vencimento:'2026-10-20',data_pagamento:'2026-11-01'}),row('expense',{tipo:'despesa',categoria:'custo_gravacao',valor:30,status:'pago'}),row('cancelled',{valor:900,status:'cancelado'})],[{id:'receipt',valor:30,data:'2026-11-05',status:'reembolsado'}],'2026-11','2026-11-12');
 assert.equal(data.received,100);assert.equal(data.paid,30);assert.equal(data.balance,70);assert.equal(data.totalReimbursements,30);assert.equal(data.missingPaymentDates,1);
});
test('receivables distinguish overdue from future amounts in the selected month',()=>{
 const data=financialInsights([row('overdue'),row('future',{data_vencimento:'2026-11-25',valor:200}),row('next',{data_vencimento:'2026-12-05',valor:1000})],[],'2026-11','2026-11-12');assert.equal(data.receivable,300);assert.equal(data.overdue,100);assert.equal(data.overdueCount,1);
});
test('rejected reimbursements are counted separately and never inflate requested average',()=>{
 const data=financialInsights([],[{id:'a',valor:40,data:'2026-11-01',status:'aprovado'},{id:'b',valor:100,data:'2026-11-01',status:'recusado'}],'2026-11','2026-11-12');assert.equal(data.totalReimbursements,40);assert.equal(data.reimbursementAverage,40);assert.equal(data.reimbursementStatuses.find(row=>row.status==='recusado').value,100);
});
test('empty periods produce zero metrics and a six-month series crossing years',()=>{
 const data=financialInsights([],[],'2026-02','2026-02-01');assert.equal(data.balance,0);assert.equal(data.reimbursementAverage,0);assert.equal(data.trend[0].month,'2025-09');assert.equal(data.trend[5].month,'2026-02');assert.deepEqual(data.categories,[]);
});
