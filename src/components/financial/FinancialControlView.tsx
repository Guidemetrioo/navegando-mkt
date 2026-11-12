'use client';

import { FinancialInsights } from './FinancialInsights';
import React, { useState, useMemo } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { isSimulatedRecord } from '@/lib/supabase/mock-financial-data';
import { Building, Plus, Check, FileText, Sparkles, Database } from 'lucide-react';
import {
  TransacaoTipo,
  TransacaoCategoria,
} from '@/types/database';

export function FinancialControlView() {
  const {
    canManage,
    transacoes,
    salarios,
    allDespesasGravacao,
    addTransacao,
    updateTransacaoStatus,
    updateDespesaStatus,
    updateSalario,
    markSalarioPago,
    clients,
    employees,
  } = useAgenda();

  const [editingSalId, setEditingSalId] = useState<string | null>(null);
  const [editSalValor, setEditSalValor] = useState<string>('');
  const [editSalDia, setEditSalDia] = useState<string>('5');
  const [editSalPix, setEditSalPix] = useState<string>('');
  const [editSalContrato, setEditSalContrato] = useState<'clt' | 'pj' | 'freelancer_diaria'>('clt');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'transacoes' | 'salarios' | 'despesas_gravacao'>('dashboard');
  const [transacaoFilter, setTransacaoFilter] = useState<'todas' | 'receita' | 'despesa' | 'pendente'>('todas');
  const [originFilter, setOriginFilter] = useState<'todos' | 'reais' | 'simulados'>('todos');
  const [searchTransacao, setSearchTransacao] = useState('');

  // Modal de Nova Transação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novoTipo, setNovoTipo] = useState<TransacaoTipo>('receita');
  const [novaCategoria, setNovaCategoria] = useState<TransacaoCategoria>('mensalidade_cliente');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [novoVencimento, setNovoVencimento] = useState(new Date().toISOString().slice(0, 10));
  const [novoClientId, setNovoClientId] = useState('');
  const [novoFormaPagamento] = useState<'pix' | 'boleto' | 'transferencia' | 'cartao'>('pix');

  // Filtragem por origem (Todos / Reais / Simulados)
  const visibleTransacoes = useMemo(() => {
    if (originFilter === 'reais') return transacoes.filter((t) => !isSimulatedRecord(t.id));
    if (originFilter === 'simulados') return transacoes.filter((t) => isSimulatedRecord(t.id));
    return transacoes;
  }, [transacoes, originFilter]);

  const visibleDespesas = useMemo(() => {
    if (originFilter === 'reais') return allDespesasGravacao.filter((d) => !isSimulatedRecord(d.id));
    if (originFilter === 'simulados') return allDespesasGravacao.filter((d) => isSimulatedRecord(d.id));
    return allDespesasGravacao;
  }, [allDespesasGravacao, originFilter]);

  const countRealTransacoes = useMemo(() => transacoes.filter((t) => !isSimulatedRecord(t.id)).length, [transacoes]);
  const countSimTransacoes = useMemo(() => transacoes.filter((t) => isSimulatedRecord(t.id)).length, [transacoes]);
  const countRealDespesas = useMemo(() => allDespesasGravacao.filter((d) => !isSimulatedRecord(d.id)).length, [allDespesasGravacao]);
  const countSimDespesas = useMemo(() => allDespesasGravacao.filter((d) => isSimulatedRecord(d.id)).length, [allDespesasGravacao]);

  // Cálculos Financeiros
  const totalReceitas = useMemo(() => {
    return visibleTransacoes
      .filter((t) => t.tipo === 'receita')
      .reduce((acc, t) => acc + t.valor, 0);
  }, [visibleTransacoes]);

  const totalReceitasPagas = useMemo(() => {
    return visibleTransacoes
      .filter((t) => t.tipo === 'receita' && t.status === 'pago')
      .reduce((acc, t) => acc + t.valor, 0);
  }, [visibleTransacoes]);

  const totalDespesasFixasVariaveis = useMemo(() => {
    return visibleTransacoes
      .filter((t) => t.tipo === 'despesa')
      .reduce((acc, t) => acc + t.valor, 0);
  }, [visibleTransacoes]);

  const totalReembolsosGeral = useMemo(() => {
    return visibleDespesas.reduce((acc, d) => acc + d.valor, 0);
  }, [visibleDespesas]);

  const totalSalariosMensais = useMemo(() => {
    return salarios.reduce((acc, s) => acc + s.valor_base, 0);
  }, [salarios]);

  // Médias Salariais por Hierarquia
  const mediasPorFuncao = useMemo(() => {
    const roleMap = new Map(employees.map((e) => [e.id, e.funcao]));
    const groups = {
      filmmaker: [] as number[],
      modelo: [] as number[],
      interno: [] as number[],
    };
    salarios.forEach((s) => {
      const role = roleMap.get(s.employee_id);
      if (role === 'filmmaker') groups.filmmaker.push(s.valor_base);
      else if (role === 'modelo') groups.modelo.push(s.valor_base);
      else if (role === 'interno') groups.interno.push(s.valor_base);
    });
    const avg = (arr: number[], fallback: number) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : fallback;
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

    return {
      filmmaker: { media: avg(groups.filmmaker, 0), total: sum(groups.filmmaker), qtd: groups.filmmaker.length },
      modelo: { media: avg(groups.modelo, 0), total: sum(groups.modelo), qtd: groups.modelo.length },
      interno: { media: avg(groups.interno, 0), total: sum(groups.interno), qtd: groups.interno.length },
    };
  }, [salarios, employees]);

  // Total Geral de Despesas Operacionais (Transações + Salários + Reembolsos)
  const totalDespesasGeral = totalDespesasFixasVariaveis + totalSalariosMensais + totalReembolsosGeral;

  // Lucro Operacional Líquido
  const lucroLiquido = totalReceitas - totalDespesasGeral;
  const margemLucro = totalReceitas > 0 ? (lucroLiquido / totalReceitas) * 100 : 0;

  // Reembolsos Pendentes de Gravação
  const reembolsosPendentes = useMemo(() => {
    return visibleDespesas.filter((d) => d.status === 'pendente');
  }, [visibleDespesas]);

  const valorReembolsosPendentes = useMemo(() => {
    return reembolsosPendentes.reduce((acc, d) => acc + d.valor, 0);
  }, [reembolsosPendentes]);

  // Despesas por Categoria para Gráfico
  const despesasPorCategoria = useMemo(() => {
    const map: Record<string, number> = {
      'Folha Salarial Equipe (Internos, Modelos & Filmmakers)': totalSalariosMensais,
      'Reembolsos de Campo (Uber, Alimentação, Insumos)': totalReembolsosGeral,
      'Sede, Estúdio & Infraestrutura': 0,
      'Softwares, Adobe, IA & Servidores': 0,
      'Impostos (Simples Nacional) & Contabilidade': 0,
      'Tráfego Pago & Manutenção de Equipamentos': 0,
    };

    visibleTransacoes
      .filter((t) => t.tipo === 'despesa')
      .forEach((t) => {
        const desc = t.descricao.toLowerCase();
        if (t.categoria === 'custo_gravacao') map['Reembolsos de Campo (Uber, Alimentação, Insumos)'] += t.valor;
        else if (desc.includes('sede') || desc.includes('aluguel') || desc.includes('energia') || desc.includes('fibra')) {
          map['Sede, Estúdio & Infraestrutura'] += t.valor;
        } else if (t.categoria === 'software_infra') map['Softwares, Adobe, IA & Servidores'] += t.valor;
        else if (t.categoria === 'impostos') map['Impostos (Simples Nacional) & Contabilidade'] += t.valor;
        else map['Tráfego Pago & Manutenção de Equipamentos'] += t.valor;
      });

    return Object.entries(map).map(([nome, valor]) => ({
      nome,
      valor,
      porcentagem: totalDespesasGeral > 0 ? (valor / totalDespesasGeral) * 100 : 0,
    }));
  }, [visibleTransacoes, totalSalariosMensais, totalReembolsosGeral, totalDespesasGeral]);

  // Ranking de Custos de Gravação por Restaurante
  const custosPorRestaurante = useMemo(() => {
    const map: Record<string, { total: number; qtd: number }> = {};
    visibleDespesas.forEach((d) => {
      const nome = d.client_nome || 'Restaurante';
      if (!map[nome]) map[nome] = { total: 0, qtd: 0 };
      map[nome].total += d.valor;
      map[nome].qtd += 1;
    });

    return Object.entries(map)
      .map(([nome, info]) => ({ nome, total: info.total, qtd: info.qtd }))
      .sort((a, b) => b.total - a.total);
  }, [visibleDespesas]);

  const filteredTransacoes = useMemo(() => {
    return visibleTransacoes.filter((t) => {
      const matchSearch =
        t.descricao.toLowerCase().includes(searchTransacao.toLowerCase()) ||
        (t.cliente_nome && t.cliente_nome.toLowerCase().includes(searchTransacao.toLowerCase())) ||
        (t.employee_nome && t.employee_nome.toLowerCase().includes(searchTransacao.toLowerCase()));

      const matchFilter =
        transacaoFilter === 'todas' ||
        (transacaoFilter === 'receita' && t.tipo === 'receita') ||
        (transacaoFilter === 'despesa' && t.tipo === 'despesa') ||
        (transacaoFilter === 'pendente' && t.status === 'pendente');

      return matchSearch && matchFilter;
    });
  }, [visibleTransacoes, searchTransacao, transacaoFilter]);

  // Proteção: Apenas Gestores (Donos & Gerentes)
  if (!canManage) {
    return (
      <div className="py-16 text-center rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] p-8 flex flex-col items-center gap-4 max-w-xl mx-auto my-12 animate-in fade-in">

        <h3 className="text-xl font-bold text-foreground font-heading">
          Acesso Restrito ao Controle Financeiro
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
          Este módulo é restrito exclusivamente para os gestores e diretores da agência (Felipe, Gui, Matheus, Alexandre e Larissa).
        </p>
        <p className="text-xs text-zinc-500">
          Colaboradores de campo (filmmakers e modelos) podem registrar seus reembolsos diretamente na aba Reembolsos.
        </p>
      </div>
    );
  }

  // Submissão de Nova Transação Real
  const handleCreateTransacao = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(novoValor.replace(',', '.'));
    if (!val || val <= 0) {
      alert('Informe um valor numérico válido.');
      return;
    }
    if (!novaDescricao.trim()) {
      alert('Informe a descrição do lançamento.');
      return;
    }

    const client = clients.find((c) => c.id === novoClientId);

    addTransacao({
      tipo: novoTipo,
      categoria: novaCategoria,
      descricao: novaDescricao.trim(),
      valor: val,
      data_vencimento: novoVencimento,
      data_pagamento: null,
      status: 'pendente',
      client_id: novoClientId || null,
      forma_pagamento: novoFormaPagamento,
      cliente_nome: client?.nome,
    });

    setIsModalOpen(false);
    setNovaDescricao('');
    setNovoValor('');
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-150">
      {/* Top Banner / Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-sm">
        <div className="flex items-start gap-3.5">

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground font-heading">
                Controle Financeiro Executivo
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Apenas Gestores
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Gestão central de receitas de mensalidades, gastos operacionais da agência, folha salarial por hierarquia e auditoria de reembolsos de gravações.
            </p>
          </div>
        </div>

        {/* Botão Novo Lançamento Real */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground font-bold text-xs shadow-md shadow-[var(--ui-accent)]/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento Real</span>
          </button>
        </div>
      </div>

      {/* Painel de Transparência: Dados Simulados vs Dados Reais */}
      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/25 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">

          <div className="text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-foreground">Identificação Clara: Dados Simulados vs Dados Reais</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {countSimTransacoes + countSimDespesas} Simulados (Demonstração)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {countRealTransacoes + countRealDespesas} Lançamentos Reais
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Itens com selo <strong className="text-amber-300">SIMULADO</strong> compõem a simulação financeira da agência. Qualquer lançamento ou reembolso criado pela equipe recebe o selo <strong className="text-emerald-400">REAL</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[var(--ui-surface)] p-1 rounded-xl border border-[var(--ui-border)] shrink-0 self-start lg:self-center">
          <button
            type="button"
            onClick={() => setOriginFilter('todos')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              originFilter === 'todos'
                ? 'brand-solid bg-[var(--ui-accent)] text-foreground'
                : 'text-zinc-400 hover:text-foreground'
            }`}
          >
            Todos (Reais + Simulados)
          </button>
          <button
            type="button"
            onClick={() => setOriginFilter('reais')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              originFilter === 'reais'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                : 'text-zinc-400 hover:text-foreground'
            }`}
          >
            <Database className="w-3 h-3" />
            <span>Apenas Reais ({countRealTransacoes + countRealDespesas})</span>
          </button>
          <button
            type="button"
            onClick={() => setOriginFilter('simulados')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              originFilter === 'simulados'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                : 'text-zinc-400 hover:text-foreground'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Apenas Simulados ({countSimTransacoes + countSimDespesas})</span>
          </button>
        </div>
      </div>

      {/* Cards de KPIs Financeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Total Prevista */}
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Receitas Mensais (Clientes)</span>

          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-foreground font-heading font-mono">
              R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-0.5">
              <Check className="w-3.5 h-3.5" />
              <span>R$ {totalReceitasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} já liquidados</span>
            </div>
          </div>
        </div>

        {/* Despesas Operacionais Totais */}
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Gastos Totais da Agência</span>

          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-rose-400 font-heading font-mono">
              R$ {totalDespesasGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-zinc-500">
              Folha (R$ {totalSalariosMensais.toLocaleString('pt-BR')}) + Sede/Softwares/Reembolsos
            </span>
          </div>
        </div>

        {/* Lucro Operacional & Margem */}
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Resultado / Caixa Operacional</span>

          </div>
          <div className="mt-2">
            <div className={`text-2xl font-extrabold font-heading font-mono ${
              lucroLiquido >= 0 ? 'text-sky-400' : 'text-amber-400'
            }`}>
              R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-zinc-400">
              Margem operacional: <strong className="text-foreground">{margemLucro.toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        {/* Reembolsos de Gravação */}
        <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Reembolsos de Campo</span>

          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-amber-400 font-heading font-mono">
              R$ {totalReembolsosGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-zinc-400">
              R$ {valorReembolsosPendentes.toFixed(2)} pendentes ({reembolsosPendentes.length} notas)
            </span>
          </div>
        </div>
      </div>

      {/* Painel de Médias Salariais por Hierarquia (Filmmakers 3.000 | Modelos 3.500 | Internos 5.000) */}
      <div className="p-5 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--ui-border)]">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Benchmarking de Remuneração da Agência
            </span>
            <h3 className="text-base font-bold text-foreground">
              Média de Ganhos Mensais por Hierarquia
            </h3>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 self-start sm:self-center">
            SIMULADO • Base Salarial Configurada
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">

              <div>
                <span className="text-[11px] font-bold text-sky-400 uppercase block">Filmmakers Externos</span>
                <span className="text-xs text-zinc-400">Victor, Gimenez e Henry ({mediasPorFuncao.filmmaker.qtd} PJ)</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block">Média Mensal</span>
              <span className="text-lg font-extrabold font-mono text-foreground">
                R$ {mediasPorFuncao.filmmaker.media.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-zinc-500 block font-mono">
                Total: R$ {mediasPorFuncao.filmmaker.total.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">

              <div>
                <span className="text-[11px] font-bold text-pink-400 uppercase block">Modelos Oficiais</span>
                <span className="text-xs text-zinc-400">Isadora, Giovana, Milena e Julia ({mediasPorFuncao.modelo.qtd} PJ)</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block">Média Mensal</span>
              <span className="text-lg font-extrabold font-mono text-foreground">
                R$ {mediasPorFuncao.modelo.media.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-zinc-500 block font-mono">
                Total: R$ {mediasPorFuncao.modelo.total.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">

              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase block">Funcionários Internos</span>
                <span className="text-xs text-zinc-400">Carol, Bruna, Lucas, Evelin, Júlia e Augusto ({mediasPorFuncao.interno.qtd} CLT)</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block">Média Mensal</span>
              <span className="text-lg font-extrabold font-mono text-foreground">
                R$ {mediasPorFuncao.interno.media.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-zinc-500 block font-mono">
                Total: R$ {mediasPorFuncao.interno.total.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação entre Abas */}
      <div className="flex items-center gap-1.5 p-1 bg-[var(--ui-surface)] rounded-2xl border border-[var(--ui-border)] max-w-2xl overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
            activeTab === 'dashboard'
              ? 'brand-solid bg-[var(--ui-accent)] text-foreground shadow-sm'
              : 'text-zinc-400 hover:text-foreground'
          }`}
        >
          Dashboards de Gastos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transacoes')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
            activeTab === 'transacoes'
              ? 'brand-solid bg-[var(--ui-accent)] text-foreground shadow-sm'
              : 'text-zinc-400 hover:text-foreground'
          }`}
        >
          Receitas & Despesas ({visibleTransacoes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('salarios')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
            activeTab === 'salarios'
              ? 'brand-solid bg-[var(--ui-accent)] text-foreground shadow-sm'
              : 'text-zinc-400 hover:text-foreground'
          }`}
        >
          Folha Salarial ({salarios.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('despesas_gravacao')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'despesas_gravacao'
              ? 'brand-solid bg-[var(--ui-accent)] text-foreground shadow-sm'
              : 'text-zinc-400 hover:text-foreground'
          }`}
        >
          <span>Reembolsos de Campo ({visibleDespesas.length})</span>
          {reembolsosPendentes.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {reembolsosPendentes.length}
            </span>
          )}
        </button>
      </div>

      {/* ABA 1: VISÃO GERAL & GRÁFICOS */}
      {activeTab === 'dashboard' && (
        <>
        <FinancialInsights transactions={visibleTransacoes} reimbursements={visibleDespesas} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Composição das Despesas por Categoria */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-4">
            <div className="pb-3 border-b border-[var(--ui-border)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Estrutura de Custos da Agência
                </span>
                <h3 className="text-base font-bold text-foreground">
                  Gastos Operacionais por Categoria
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Distribuição percentual de despesas da agência de marketing no mês vigente
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3.5 pt-2">
              {despesasPorCategoria.map((cat, i) => {
                const colors = [
                  'bg-emerald-500',
                  'bg-amber-500',
                  'bg-sky-500',
                  'bg-purple-500',
                  'bg-rose-500',
                  'bg-pink-500',
                ];
                const barColor = colors[i % colors.length];

                return (
                  <div key={cat.nome} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-semibold text-zinc-200 truncate">{cat.nome}</span>
                      <span className="font-mono text-foreground font-bold shrink-0">
                        R$ {cat.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({cat.porcentagem.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[var(--ui-raised)] overflow-hidden">
                      <div
                        className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                        style={{ width: `${Math.min(100, Math.max(3, cat.porcentagem))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfico 2: Custos de Gravação por Restaurante Parceiro */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-4">
            <div className="pb-3 border-b border-[var(--ui-border)]">
              <span className="text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider">
                Auditoria de Reembolsos em Campo
              </span>
              <h3 className="text-base font-bold text-foreground">
                Custos de Gravação por Restaurante
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Total acumulado de reembolsos (Uber, estacionamento, alimentação e insumos de set)
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2 max-h-[340px] overflow-y-auto pr-1">
              {custosPorRestaurante.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400">
                  Nenhuma despesa de restaurante para o filtro selecionado.
                </div>
              ) : (
                custosPorRestaurante.map((item) => {
                  const maxVal = custosPorRestaurante[0]?.total || 1;
                  const pct = (item.total / maxVal) * 100;

                  return (
                    <div key={item.nome} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{item.nome}</span>
                          <span className="text-[10px] text-zinc-500">({item.qtd} nota{item.qtd > 1 ? 's' : ''})</span>
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          R$ {item.total.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[var(--ui-raised)] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-[var(--ui-accent)] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        </>
      )}

      {/* ABA 2: CONTAS A PAGAR & RECEBER */}
      {activeTab === 'transacoes' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--ui-border)]">
            <div>
              <h3 className="text-base font-bold text-foreground">Contas a Pagar & a Receber</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Mensalidades de restaurantes clientes e despesas operacionais da agência (Sede, Adobe, Meta Ads, Contabilidade)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Buscar lançamento..."
                value={searchTransacao}
                onChange={(e) => setSearchTransacao(e.target.value)}
                className="bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] w-44"
              />

              <select
                value={transacaoFilter}
                onChange={(e) => setTransacaoFilter(e.target.value as 'todas' | 'receita' | 'despesa' | 'pendente')}
                className="bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
              >
                <option value="todas">Todas as Transações</option>
                <option value="receita">Apenas Receitas (Clientes)</option>
                <option value="despesa">Apenas Despesas (Agência)</option>
                <option value="pendente">Apenas Pendentes</option>
              </select>
            </div>
          </div>

          {filteredTransacoes.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-400 bg-[var(--ui-raised)] rounded-2xl border border-[var(--ui-border)]">
              Nenhuma transação encontrada com os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[var(--ui-border)] text-zinc-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Origem</th>
                    <th className="py-2.5 px-3">Tipo / Descrição</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3">Vencimento</th>
                    <th className="py-2.5 px-3 text-right">Valor</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ui-border)]">
                  {filteredTransacoes.map((t) => {
                    const isIncome = t.tipo === 'receita';
                    const isPaid = t.status === 'pago';
                    const isSim = isSimulatedRecord(t.id);

                    return (
                      <tr key={t.id} className="hover:bg-[var(--ui-raised)]/50 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap">
                          {isSim ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              SIMULADO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              REAL
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isIncome ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            <div>
                              <span className="font-bold text-foreground block">{t.descricao}</span>
                              <span className="text-[10px] text-zinc-400">
                                {t.cliente_nome || t.employee_nome || 'Navegando MKT'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-zinc-300">
                          <span className="px-2 py-0.5 rounded-md bg-[var(--ui-raised)] border border-[var(--ui-border)] text-[10px] uppercase font-mono">
                            {t.categoria.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono text-zinc-400">
                          {new Date(`${t.data_vencimento}T12:00:00`).toLocaleDateString('pt-BR')}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                          <span className={isIncome ? 'text-emerald-400' : 'text-rose-400'}>
                            {isIncome ? '+ ' : '- '} R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {isPaid ? 'Pago' : 'Pendente'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          {!isPaid ? (
                            <button
                              type="button"
                              onClick={() => updateTransacaoStatus(t.id, 'pago')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Marcar como Pago"
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Baixar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateTransacaoStatus(t.id, 'pendente')}
                              className="text-[10px] text-zinc-500 hover:text-zinc-300 cursor-pointer"
                            >
                              Reabrir
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ABA 3: SALÁRIOS DA EQUIPE */}
      {activeTab === 'salarios' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--ui-border)]">
            <div>
              <h3 className="text-base font-bold text-foreground">Folha de Pagamento & Salários por Hierarquia</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Médias configuradas: Filmmakers R$ 3.000 • Modelos R$ 3.500 • Internos CLT R$ 5.000 ({salarios.length} integrantes)
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Folha Total Mensal</span>
              <span className="text-base font-mono font-bold text-rose-400">
                R$ {totalSalariosMensais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salarios.map((s) => {
              const isPaid = s.status_mes_atual === 'pago';
              const isEditingThis = editingSalId === s.employee_id;

              return (
                <div
                  key={s.employee_id}
                  className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex flex-col justify-between gap-3 shadow-sm hover:border-[var(--ui-accent)]/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-foreground">{s.nome}</h4>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          BASE SIMULADA
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 block">{s.cargo}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--ui-surface)] text-amber-400 border border-amber-500/20 mt-1 inline-block">
                        Contrato: {s.tipo_contrato.toUpperCase()}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isPaid
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {isPaid ? 'Pago' : 'Pendente'}
                    </span>
                  </div>

                  {isEditingThis ? (
                    <div className="pt-2 border-t border-[var(--ui-border)] flex flex-col gap-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-0.5">Valor Base (R$)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editSalValor}
                            onChange={(e) => setEditSalValor(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-[var(--ui-surface)] border border-[var(--ui-border)] text-foreground text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-0.5">Dia Pagto.</label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={editSalDia}
                            onChange={(e) => setEditSalDia(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-[var(--ui-surface)] border border-[var(--ui-border)] text-foreground text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-0.5">Contrato</label>
                          <select
                            value={editSalContrato}
                            onChange={(e) => setEditSalContrato(e.target.value as 'clt' | 'pj' | 'freelancer_diaria')}
                            className="w-full px-2 py-1.5 rounded-lg bg-[var(--ui-surface)] border border-[var(--ui-border)] text-foreground text-xs"
                          >
                            <option value="clt">CLT</option>
                            <option value="pj">PJ</option>
                            <option value="freelancer_diaria">Diária</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-0.5">Chave PIX</label>
                          <input
                            type="text"
                            placeholder="CPF, E-mail, Celular..."
                            value={editSalPix}
                            onChange={(e) => setEditSalPix(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-[var(--ui-surface)] border border-[var(--ui-border)] text-foreground text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingSalId(null)}
                          className="px-2.5 py-1 rounded-lg bg-[var(--ui-surface)] text-zinc-400 text-[11px] cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateSalario(s.employee_id, {
                              valor_base: Math.max(0, Number(editSalValor) || 0),
                              dia_pagamento: Math.min(31, Math.max(1, Number(editSalDia) || 5)),
                              tipo_contrato: editSalContrato,
                              chave_pix: editSalPix.trim(),
                            });
                            setEditingSalId(null);
                          }}
                          className="px-2.5 py-1 rounded-lg brand-solid bg-[var(--ui-accent)] text-foreground font-bold text-[11px] cursor-pointer"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-[var(--ui-border)] flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 text-[11px]">Salário / Remuneração:</span>
                        <span className="font-mono font-bold text-foreground text-sm">
                          R$ {s.valor_base.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>Dia do Pagamento:</span>
                        <span className="font-mono text-zinc-200">Todo dia {s.dia_pagamento}</span>
                      </div>

                      {s.chave_pix && (
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span>Chave PIX:</span>
                          <span className="font-mono text-emerald-400 truncate max-w-[170px]" title={s.chave_pix}>
                            {s.chave_pix}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1.5 border-t border-[var(--ui-border)]/60">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSalId(s.employee_id);
                            setEditSalValor(String(s.valor_base || ''));
                            setEditSalDia(String(s.dia_pagamento || 5));
                            setEditSalContrato(s.tipo_contrato);
                            setEditSalPix(s.chave_pix || '');
                          }}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-[var(--ui-surface)] hover:bg-[var(--ui-hover)] border border-[var(--ui-border)] text-zinc-200 font-semibold text-[11px] cursor-pointer"
                        >
                          Ajustar Valor / PIX
                        </button>
                        {!isPaid ? (
                          <button
                            type="button"
                            onClick={() => markSalarioPago(s.employee_id)}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] cursor-pointer"
                          >
                            Marcar Pago
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateSalario(s.employee_id, { status_mes_atual: 'pendente' })}
                            className="py-1.5 px-2.5 rounded-lg bg-[var(--ui-surface)] text-zinc-400 hover:text-zinc-200 text-[11px] cursor-pointer"
                          >
                            Reabrir
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 4: AUDITORIA DE DESPESAS DE GRAVAÇÃO */}
      {activeTab === 'despesas_gravacao' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--ui-border)]">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Auditoria de Custos & Reembolsos das Gravações
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Despesas submetidas pelos colaboradores em campo (Uber, alimentação, estacionamento e insumos)
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Pendentes de Reembolso</span>
              <span className="text-base font-mono font-bold text-amber-400">
                R$ {valorReembolsosPendentes.toFixed(2)} ({reembolsosPendentes.length})
              </span>
            </div>
          </div>

          {visibleDespesas.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-400 bg-[var(--ui-raised)] rounded-2xl border border-[var(--ui-border)]">
              Nenhuma despesa de gravação encontrada para o filtro selecionado.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleDespesas.map((d) => {
                const isPending = d.status === 'pendente';
                const isReimbursed = d.status === 'reembolsado';
                const isSim = isSimulatedRecord(d.id);

                return (
                  <div
                    key={d.id}
                    className="p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {isSim ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            SIMULADO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            REAL
                          </span>
                        )}
                        <span className="font-bold text-foreground text-sm">{d.descricao}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isReimbursed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isPending
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        }`}>
                          {isReimbursed ? 'Reembolsado' : isPending ? 'Pendente' : 'Aprovado'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                        <span className="text-foreground font-semibold">{d.employee_nome}</span>
                        <span>•</span>
                        <span>{d.client_nome || 'Restaurante'}</span>
                        <span>•</span>
                        <span className="uppercase font-mono">{d.categoria}</span>
                        <span>•</span>
                        <span>Data: {new Date(`${d.data}T12:00:00`).toLocaleDateString('pt-BR')}</span>
                      </div>

                      {d.comprovante_url && (
                        <div className="pt-1">
                          <a
                            href={d.comprovante_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#38bdf8] text-[11px] hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Visualizar Comprovante Fiscal</span>
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 uppercase block">Valor</span>
                        <span className="font-mono font-bold text-foreground text-base">
                          R$ {d.valor.toFixed(2)}
                        </span>
                      </div>

                      {isPending && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateDespesaStatus(d.id, 'reembolsado')}
                            className="px-3 py-1.5 rounded-xl brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Aprovar e pagar reembolso via PIX"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Reembolsar PIX</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Novo Lançamento Financeiro Real */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--ui-border)]">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">Novo Lançamento Financeiro</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  REGISTRO REAL
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-foreground cursor-pointer"
               data-text-action="true"><span className="text-action-label">{"Fechar"}</span></button>
            </div>

            <form onSubmit={handleCreateTransacao} className="flex flex-col gap-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--ui-raised)] rounded-xl border border-[var(--ui-border)]">
                <button
                  type="button"
                  onClick={() => {
                    setNovoTipo('receita');
                    setNovaCategoria('mensalidade_cliente');
                  }}
                  className={`py-2 rounded-lg font-bold transition-all cursor-pointer text-center ${
                    novoTipo === 'receita'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-foreground'
                  }`}
                >
                  Receita (Entrada)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNovoTipo('despesa');
                    setNovaCategoria('software_infra');
                  }}
                  className={`py-2 rounded-lg font-bold transition-all cursor-pointer text-center ${
                    novoTipo === 'despesa'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-foreground'
                  }`}
                >
                  Despesa (Saída)
                </button>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Descrição *</label>
                <input
                  type="text"
                  placeholder="Ex: Mensalidade Restaurante X ou Aluguel Sede"
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Valor (R$) *</label>
                  <input
                    type="text"
                    placeholder="Ex: 3800,00"
                    value={novoValor}
                    onChange={(e) => setNovoValor(e.target.value)}
                    className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Data Vencimento *</label>
                  <input
                    type="date"
                    value={novoVencimento}
                    onChange={(e) => setNovoVencimento(e.target.value)}
                    className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Restaurante Vinculado (Opcional)</label>
                <select
                  value={novoClientId}
                  onChange={(e) => setNovoClientId(e.target.value)}
                  className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                >
                  <option value="">Nenhum (Geral da Agência)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--ui-border)] mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-zinc-400 hover:text-foreground cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground font-bold cursor-pointer"
                >
                  Salvar Lançamento Real
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
