'use client';

import React from 'react';
import { useRealGeolocation } from '@/hooks/useRealGeolocation';
import { useAgenda } from '@/context/AgendaContext';
import { calculateDistanceMeters, formatDistance, MAX_GEOFENCE_RADIUS_METERS, DEFAULT_CLIENT_COORDINATES } from '@/lib/geo-utils';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Compass,
  ExternalLink,
  ShieldCheck,
  Building,
  Camera,
} from 'lucide-react';

export function LiveLocationRadar() {
  const { permissionState, isLocating, location, error, requestLocation } = useRealGeolocation();
  const { clients, openPontoModal } = useAgenda();

  // Calcular distâncias até todos os clientes restaurantes
  const restaurantsWithDistance = clients.map((client) => {
    const coords =
      (client.latitude && client.longitude
        ? { lat: client.latitude, lng: client.longitude }
        : DEFAULT_CLIENT_COORDINATES[client.id]) || null;

    let distance: number | null = null;
    let isInside = false;

    if (coords && location) {
      distance = calculateDistanceMeters(
        location.latitude,
        location.longitude,
        coords.lat,
        coords.lng
      );
      isInside = distance <= MAX_GEOFENCE_RADIUS_METERS;
    }

    return {
      client,
      distance,
      isInside,
    };
  }).sort((a, b) => (a.distance ?? 999999) - (b.distance ?? 999999));

  const nearest = restaurantsWithDistance[0];

  return (
    <div className="w-full bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white rounded-3xl border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 overflow-hidden shadow-lg p-5 sm:p-6 flex flex-col gap-5">
      {/* 1. Header do Radar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-100">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-[var(--ui-accent)]/10 text-[var(--ui-accent)] border border-[var(--ui-accent)]/30 shrink-0">
            <Compass className={`w-6 h-6 ${isLocating ? 'animate-spin' : ''}`} />
            {location && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-foreground dark:text-foreground text-zinc-900 font-heading">
                Localização Real do Dispositivo (GPS)
              </h3>
              {location && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Ao Vivo
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-400 text-zinc-500 mt-0.5">
              Validação automática de presença física nos restaurantes parceiros da Navegando MKT.
            </p>
          </div>
        </div>

        {/* Botão de Solicitação / Atualização */}
        <button
          type="button"
          onClick={requestLocation}
          disabled={isLocating}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer self-start sm:self-auto ${
            location
              ? 'bg-[var(--ui-raised)] hover:bg-[var(--ui-hover)] text-zinc-200 border border-[var(--ui-border)]'
              : 'brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground shadow-[var(--ui-accent)]/25 hover:scale-105 active:scale-95'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>
            {isLocating
              ? 'Obtendo GPS...'
              : location
              ? 'Atualizar Minha Posição'
              : 'Solicitar Permissão de GPS'}
          </span>
        </button>
      </div>

      {/* 2. Banner de Permissão (Quando ainda não foi concedida ou foi negada) */}
      {!location && (
        <div>
          {permissionState === 'denied' ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="font-bold text-amber-300">
                  Permissão de Localização Bloqueada no Navegador
                </span>
                <p className="text-zinc-300">
                  Para registrar o ponto e calcular a distância até os restaurantes:
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-zinc-400 mt-1">
                  <li>Clique no ícone de <strong>cadeado ou configurações</strong> na barra de endereços (ao lado de localhost:3000).</li>
                  <li>Altere a opção <strong>Localização</strong> para <strong>&quot;Permitir&quot;</strong>.</li>
                  <li>Recarregue a página ou clique em &quot;Solicitar Permissão de GPS&quot;.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[var(--ui-raised)] via-[var(--ui-surface)] to-[var(--ui-raised)] border border-[var(--ui-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
                  <Navigation className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Permita o acesso à sua localização
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5 max-w-md">
                    O navegador exibirá um alerta perguntando se você permite o acesso. Clique em <strong>&quot;Permitir&quot;</strong> para carregar seu endereço real e o mapa interativo.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={requestLocation}
                disabled={isLocating}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-foreground font-bold text-xs shadow-lg shadow-sky-500/25 transition-all cursor-pointer whitespace-nowrap"
              >
                {isLocating ? 'Aguardando Permissão...' : 'Conceder Permissão Agora'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. DETALHES DA LOCALIZAÇÃO REAL + MAPA INTERATIVO */}
      {location && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-300">
          {/* Coluna Esquerda: Endereço & Coordenadas */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              {/* Card de Endereço Real */}
              <div className="p-4 rounded-2xl bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[var(--ui-accent)]" />
                    Endereço Real Detectado
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Precisão: ±{location.accuracy}m
                  </span>
                </div>

                <div className="text-sm sm:text-base font-bold text-foreground dark:text-foreground text-zinc-900 leading-snug">
                  {location.address || 'Carregando nome da rua e bairro...'}
                </div>

                <div className="pt-2 border-t border-[var(--ui-border)] flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>Lat: {location.latitude.toFixed(6)}</span>
                  <span>Lng: {location.longitude.toFixed(6)}</span>
                </div>
              </div>

              {/* Status com o Restaurante Mais Próximo */}
              {nearest && nearest.distance !== null && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                    nearest.isInside
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-zinc-800/50 border-[var(--ui-border)] text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {nearest.isInside ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Building className="w-5 h-5 text-zinc-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-foreground">
                        {nearest.isInside ? 'Você está no restaurante!' : 'Restaurante mais próximo:'}
                      </div>
                      <div className="text-xs text-zinc-400">
                        <strong>{nearest.client.nome}</strong> está a{' '}
                        <span className="font-bold text-foreground">{formatDistance(nearest.distance)}</span> de você.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openPontoModal(nearest.client.id, undefined, 'entrada')}
                    className="flex items-center gap-1 brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Bater Ponto</span>
                  </button>
                </div>
              )}
            </div>

            {/* Link Externo para Google Maps */}
            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Sinal GPS Autenticado pelo Navegador
              </span>
              <a
                href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#38bdf8] hover:underline font-semibold"
              >
                <span>Abrir no Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Coluna Direita: Mapa Interativo OpenStreetMap Incorporado */}
          <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-[var(--ui-border)] shadow-inner bg-[var(--ui-surface)] relative min-h-[240px]">
            <iframe
              title="Mapa em Tempo Real"
              width="100%"
              height="100%"
              className="w-full h-full min-h-[240px] border-0"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                location.longitude - 0.006
              },${location.latitude - 0.005},${location.longitude + 0.006},${
                location.latitude + 0.005
              }&layer=mapnik&marker=${location.latitude},${location.longitude}`}
            />
            <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] text-foreground font-mono border border-[var(--ui-border)] flex items-center gap-1.5 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sua posição atual</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Radar de Distâncias até os 6 Restaurantes Clientes */}
      {location && (
        <div className="flex flex-col gap-2.5 pt-2 border-t border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-400 uppercase tracking-wider">
              Distância até os Restaurantes da Escala
            </span>
            <span className="text-[11px] text-zinc-500">Raio de tolerância: {MAX_GEOFENCE_RADIUS_METERS}m</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {restaurantsWithDistance.map(({ client, distance, isInside }) => (
              <div
                key={client.id}
                onClick={() => openPontoModal(client.id, undefined, 'entrada')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isInside
                    ? 'bg-emerald-500/10 border-emerald-500/40 hover:border-emerald-500'
                    : 'bg-[var(--ui-raised)] border-[var(--ui-border)] hover:border-[var(--ui-accent)]/40'
                }`}
                title={`Clique para bater ponto em ${client.nome}`}
              >
                <div className="font-bold text-xs text-foreground truncate">{client.nome}</div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className={isInside ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                    {formatDistance(distance)}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      isInside
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {isInside ? 'NO LOCAL' : 'DISTANTE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
