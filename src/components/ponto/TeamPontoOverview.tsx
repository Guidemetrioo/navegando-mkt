'use client';

import type { Employee, PontoRegistro } from '@/types/database';
import { teamPontoHistory } from '@/lib/ponto-history';

interface Props {
  employees: Employee[];
  pontos: PontoRegistro[];
  employeeId: string;
  onPhoto: (photo: { url: string; nome: string; dataHora: string }) => void;
}

export function TeamPontoOverview({ employees, pontos, employeeId, onPhoto }: Props) {
  const team = teamPontoHistory(employees, pontos, employeeId);
  return (
    <section aria-labelledby="team-attendance-title" className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4">
      <h3 id="team-attendance-title" className="text-base font-semibold text-foreground">Presença da equipe</h3>
      <p className="mt-1 mb-4 text-xs text-zinc-400">{team.filter(row => row.registros.length).length} de {team.length} funcionários com ponto nos filtros selecionados. Foto da batida mais recente; todas as batidas estão no histórico abaixo.</p>
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-3 gap-3">
        {team.map(({ employee, registros }) => {
          const latest = registros[0];
          const date = latest ? new Date(latest.data_hora).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '';
          return (
            <article key={employee.id} aria-label={`Ponto de ${employee.nome}`} className="flex items-start gap-3 rounded-xl border border-[var(--ui-border)] p-3 min-w-0">
              {latest?.foto_url ? (
                <button type="button" aria-label={`Ampliar último ponto de ${employee.nome}`}
                  className="shrink-0 rounded-lg overflow-hidden border border-[var(--ui-border)]"
                  onClick={() => onPhoto({ url: latest.foto_url, nome: employee.nome, dataHora: date })}>
                  {/* Private signed URLs and local captured photos must remain unoptimized. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={latest.foto_url} alt={`Foto do ponto de ${employee.nome}`} className="w-20 h-24 object-cover" />
                </button>
              ) : <div aria-label={`Espaço de foto vazio de ${employee.nome}`} className="w-20 h-24 shrink-0 rounded-lg border border-dashed border-[var(--ui-border)]" />}
              <div className="min-w-0 text-xs">
                <h4 className="text-sm font-semibold text-foreground break-words">{employee.nome}</h4>
                <p className="text-zinc-400 mt-1">{employee.cargo_detalhado || employee.funcao}</p>
                {latest ? <>
                  <p className="mt-2 text-foreground font-medium">{date}</p>
                  <p className="text-zinc-400">{{ entrada: 'Entrada', almoco: 'Almoço', saida: 'Saída' }[latest.tipo]} · {registros.length} batida(s)</p>
                  <a href={`https://www.google.com/maps?q=${latest.latitude},${latest.longitude}`} target="_blank" rel="noopener noreferrer"
                    className="block mt-1 text-[var(--ui-accent)] underline break-words">{latest.latitude.toFixed(5)}, {latest.longitude.toFixed(5)}</a>
                  {!latest.foto_url && <p className="mt-1 text-zinc-400">Foto não disponível</p>}
                </> : <p className="mt-2 text-zinc-400">Sem ponto no período</p>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
