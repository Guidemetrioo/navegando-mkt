import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);require('./load-ts.cjs');
const {mayAccess,canonical,same,emptyWorkspace,workspaceFrom,diffWorkspace,mergeWorkspace,validateChanges,validateCloudSnapshot,cloudSnapshotChanged,isSelfOnlyRole,isEventAssignedToMember,scopeSnapshotForMember}=require('../src/lib/workspace.ts');
const {saveToStorage,loadFromStorage,validateBackup}=require('../src/lib/storage-backup.ts');
const {todayInSaoPaulo}=require('../src/lib/date-utils.ts');
const {formatWhatsAppBriefingDocument,buildWhatsAppBriefingShareUrl}=require('../src/lib/briefing-whatsapp.ts');
const {buildBriefingDocumentData,getBriefingPdfFileName}=require('../src/lib/briefing-document.ts');
const base={member:{employee_id:'usr-felipe',user_id:'test',role:'dono'},records:[{kind:'clients',id:'c1',revision:2,data:{id:'c1',nome:'Original'}}]};
test('unknown roles and modules fail closed',()=>{assert.equal(mayAccess(undefined,'home'),false);assert.equal(mayAccess('dono','unknown'),false);});
test('hierarchy follows the supplied matrix',()=>{for(const role of ['dono','gerente']) for(const view of ['dashboard','clientes','backups','relatorios','arquivos','metricas-reels','mural-ugc','feedback']) assert(mayAccess(role,view));for(const role of ['modelo','interno']) for(const view of ['dashboard','clientes','backups','relatorios','metricas-reels','mural-ugc','escala']) assert(!mayAccess(role,view));for(const role of ['dono','gerente','filmmaker','modelo','criadora','interno']) assert(mayAccess(role,'feedback'));assert(mayAccess('interno','arquivos'));assert(mayAccess('filmmaker','relatorios'));assert(!mayAccess('modelo','arquivos'));});
test('server JSON ordering does not generate spurious writes',()=>{assert(same({id:'x',report:{b:2,a:1}},{report:{a:1,b:2},id:'x'}));});
test('relationships and expiring signed URLs do not cause writes',()=>{assert.deepEqual(canonical({id:'p',client:{nome:'x'},photo_storage_path:'u/p.jpg',foto_url:'https://temporary/1'}),canonical({id:'p',photo_storage_path:'u/p.jpg',foto_url:'https://temporary/2'}));});
test('unchanged workspace has no mutations',()=>{assert.deepEqual(diffWorkspace(base,workspaceFrom(base)),[]);});
test('edit carries the last confirmed revision',()=>{const w=workspaceFrom(base);w.clients[0].nome='Novo';assert.equal(diffWorkspace(base,w)[0].expected,2);});
test('deletion is explicit and versioned',()=>{assert.deepEqual(diffWorkspace(base,emptyWorkspace()),[{kind:'clients',id:'c1',expected:2,data:null}]);});
test('a response cannot erase edits made during the request',()=>{const sent=workspaceFrom(base);const latest=structuredClone(sent);latest.clients[0].nome='Editado enquanto salvava';const remote=structuredClone(sent);remote.clients[0].nome='Confirmado anterior';assert.equal(mergeWorkspace(sent,latest,remote).clients[0].nome,'Editado enquanto salvava');});
test('another user changes untouched records without being overwritten',()=>{const sent=workspaceFrom(base);const remote=structuredClone(sent);remote.clients[0].nome='Outra pessoa';assert.equal(mergeWorkspace(sent,sent,remote).clients[0].nome,'Outra pessoa');});
test('data disappears only when the user explicitly deleted it',()=>{const sent=workspaceFrom(base);assert.equal(mergeWorkspace(sent,emptyWorkspace(),sent).clients.length,0);});
test('storage quota failure never truncates the payload',()=>{const writes=[];global.window={};global.localStorage={setItem:(key,value)=>{writes.push(value);throw new Error('Quota');}};const rows=Array.from({length:80},(_,id)=>({id,photo:'x'.repeat(1000)}));assert.equal(saveToStorage('test',rows),false);assert.equal(writes.length,1);assert.equal(JSON.parse(writes[0]).length,80);delete global.window;delete global.localStorage;});
test('empty stored array is not replaced with demo records',()=>{global.window={};global.localStorage={getItem:()=> '[]'};assert.deepEqual(loadFromStorage('test',[{id:'demo'}]),[]);delete global.window;delete global.localStorage;});
test('backup rejects duplicates and broken relationships',()=>{const w=workspaceFrom(base);const b={version:'3',exportedAt:new Date().toISOString(),agencyName:'Navegando MKT',data:w};assert.equal(validateBackup(b),b);assert.throws(()=>validateBackup({...b,data:{...w,clients:[w.clients[0],w.clients[0]]}}));assert.throws(()=>validateBackup({...b,data:{...w,events:[{id:'broken',client_id:'missing',assigned_employee_ids:[]}]}}));});
test('business day uses agency timezone around midnight UTC',()=>{assert.equal(todayInSaoPaulo(new Date('2026-10-23T01:00:00Z')),'2026-10-22');});
test('invalid URLs, times and record identifiers are rejected',()=>{for(const changes of [[{kind:'clients',id:'x',expected:0,data:{id:'x',nome:'A',drive_folder_url:'javascript:alert(1)'}}],[{kind:'events',id:'e',expected:0,data:{id:'e',data:'2026-10-22',hora_inicio:'12:00',hora_fim:'09:00'}}],[{kind:'employees',id:'usr',expected:0,data:{id:'usr',funcao:'dono'}}]]) assert.throws(()=>validateChanges(changes));});
test('a registration cannot smuggle a second change to the same ID',()=>{const c={kind:'clients',id:'c',expected:0,data:{id:'c',nome:'A'}};assert.throws(()=>validateChanges([c,c]));});

test('partial or duplicate cloud responses cannot become a baseline',()=>{
 const member={employee_id:'usr',user_id:'u',role:'gerente'};
 const employee={kind:'employees',id:'usr',revision:1,data:{id:'usr'}};
 assert.doesNotThrow(()=>validateCloudSnapshot({member,records:[employee]}));
 for(const value of [null,{member,records:[]},{member,records:[employee,employee]},{member,records:[{...employee,revision:0}]},{member,records:[{...employee,data:{id:'other'}}]}])assert.throws(()=>validateCloudSnapshot(value));
});
test('bank of hours is part of the versioned shared workspace',()=>{
 const w=workspaceFrom(base);w.banco_horas.push({id:'hours-1',employee_id:'usr',minutos:30});
 assert.equal(diffWorkspace(base,w).find(row=>row.kind==='banco_horas').id,'hours-1');
});

test('server membership updates refresh the interface without creating member writes',()=>{
 const before={member:{user_id:'u',employee_id:'manager',role:'gerente'},records:[{kind:'employees',id:'manager',revision:1,data:{id:'manager',nome:'Manager',funcao:'gerente'}}]};
 const after=structuredClone(before);after.records.push({kind:'employees',id:'new-camera',revision:1,data:{id:'new-camera',nome:'New camera',funcao:'filmmaker'}});
 assert.equal(cloudSnapshotChanged(before,after),true);
 assert.deepEqual(diffWorkspace(before,workspaceFrom(after)),[]);
 const updated=structuredClone(before);updated.records[0].data.funcoes_producao=['filmmaker'];assert.equal(cloudSnapshotChanged(before,updated),true);
 const role=structuredClone(before);role.member.role='interno';assert.equal(cloudSnapshotChanged(before,role),true);
});
test('snapshot change detection ignores order and temporary photo links',()=>{
 const before={member:{user_id:'u',employee_id:'manager',role:'gerente'},records:[{kind:'pontos',id:'p1',revision:1,data:{id:'p1',photo_storage_path:'u/p.jpg',foto_url:'https://temporary/1'}}]};
 const after=structuredClone(before);after.records[0].data.foto_url='https://temporary/2';assert.equal(cloudSnapshotChanged(before,after),false);
});

test('filmmakers, models and creators only receive their own records without coworker leaks or spurious mutations',()=>{
 const records=[
  {kind:'employees',id:'emp-film',revision:1,data:{id:'emp-film',nome:'Victor',funcao:'filmmaker'}},
  {kind:'employees',id:'emp-model',revision:1,data:{id:'emp-model',nome:'Isa',funcao:'modelo'}},
  {kind:'employees',id:'emp-other',revision:1,data:{id:'emp-other',nome:'Matheus',funcao:'filmmaker'}},
  {kind:'clients',id:'c1',revision:1,data:{id:'c1',nome:'Restaurante A'}},
  {kind:'events',id:'ev-mine',revision:2,data:{id:'ev-mine',client_id:'c1',data:'2026-11-17',hora_inicio:'10:00',hora_fim:'12:00',tipo:'gravacao',status:'agendado',assigned_employee_ids:['emp-film','emp-model'],relatorio_filmmaker:{preenchido:true}}},
  {kind:'events',id:'ev-edit-model',revision:1,data:{id:'ev-edit-model',client_id:'c1',data:'2026-11-18',hora_inicio:'14:00',hora_fim:'16:00',tipo:'edicao',status:'agendado',assigned_employee_ids:['emp-other'],briefing_edicao_videos:[{id:'v1',modeloEditoraId:'emp-model'}]}},
  {kind:'events',id:'ev-third-party',revision:3,data:{id:'ev-third-party',client_id:'c1',data:'2026-11-19',hora_inicio:'09:00',hora_fim:'11:00',tipo:'gravacao',status:'agendado',assigned_employee_ids:['emp-other']}},
  {kind:'pontos',id:'pt-mine',revision:1,data:{id:'pt-mine',employee_id:'emp-film'}},
  {kind:'pontos',id:'pt-other',revision:1,data:{id:'pt-other',employee_id:'emp-other'}},
  {kind:'banco_horas',id:'bh-other',revision:1,data:{id:'bh-other',employee_id:'emp-other',minutos:60}},
  {kind:'despesas',id:'dx-other',revision:1,data:{id:'dx-other',employee_id:'emp-other',valor:50}},
 ];

 assert.equal(isSelfOnlyRole('filmmaker'),true);
 assert.equal(isSelfOnlyRole('modelo'),true);
 assert.equal(isSelfOnlyRole('criadora'),true);
 assert.equal(isSelfOnlyRole('gerente'),false);
 assert.equal(isEventAssignedToMember(records[5].data,'emp-model'),true);
 assert.equal(isEventAssignedToMember(records[6].data,'emp-model'),false);

 const filmmakerSnap=scopeSnapshotForMember({member:{user_id:'u1',employee_id:'emp-film',role:'filmmaker'},records});
 assert.deepEqual(filmmakerSnap.records.filter(r=>r.kind==='employees').map(r=>r.id),['emp-film']);
 assert.deepEqual(filmmakerSnap.records.filter(r=>r.kind==='events').map(r=>r.id),['ev-mine']);
 assert.deepEqual(filmmakerSnap.records.filter(r=>r.kind==='pontos').map(r=>r.id),['pt-mine']);
 assert.equal(filmmakerSnap.records.some(r=>r.id==='bh-other'||r.id==='dx-other'),false);
 assert.doesNotThrow(()=>validateCloudSnapshot(filmmakerSnap));
 assert.deepEqual(diffWorkspace(filmmakerSnap,workspaceFrom(filmmakerSnap)),[]);

 const modelSnap=scopeSnapshotForMember({member:{user_id:'u2',employee_id:'emp-model',role:'modelo'},records});
 assert.deepEqual(modelSnap.records.filter(r=>r.kind==='employees').map(r=>r.id),['emp-model']);
 assert.deepEqual(modelSnap.records.filter(r=>r.kind==='events').map(r=>r.id),['ev-mine','ev-edit-model']);
 assert.equal('relatorio_filmmaker' in modelSnap.records.find(r=>r.id==='ev-mine').data,false);
 assert.deepEqual(diffWorkspace(modelSnap,workspaceFrom(modelSnap)),[]);

 const managerSnap={member:{user_id:'u3',employee_id:'emp-film',role:'gerente'},records};
 assert.equal(scopeSnapshotForMember(managerSnap).records.length,records.length);
});

test('WhatsApp briefing document formats header, videos, references and phone URL consistently',()=>{
 const doc=formatWhatsAppBriefingDocument(
  {data:'2026-11-17',hora_inicio:'10:00',hora_fim:'14:00',client:{id:'c1',nome:'Flor do Paraiso',cor:'#fff'}},
  [
   {titulo:'Cena Abertura',roteiro:'Mostrar o balcao.',refUrl:'instagram.com/p/abc'},
   {titulo:'Prato Chefe',roteiro:'Take em slow motion.'},
  ]
 );
 assert.match(doc,/📋 \*DOCUMENTO DE BRIEFING DE GRAVAÇÃO — NAVEGANDO MKT\*/);
 assert.match(doc,/🍽️ \*Cliente:\* Flor do Paraiso/);
 assert.match(doc,/📅 \*Data da Gravação:\* 17\/11\/2026 \(10:00 às 14:00\)/);
 assert.match(doc,/🎬 \*Total de Vídeos Planejados:\* 2/);
 assert.match(doc,/🎥 \*VÍDEO 01\* — \*Cena Abertura\*/);
 assert.match(doc,/🔗 Referência: https:\/\/instagram\.com\/p\/abc/);
 assert.match(doc,/🎥 \*VÍDEO 02\* — \*Prato Chefe\*/);
 assert.equal(buildWhatsAppBriefingShareUrl('oi','(11) 99999-8888').startsWith('https://wa.me/5511999998888?text='),true);
 assert.equal(buildWhatsAppBriefingShareUrl('oi','').startsWith('https://wa.me/?text='),true);
});

test('standard briefing PDF document data builds Flor do Paraiso style metadata, 4-card pages and counts',()=>{
 assert.equal(getBriefingPdfFileName('Flor do Paraíso','video'),'Briefing - Flor do Paraíso.pdf');
 const doc=buildBriefingDocumentData(
  {
   data:'2026-11-17',
   briefing_gravacao:'1 - aaaaaa: aaa\n\n2 - aaa',
   briefing_videos:[
    {id:'v1',titulo:'aaaaaa',formato:'Automático',roteiro:'aaa',refRotulo:'Referência',refUrl:''},
    {id:'v2',titulo:'',formato:'Automático',roteiro:'aaa',refRotulo:'Referência',refUrl:''},
   ],
   client:{id:'c1',nome:'Flor do Paraíso',cor:'#fff'},
  },
  {mode:'video'}
 );
 assert.equal(doc.fileName,'Briefing - Flor do Paraíso.pdf');
 assert.equal(doc.displayClient,'Flor do Paraíso');
 assert.equal(doc.displayDate,'17/11/2026');
 assert.equal(doc.items.length,2);
 assert.equal(doc.formatsCount,1);
 assert.equal(doc.pages.length,1);

 const fiveVideos=Array.from({length:5},(_,i)=>({id:`v${i}`,titulo:'',formato:'Automático',roteiro:`Roteiro ${i+1}`,refRotulo:'Referência',refUrl:''}));
 const paged=buildBriefingDocumentData({data:'2026-11-17',briefing_videos:fiveVideos,client:{id:'c1',nome:'Teste',cor:'#fff'}});
 assert.equal(paged.pages.length,2);
 assert.equal(paged.pages[0].length,4);
 assert.equal(paged.pages[1].length,1);
});
