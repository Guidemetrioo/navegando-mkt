import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('./load-ts.cjs');
const { filterPontoHistory, teamPontoHistory } = require('../src/lib/ponto-history.ts');
const filters = { employeeId: 'all', clientId: 'all', tipo: 'all', startDate: '', endDate: '' };
const points = [
  { id: 'internal', employee_id: 'office', tipo: 'almoco', data_hora: '2026-10-29T15:00:00Z', foto_url: 'photo-internal', latitude: -23.5, longitude: -46.6 },
  { id: 'external', employee_id: 'film', client_id: 'restaurant', tipo: 'entrada', data_hora: '2026-10-29T02:59:59Z', foto_url: 'photo-external', latitude: -23.6, longitude: -46.7 },
  { id: 'start', employee_id: 'film', client_id: 'restaurant', tipo: 'saida', data_hora: '2026-10-29T03:00:00Z' },
  { id: 'end', employee_id: 'office', tipo: 'saida', data_hora: '2026-10-30T02:59:59Z' },
  { id: 'next', employee_id: 'office', tipo: 'entrada', data_hora: '2026-10-30T03:00:00Z' },
];
test('roster includes every employee and leaves missing attendance empty', () => {
  const employees = [{ id: 'office', nome: 'Carol' }, { id: 'film', nome: 'Victor' }, { id: 'no-punch', nome: 'Alexandre' }];
  const result = teamPontoHistory(employees, filterPontoHistory(points, 'gerente', 'manager', filters));
  assert.equal(result.length, 3);
  assert.deepEqual(result.find(row => row.employee.id === 'no-punch').registros, []);
  assert.equal(result.find(row => row.employee.id === 'film').registros[0].id, 'start');
  assert.equal(teamPontoHistory(employees, [], 'office').length, 1);
  assert.equal(teamPontoHistory(employees, []).length, 3);
});
test('owners and managers see internal and external attendance with original evidence', () => {
  for (const role of ['gerente', 'dono']) {
    const result = filterPontoHistory(points, role, 'manager', filters);
    assert.equal(result.length, points.length);
    assert.equal(result.find(p => p.id === 'external'), points[1]);
    assert.equal(result.find(p => p.id === 'internal'), points[0]);
    assert.equal(result[0].id, 'next');
    assert.equal(points[0].id, 'internal');
  }
});
test('non-managers cannot see coworker attendance even by choosing their ID', () => {
  for (const role of ['filmmaker', 'modelo', 'interno', undefined]) {
    assert(filterPontoHistory(points, role, 'film', filters).every(p => p.employee_id === 'film'));
    assert.deepEqual(filterPontoHistory(points, role, 'film', { ...filters, employeeId: 'office' }), []);
    assert.deepEqual(filterPontoHistory(points, role, null, filters), []);
  }
});
test('date range includes the complete Sao Paulo day on both boundaries', () => {
  assert.deepEqual(filterPontoHistory(points, 'gerente', 'manager', { ...filters, startDate: '2026-10-29', endDate: '2026-10-29' }).map(p => p.id), ['end', 'internal', 'start']);
});
test('employee, local and lunch filters combine', () => {
  assert.deepEqual(filterPontoHistory(points, 'gerente', 'manager', { ...filters, employeeId: 'office', clientId: 'internal', tipo: 'almoco' }).map(p => p.id), ['internal']);
  assert.deepEqual(filterPontoHistory(points, 'gerente', 'manager', { ...filters, clientId: 'restaurant' }).map(p => p.id), ['start', 'external']);
});
test('open date bounds work and inverted ranges return no records', () => {
  assert.equal(filterPontoHistory(points, 'gerente', 'manager', { ...filters, startDate: '2026-10-30' }).length, 1);
  assert.equal(filterPontoHistory(points, 'gerente', 'manager', { ...filters, endDate: '2026-10-28' }).length, 1);
  assert.deepEqual(filterPontoHistory(points, 'gerente', 'manager', { ...filters, startDate: '2026-10-30', endDate: '2026-10-28' }), []);
});
