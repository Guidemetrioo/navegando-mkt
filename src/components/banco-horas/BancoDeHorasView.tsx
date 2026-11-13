'use client';

import React, { useState, useMemo } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { MONTH_NAMES, WEEKDAYS_SHORT, parseDateIso } from '@/lib/date-utils';
import { EmployeeBadge } from '../agenda/EmployeeBadge';
import {
  CLT_2026_RULES,
  BancoHorasAdjustmentType,
  calculateEmployeeMonthlyTimeBank,
  formatDurationHoursMinutes,
} from '@/lib/clt-roster-engine';
import { Plus, Download, ShieldCheck, SlidersHorizontal, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function BancoDeHorasView() {
  const {
    currentDate,
    setDate,
    employees,
    events,
    pontos,
    clients,
    bancoHorasLancamentos,
    addBancoHorasLancamento,
    deleteBancoHorasLancamento,
    canManage,
    loggedEmployeeId,
    isDataSaved,
  } = useAgenda();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = MONTH_NAMES[month];

  // Funcionários visíveis (gestor vê todos; colaborador vê seu próprio banco de horas)
  const visibleEmployees = useMemo(() => {
    const active = employees.filter((e) => e.ativo && e.funcao !== 'dono');
    if (canManage) return active;
    return active.filter((e) => e.id === loggedEmployeeId);
  }, [employees, canManage, loggedEmployeeId]);

  const [regimeFilter, setRegimeFilter] = useState<'all' | 'externo' | 'interno'>('all');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');

  // Formulário de Compensação Manual
  const [showCompModal, setShowCompModal] = useState(false);
  const [compEmpId, setCompEmpId] = useState<string>('');
  const [compDate, setCompDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [compTipo, setCompTipo] = useState<BancoHorasAdjustmentType>('compensacao_folga');
  const [compHours, setCompHours] = useState<string>('2');
  const [compMinutes, setCompMinutes] = useState<string>('0');
  const [compMotivo, setCompMotivo] = useState<string>('');

  // Calcula o Banco de Horas completo de todos os funcionários visíveis
  const employeesBankData = useMemo(() => {
    return visibleEmployees
      .filter((emp) => {
        const isExt =
          emp.regime === 'externo' ||
          emp.funcao === 'filmmaker' ||
          emp.funcao === 'modelo' ||
          emp.funcao === 'criadora';
        if (regimeFilter === 'externo') return isExt;
        if (regimeFilter === 'interno') return !isExt;
        return true;
      })
      .map((emp) => {
        const isExternal =
          emp.regime === 'externo' ||
          emp.funcao === 'filmmaker' ||
          emp.funcao === 'modelo' ||
          emp.funcao === 'criadora';
        const bank = calculateEmployeeMonthlyTimeBank({
          employee: emp,
          year,
          month,
          allEvents: events,
          allPontos: pontos,
          allClients: clients,
          manualAdjustments: bancoHorasLancamentos,
        });
        return {
          employee: emp,
          isExternal,
          bank,
        };
      });
  }, [visibleEmployees, regimeFilter, year, month, events, pontos, clients, bancoHorasLancamentos]);

  const activeSelectedEmpData =
    employeesBankData.find((d) => d.employee.id === selectedEmpId) || employeesBankData[0] || null;

  const changeMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1, 12, 0, 0);
    setDate(next);
  };

  const openCompensationFor = (empId: string, defaultDateIso?: string) => {
    setCompEmpId(empId);
    if (defaultDateIso) setCompDate(defaultDateIso);
    setCompMotivo('');
    setShowCompModal(true);
  };

  const handleSaveManualCompensation = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find((emp) => emp.id === compEmpId);
    if (!targetEmp) return;

    const h = Math.max(0, parseInt(compHours, 10) || 0);
    const m = Math.max(0, parseInt(compMinutes, 10) || 0);
    const rawMins = h * 60 + m;
    if (rawMins <= 0) {
      alert('Informe uma quantidade de horas ou minutos maior que zero.');
      return;
    }
    if (!compMotivo.trim()) {
      alert('Informe a justificativa/motivo da compensação ou ajuste manual.');
      return;
    }

    // Define sinal conforme o tipo de ajuste:
    // abono_horas / acrescimo_horas -> soma horas (+ rawMins)
    // compensacao_folga / desconto_horas / pagamento_he -> deduz horas (- rawMins)
    const isPositive = compTipo === 'abono_horas' || compTipo === 'acrescimo_horas';
    const signedMinutes = isPositive ? rawMins : -rawMins;

    const author = employees.find((emp) => emp.id === loggedEmployeeId)?.nome || 'Gestão';

    try {
      addBancoHorasLancamento({
        employee_id: targetEmp.id,
        employee_nome: targetEmp.nome,
        data: compDate,
        tipo: compTipo,
        minutos: signedMinutes,
        motivo: compMotivo.trim(),
        registrado_por: author,
      });
    } catch {
      return;
    }

    setShowCompModal(false);
    setCompMotivo('');
  };

  // Exportar planilha CSV / Backup do Banco de Horas para garantir segurança extra dos dados
  const handleExportTimeBankCsv = () => {
    const headers = [
      'Funcionario',
      'Regime',
      'Semana',
      'Meta Semanal (42h)',
      'Horas em Gravacao',
      'Horas Locomocao entre Restaurantes',
      'Total Trabalhado Semana',
      'Ajustes Manuais',
      'Saldo Semanal vs 42h',
    ];
    const rows: string[][] = [];

    for (const item of employeesBankData) {
      for (const w of item.bank.weeks) {
        rows.push([
          item.employee.nome,
          item.isExternal ? 'Externo (1o ao Ultimo Restaurante + Locomocao)' : 'Interno CLT',
          w.weekLabel,
          formatDurationHoursMinutes(w.targetMinutes),
          formatDurationHoursMinutes(w.recordingMinutes),
          formatDurationHoursMinutes(w.locomotionMinutes),
          formatDurationHoursMinutes(w.workedMinutes),
          formatDurationHoursMinutes(w.manualAdjustmentsMinutes, true),
          formatDurationHoursMinutes(w.balanceMinutes, true),
        ]);
      }
    }

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `banco-de-horas-${monthName.toLowerCase()}-${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* =================================================================
          1. CABEÇALHO DO BANCO DE HORAS (42H SEMANAIS + SEGURANÇA DE DADOS)
          ================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] border border-[var(--ui-accent)]/30">
              Banco de Horas • Teto 42h Semanais (EC 141/2026)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              {isDataSaved
                ? 'Dados Salvos Automaticamente (Zero Perda)'
                : 'Sincronizando banco de horas...'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-foreground font-heading mt-1">
            Banco de Horas & Controle de Jornada (42h/Semana) — {monthName} {year}
          </h2>
          <p className="text-xs text-zinc-400">
            Acompanhe quanto cada funcionário trabalhou na semana, quanto passou ou faltou para completar as <strong>42 horas semanais</strong> e faça compensações manuais auditáveis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Mês */}
          <div className="flex items-center bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl p-1">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-foreground hover:bg-[var(--ui-surface)] transition-colors cursor-pointer"
             data-text-action="true"><span className="text-action-label">{"Anterior"}</span></button>
            <span className="px-3 text-xs font-extrabold text-foreground capitalize min-w-[130px] text-center">
              {monthName} {year}
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-foreground hover:bg-[var(--ui-surface)] transition-colors cursor-pointer"
             data-text-action="true"><span className="text-action-label">{"Próximo"}</span></button>
          </div>

          <button
            type="button"
            onClick={handleExportTimeBankCsv}
            className="px-3.5 py-2 rounded-xl bg-[var(--ui-raised)] hover:bg-[var(--ui-border)] border border-[var(--ui-border)] text-xs font-bold text-zinc-200 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Exportar planilha detalhada do Banco de Horas (CSV)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar Extrato (CSV)</span>
          </button>

          {canManage && (
            <button
              type="button"
              onClick={() =>
                openCompensationFor(
                  activeSelectedEmpData?.employee.id || visibleEmployees[0]?.id || ''
                )
              }
              className="gradient-cta px-4 py-2 rounded-xl text-foreground font-extrabold text-xs shadow-lg flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Compensar / Ajustar Horas</span>
            </button>
          )}
        </div>
      </div>

      {/* =================================================================
          2. EXPLICAÇÃO TRANSPARENTE DAS EQUAÇÕES (EXTERNOS VS INTERNOS)
          ================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[#38bdf8]/30 flex items-start gap-3">

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#38bdf8]">
              Equação de Campo • Funcionários Externos (Filmmakers & Modelos)
            </span>
            <h4 className="text-xs sm:text-sm font-extrabold text-foreground">
              Início no 1º Restaurante → Término no Último Restaurante do Dia
            </h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Quando há mais de uma gravação no dia, a jornada começa no <strong>primeiro restaurante</strong> e termina no <strong>último restaurante</strong>. Todo o <strong>tempo de locomoção entre os restaurantes</strong> é somado automaticamente como hora trabalhada (Art. 4º e 58 da CLT).
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-purple-500/30 flex items-start gap-3">

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">
              Equação Escritório • Funcionários Internos (CLT Sede)
            </span>
            <h4 className="text-xs sm:text-sm font-extrabold text-foreground">
              Entrada na Sede → Saída do Expediente (Descontando Intervalo)
            </h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Calculado a partir das batidas de ponto de Entrada e Saída na agência (descontando 1h de intervalo para refeição e descanso conforme Art. 71 da CLT), comparado à meta de <strong>42h semanais</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* =================================================================
          3. FILTRO E GRADE RESUMO DE TODOS OS FUNCIONÁRIOS (SEMANA A SEMANA)
          ================================================================= */}
      <div className="rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--ui-border)] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-foreground">
              Resumo Semanal da Equipe (Meta: 42h Semanais)
            </h3>
            <p className="text-xs text-zinc-400">
              Clique em qualquer funcionário abaixo para abrir o espelho detalhado dia a dia (1º ao último restaurante + locomoção) e compensar horas.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {(['all', 'externo', 'interno'] as const).map((rf) => (
              <button
                key={rf}
                type="button"
                onClick={() => setRegimeFilter(rf)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  regimeFilter === rf
                    ? 'brand-solid bg-[var(--ui-accent)] text-foreground'
                    : 'bg-[var(--ui-raised)] text-zinc-400 hover:text-foreground'
                }`}
              >
                {rf === 'all'
                  ? 'Toda a Equipe'
                  : rf === 'externo'
                  ? 'Externos (Restaurantes + Locomoção)'
                  : 'Internos (Escritório)'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-[var(--ui-border)] bg-[var(--ui-raised)] text-[11px] font-bold text-zinc-400 uppercase">
                <th className="py-3 px-4">Funcionário / Regime</th>
                {employeesBankData[0]?.bank.weeks.map((w) => (
                  <th key={w.weekIndex} className="py-3 px-3 text-center">
                    <div>Semana {w.weekIndex}</div>
                    <div className="text-[10px] font-normal text-zinc-500">
                      {w.startDateIso.slice(8, 10)}/{w.startDateIso.slice(5, 7)} a{' '}
                      {w.endDateIso.slice(8, 10)}/{w.endDateIso.slice(5, 7)}
                    </div>
                  </th>
                ))}
                <th className="py-3 px-3 text-center">Ajustes Manuais</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ui-border)] text-xs">
              {employeesBankData.map(({ employee: emp, isExternal, bank }) => {
                const isSelected = activeSelectedEmpData?.employee.id === emp.id;
                return (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmpId(emp.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--ui-accent)]/10'
                        : 'hover:bg-[var(--ui-raised)]/50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <EmployeeBadge employee={emp} size="sm" showRole />
                        <span
                          className={`text-[10px] font-bold w-fit px-2 py-0.2 rounded-full ${
                            isExternal
                              ? 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30'
                              : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {isExternal ? 'Externo (1º → Último Rest. + Locomoção)' : 'Interno (Ponto CLT)'}
                        </span>
                      </div>
                    </td>

                    {bank.weeks.map((w) => {
                      const passed42 = w.effectiveTotalMinutes > CLT_2026_RULES.LIMITE_SEMANAL_MINUTOS;
                      const missingFor42 = w.effectiveTotalMinutes < CLT_2026_RULES.LIMITE_SEMANAL_MINUTOS;
                      return (
                        <td key={w.weekIndex} className="py-3 px-2.5 text-center">
                          <div
                            className={`p-2 rounded-xl border inline-flex flex-col items-center gap-0.5 min-w-[135px] ${
                              passed42
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                                : w.effectiveTotalMinutes === CLT_2026_RULES.LIMITE_SEMANAL_MINUTOS
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                                : 'bg-[var(--ui-raised)] border-[var(--ui-border)] text-zinc-200'
                            }`}
                          >
                            <div className="font-mono font-extrabold text-xs">
                              {formatDurationHoursMinutes(w.effectiveTotalMinutes)}{' '}
                              <span className="text-[10px] font-normal text-zinc-400">/ 42h</span>
                            </div>

                            {isExternal && w.locomotionMinutes > 0 && (
                              <span className="text-[9px] text-[#38bdf8] font-medium">
                                ({formatDurationHoursMinutes(w.recordingMinutes)} grav. +{' '}
                                {formatDurationHoursMinutes(w.locomotionMinutes)} locom.)
                              </span>
                            )}

                            <span
                              className={`text-[10px] font-extrabold flex items-center gap-0.5 mt-0.5 ${
                                passed42
                                  ? 'text-amber-400'
                                  : missingFor42
                                  ? 'text-sky-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {passed42 ? (
                                <>
                                  <ArrowUpRight className="w-3 h-3" />
                                  Passou {formatDurationHoursMinutes(w.balanceMinutes, true)}
                                </>
                              ) : missingFor42 ? (
                                <>
                                  <ArrowDownRight className="w-3 h-3" />
                                  Faltou {formatDurationHoursMinutes(Math.abs(w.balanceMinutes))}
                                </>
                              ) : (
                                '42h Completas'
                              )}
                            </span>
                          </div>
                        </td>
                      );
                    })}

                    <td className="py-3 px-3 text-center font-mono font-bold">
                      {bank.totalManualAdjustmentsMinutes === 0 ? (
                        <span className="text-zinc-500">0h</span>
                      ) : (
                        <span
                          className={
                            bank.totalManualAdjustmentsMinutes > 0
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }
                        >
                          {formatDurationHoursMinutes(bank.totalManualAdjustmentsMinutes, true)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {canManage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCompensationFor(emp.id);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-[var(--ui-raised)] hover:bg-[var(--ui-accent)] text-zinc-200 hover:text-foreground border border-[var(--ui-border)] text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          + Compensar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================================
          4. ESPELHO DETALHADO DO FUNCIONÁRIO SELECIONADO (DIA A DIA + COMPENSAÇÕES)
          ================================================================= */}
      {activeSelectedEmpData && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--ui-surface)] border-2 border-[var(--ui-accent)]/40 flex flex-col gap-5 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--ui-border)]">
            <div className="flex items-center gap-3">
              <EmployeeBadge employee={activeSelectedEmpData.employee} size="lg" showRole />
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--ui-accent)] block">
                  Auditoria Detalhada de Jornada Semanal (Meta 42h)
                </span>
                <p className="text-xs text-zinc-300 mt-0.5">
                  {activeSelectedEmpData.isExternal
                    ? 'Cálculo Externo: Início no 1º restaurante do dia até o término no último restaurante (incluindo locomoção entre restaurantes).'
                    : 'Cálculo Interno CLT: Entrada até Saída descontando intervalo de refeição.'}
                </p>
              </div>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() => openCompensationFor(activeSelectedEmpData.employee.id)}
                className="gradient-cta px-4 py-2 rounded-xl text-foreground font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer w-fit"
              >
                <Plus className="w-4 h-4" />
                <span>Compensar Horas de {activeSelectedEmpData.employee.nome}</span>
              </button>
            )}
          </div>

          {/* Semanas Detalhadas do Funcionário */}
          <div className="grid grid-cols-1 gap-4">
            {activeSelectedEmpData.bank.weeks.map((week) => {
              const passed42 = week.effectiveTotalMinutes > CLT_2026_RULES.LIMITE_SEMANAL_MINUTOS;
              const missing42 = week.effectiveTotalMinutes < CLT_2026_RULES.LIMITE_SEMANAL_MINUTOS;
              const progressPct = Math.min(
                100,
                Math.round((week.effectiveTotalMinutes / CLT_2026_RULES.LIMITE_SEMANAL_MINUTOS) * 100)
              );

              const workedDays = week.dailyBreakdowns.filter(
                (d) => d.totalWorkedMinutes > 0 || d.eventsCount > 0 || d.manualAdjustmentMinutes !== 0
              );

              return (
                <div
                  key={week.weekIndex}
                  className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex flex-col gap-3"
                >
                  {/* Topo da Semana com Barra de 42h */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-foreground">
                          {week.weekLabel}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--ui-surface)] border border-[var(--ui-border)] text-zinc-300">
                          {week.daysWorkedCount} dias trabalhados • {week.daysOffCount} folgas
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                        <span>
                          Em Gravação:{' '}
                          <strong className="text-foreground">
                            {formatDurationHoursMinutes(week.recordingMinutes)}
                          </strong>
                        </span>
                        {activeSelectedEmpData.isExternal && (
                          <span>
                            • Locomoção entre Restaurantes:{' '}
                            <strong className="text-[#38bdf8]">
                              +{formatDurationHoursMinutes(week.locomotionMinutes)}
                            </strong>
                          </span>
                        )}
                        {week.manualAdjustmentsMinutes !== 0 && (
                          <span>
                            • Compensação Manual:{' '}
                            <strong className="text-emerald-400">
                              {formatDurationHoursMinutes(week.manualAdjustmentsMinutes, true)}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Resultado da Semana contra as 42h */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                          Total na Semana / Meta 42h
                        </span>
                        <span className="text-base font-extrabold font-mono text-foreground">
                          {formatDurationHoursMinutes(week.effectiveTotalMinutes)} / 42h
                        </span>
                      </div>

                      <div
                        className={`px-3 py-2 rounded-xl border text-xs font-extrabold font-mono ${
                          passed42
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : missing42
                            ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        {passed42
                          ? `Passou ${formatDurationHoursMinutes(week.balanceMinutes, true)}`
                          : missing42
                          ? `Faltou ${formatDurationHoursMinutes(Math.abs(week.balanceMinutes))} p/ 42h`
                          : '42h Exatas!'}
                      </div>
                    </div>
                  </div>

                  {/* Barra de Progresso Visual de 42h */}
                  <div className="w-full h-2 rounded-full bg-[var(--ui-surface)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        passed42
                          ? 'bg-amber-500'
                          : missing42
                          ? 'bg-[#38bdf8]'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Detalhamento Dia a Dia da Semana */}
                  {workedDays.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic py-1">
                      Nenhuma gravação ou ponto registrado nesta semana.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                      {workedDays.map((day) => {
                        const dObj = parseDateIso(day.dateIso);
                        const dayOfWeekIdx = dObj.getDay() === 0 ? 6 : dObj.getDay() - 1;
                        const weekdayShort = WEEKDAYS_SHORT[dayOfWeekIdx];
                        return (
                          <div
                            key={day.dateIso}
                            className="p-3 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-foreground">
                                  {weekdayShort}, {day.dateIso.slice(8, 10)}/{day.dateIso.slice(5, 7)}
                                </span>
                              </div>
                              <span className="font-mono font-extrabold text-[var(--ui-accent)]">
                                {formatDurationHoursMinutes(day.totalWorkedMinutes)}
                              </span>
                            </div>

                            {day.firstStartFormatted && day.lastEndFormatted && (
                              <div className="text-[11px] text-zinc-300 flex flex-col gap-0.5 bg-[var(--ui-raised)] p-2 rounded-lg border border-[var(--ui-border)]">
                                <div className="flex items-center justify-between">
                                  <span className="text-zinc-400">1º Restaurante (Início):</span>
                                  <strong className="font-mono text-emerald-400">
                                    {day.firstStartFormatted}
                                  </strong>
                                </div>
                                <span className="text-[10px] text-zinc-400 truncate">
                                  ↳ {day.firstRestaurantName}
                                </span>

                                <div className="flex items-center justify-between mt-1 pt-1 border-t border-[var(--ui-border)]">
                                  <span className="text-zinc-400">Último Rest. (Fim):</span>
                                  <strong className="font-mono text-amber-400">
                                    {day.lastEndFormatted}
                                  </strong>
                                </div>
                                <span className="text-[10px] text-zinc-400 truncate">
                                  ↳ {day.lastRestaurantName}
                                </span>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between text-[10px] text-zinc-400 pt-0.5">
                              <span>
                                {day.eventsCount}{' '}
                                {day.eventsCount === 1 ? 'restaurante' : 'restaurantes'} no dia
                              </span>
                              {day.locomotionMinutes > 0 && (
                                <span className="text-[#38bdf8] font-bold">
                                  +{formatDurationHoursMinutes(day.locomotionMinutes)} locomoção
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Ajustes / Compensações Manuais lançados nesta Semana */}
                  {week.adjustments.length > 0 && (
                    <div className="pt-2 border-t border-[var(--ui-border)] flex flex-col gap-1.5">
                      <span className="text-[11px] font-extrabold text-zinc-300 uppercase tracking-wider">
                        Compensações Manuais Registradas nesta Semana ({week.adjustments.length})
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {week.adjustments.map((adj) => (
                          <div
                            key={adj.id}
                            className="p-2.5 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex flex-col gap-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono ${
                                    adj.minutos > 0
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  }`}
                                >
                                  {formatDurationHoursMinutes(adj.minutos, true)}
                                </span>
                                <span className="font-bold text-foreground">{adj.motivo}</span>
                              </div>
                              <span className="text-[10px] text-zinc-400">
                                Data ref.: {adj.data.slice(8, 10)}/{adj.data.slice(5, 7)}/{adj.data.slice(0, 4)} • Registrado por {adj.registrado_por}
                              </span>
                            </div>

                            {canManage && (
                              <button
                                type="button"
                                onClick={() => { try { deleteBancoHorasLancamento(adj.id); } catch {} }}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Remover lançamento"
                               data-text-action="true"><span className="text-action-label">{"Remover"}</span></button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================
          MODAL DE COMPENSAÇÃO MANUAL DO BANCO DE HORAS
          ================================================================= */}
      {showCompModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowCompModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-2xl p-5 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--ui-border)]">
              <div>
                <h3 className="text-base font-extrabold text-foreground font-heading">
                  Compensar / Ajustar Banco de Horas
                </h3>
                <p className="text-xs text-zinc-400">
                  O registro fica salvo permanentemente no histórico do colaborador.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompModal(false)}
                className="text-xs text-zinc-400 hover:text-foreground cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSaveManualCompensation} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Funcionário *
                </label>
                <select
                  value={compEmpId}
                  onChange={(e) => setCompEmpId(e.target.value)}
                  className="w-full rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] px-3 py-2 text-xs text-foreground font-bold"
                  required
                >
                  {visibleEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nome} ({emp.funcao})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Data de Referência *
                  </label>
                  <input
                    type="date"
                    value={compDate}
                    onChange={(e) => setCompDate(e.target.value)}
                    className="w-full rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] px-3 py-2 text-xs text-foreground"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Tipo de Operação *
                  </label>
                  <select
                    value={compTipo}
                    onChange={(e) => setCompTipo(e.target.value as BancoHorasAdjustmentType)}
                    className="w-full rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] px-2.5 py-2 text-xs text-foreground font-semibold"
                  >
                    <option value="abono_horas">+ Abonar / Completar para 42h</option>
                    <option value="acrescimo_horas">+ Adicionar Horas Extras / Deslocamento</option>
                    <option value="compensacao_folga">- Compensar com Folga / Saída Antecipada</option>
                    <option value="pagamento_he">- Baixar Horas Extras Pagas em Folha</option>
                    <option value="desconto_horas">- Descontar Atraso / Ausência</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Horas
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={compHours}
                    onChange={(e) => setCompHours(e.target.value)}
                    className="w-full rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] px-3 py-2 text-xs text-foreground font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Minutos
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={compMinutes}
                    onChange={(e) => setCompMinutes(e.target.value)}
                    className="w-full rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] px-3 py-2 text-xs text-foreground font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Motivo / Observação da Compensação *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Folga compensatória referente à gravação extra de quinta-feira..."
                  value={compMotivo}
                  onChange={(e) => setCompMotivo(e.target.value)}
                  className="w-full rounded-xl bg-[var(--ui-raised)] border border-[var(--ui-border)] px-3 py-2 text-xs text-foreground"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--ui-border)]">
                <button
                  type="button"
                  onClick={() => setShowCompModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-[var(--ui-raised)] text-xs font-semibold text-zinc-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="gradient-cta px-4 py-2 rounded-xl text-foreground text-xs font-extrabold shadow-md cursor-pointer"
                >
                  Salvar no Banco de Horas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
