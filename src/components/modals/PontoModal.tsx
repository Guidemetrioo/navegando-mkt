'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { PontoTipo, PontoStatus, Client } from '@/types/database';
import { EmployeeBadge } from '../agenda/EmployeeBadge';
import {
  calculateDistanceMeters,
  formatDistance,
  MAX_GEOFENCE_RADIUS_METERS,
  DEFAULT_CLIENT_COORDINATES,
} from '@/lib/geo-utils';
import {
  X,
  Camera,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Building,
  Upload,
  Compass,
  Check,
  Video,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export function PontoModal() {
  const {
    isPontoModalOpen,
    pontoModalConfig,
    closePontoModal,
    addPonto,
    employees,
    clients,
    events,
    loggedEmployeeId,
    setLoggedEmployeeId,
  } = useAgenda();

  // Estados do formulário
  const [employeeId, setEmployeeId] = useState(loggedEmployeeId);
  const [tipo, setTipo] = useState<PontoTipo>('entrada');
  const [clientId, setClientId] = useState('');
  const [eventId, setEventId] = useState<string | null>(null);
  const [observacao, setObservacao] = useState('');

  // Estados de Câmera / Foto
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Estados de GPS / Geolocalização Real
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [realAddress, setRealAddress] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Sucesso / Comprovante
  const [submittedPonto, setSubmittedPonto] = useState<any | null>(null);

  // Relógio em tempo real
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Membro atual
  const currentMember = employees.find((e) => e.id === employeeId) || employees[0];

  // Iniciar webcam
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Câmera indisponível ou permissão negada:', err);
      setCameraError('Câmera não permitida ou indisponível. Você pode enviar uma foto ou selfie.');
      setIsCameraActive(false);
    }
  }, []);

  // Parar webcam
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Capturar foto da webcam
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoDataUrl(dataUrl);
      stopCamera();
    }
  };

  // Upload alternativo de foto
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoDataUrl(event.target?.result as string);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  // Obter geolocalização real do navegador solicitando permissão ao dispositivo
  const requestGeolocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoError('Geolocalização não é suportada por este dispositivo.');
      setPermissionState('unsupported');
      return;
    }
    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setAccuracy(Math.round(pos.coords.accuracy));
        setPermissionState('granted');
        setIsLocating(false);

        // Buscar endereço real reverso (Rua, Bairro, Cidade)
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
          const data = await res.json();
          if (data.success && data.address) {
            setRealAddress(data.address);
          }
        } catch (e) {
          console.warn('Erro ao obter endereço reverso:', e);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionState('denied');
          setGeoError('Permissão de GPS foi negada no navegador. Permita o acesso à localização para registrar o ponto.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError('Sinal de GPS indisponível no dispositivo.');
        } else if (err.code === err.TIMEOUT) {
          setGeoError('Tempo esgotado ao buscar sinal GPS.');
        } else {
          setGeoError('Não foi possível obter a posição GPS precisa.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  // Inicializar dados ao abrir modal
  useEffect(() => {
    if (isPontoModalOpen) {
      setEmployeeId(loggedEmployeeId);
      setTipo(pontoModalConfig?.tipo || 'entrada');
      setSubmittedPonto(null);
      setPhotoDataUrl(null);
      setObservacao('');

      // Descobrir gravação de hoje para este membro
      const todayIso = '2026-10-14';
      const scheduledEvent = events.find(
        (ev) =>
          ev.data === todayIso &&
          (ev.assigned_employee_ids || []).includes(loggedEmployeeId)
      );

      const targetClientId =
        pontoModalConfig?.preselectedClientId ||
        (scheduledEvent ? scheduledEvent.client_id : clients[0]?.id || '');

      setClientId(targetClientId);
      setEventId(pontoModalConfig?.preselectedEventId || (scheduledEvent ? scheduledEvent.id : null));

      // Iniciar câmera e obter localização automaticamente
      startCamera();
      requestGeolocation();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [
    isPontoModalOpen,
    pontoModalConfig,
    loggedEmployeeId,
    events,
    clients,
    startCamera,
    requestGeolocation,
    stopCamera,
  ]);

  if (!isPontoModalOpen) return null;

  // Cliente restaurante selecionado
  const selectedClient = clients.find((c) => c.id === clientId);

  // Calcular distância até o restaurante
  let distanceMeters: number | null = null;
  let statusLocalizacao: PontoStatus = 'fora_do_raio';

  if (latitude !== null && longitude !== null && selectedClient) {
    const clientCoords =
      (selectedClient.latitude && selectedClient.longitude
        ? { lat: selectedClient.latitude, lng: selectedClient.longitude }
        : DEFAULT_CLIENT_COORDINATES[selectedClient.id]) || null;

    if (clientCoords) {
      distanceMeters = calculateDistanceMeters(
        latitude,
        longitude,
        clientCoords.lat,
        clientCoords.lng
      );
      statusLocalizacao = distanceMeters <= MAX_GEOFENCE_RADIUS_METERS ? 'no_local' : 'fora_do_raio';
    }
  }

  const isInsideRadius = statusLocalizacao === 'no_local';

  // Submeter registro de ponto
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoDataUrl) {
      alert('A FOTO REAL É OBRIGATÓRIA para registrar o ponto. Por favor, tire uma selfie com a câmera ou carregue a foto real tirada no local.');
      return;
    }

    if (latitude === null || longitude === null) {
      alert('A LOCALIZAÇÃO GPS REAL É OBRIGATÓRIA. Por favor, permita o acesso ao GPS do dispositivo e clique em "Atualizar GPS".');
      return;
    }

    const now = new Date();
    const finalLat = latitude;
    const finalLng = longitude;
    const finalDist = distanceMeters ?? 0;

    const novoPonto = addPonto({
      employee_id: employeeId,
      client_id: clientId || null,
      event_id: eventId || null,
      tipo,
      data_hora: now.toISOString(),
      foto_url: photoDataUrl,
      latitude: finalLat,
      longitude: finalLng,
      precisao_metros: accuracy ?? 10,
      distancia_metros: finalDist,
      status_localizacao: statusLocalizacao,
      endereco: realAddress || undefined,
      observacao: observacao.trim() || undefined,
    });

    setSubmittedPonto(novoPonto);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
      onClick={closePontoModal}
    >
      <div
        className="relative w-full max-w-xl bg-[#16171b] dark:bg-[#16171b] bg-white rounded-t-3xl sm:rounded-3xl border-t sm:border border-[#2b2d35] dark:border-[#2b2d35] border-slate-200 shadow-2xl p-5 sm:p-7 flex flex-col gap-5 max-h-[92vh] overflow-y-auto pb-safe sm:pb-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar para mobile */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700 mx-auto -mt-1 sm:hidden shrink-0" />

        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-[#26282f] dark:border-[#26282f] border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF5A3C] to-[#e04a2f] flex items-center justify-center text-white shadow-lg shadow-[#FF5A3C]/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-white dark:text-white text-zinc-900 font-heading">
                  Ponto de Gravação
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  GPS + Foto
                </span>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-400 text-zinc-500 mt-0.5">
                Comprovação digital de chegada no restaurante cliente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closePontoModal}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#26282f] dark:hover:bg-[#26282f] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TELA DE COMPROVANTE (Após bater o ponto) */}
        {submittedPonto ? (
          <div className="flex flex-col items-center text-center gap-5 py-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-xl shadow-emerald-500/10">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-white dark:text-white text-zinc-900 font-heading">
                Ponto de {submittedPonto.tipo === 'entrada' ? 'Entrada' : 'Saída'} Confirmado!
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Comprovante digital registrado com sucesso nos servidores Navegando MKT.
              </p>
            </div>

            {/* Cartão Comprovante */}
            <div className="w-full bg-[#1b1d22] dark:bg-[#1b1d22] bg-slate-50 border border-[#2b2d35] dark:border-[#2b2d35] border-slate-200 rounded-2xl p-4 text-left flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#2b2d35]">
                <div className="flex items-center gap-2">
                  <EmployeeBadge employee={currentMember} size="md" showRole />
                </div>
                <span className="text-xs font-mono font-bold text-[#FF5A3C]">
                  {currentTime}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Restaurante:</span>
                  <div className="font-bold text-white dark:text-white text-zinc-900 truncate">
                    {selectedClient?.nome || 'Cliente'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Localização:</span>
                  <div className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {statusLocalizacao === 'no_local'
                      ? `No Local (${formatDistance(submittedPonto.distancia_metros)})`
                      : 'Fora do Raio'}
                  </div>
                </div>
              </div>

              {submittedPonto.endereco && (
                <div className="p-2.5 rounded-xl bg-[#26282f] border border-[#32353e] flex flex-col gap-0.5">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#FF5A3C]" />
                    Endereço GPS Detectado:
                  </span>
                  <div className="text-xs font-medium text-white">
                    {submittedPonto.endereco}
                  </div>
                </div>
              )}

              {submittedPonto.foto_url && (
                <div className="mt-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Selfie de Comprovação:
                  </span>
                  <img
                    src={submittedPonto.foto_url}
                    alt="Foto do Ponto"
                    className="w-24 h-24 object-cover rounded-xl border border-[#2b2d35] shadow-md"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-[#2b2d35] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>HASH: #{submittedPonto.id.slice(-8).toUpperCase()}</span>
                <span>GPS: {submittedPonto.latitude.toFixed(4)}, {submittedPonto.longitude.toFixed(4)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={closePontoModal}
              className="w-full bg-[#FF5A3C] hover:bg-[#e04a2f] text-white font-semibold py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-[#FF5A3C]/20"
            >
              Concluir & Fechar
            </button>
          </div>
        ) : (
          /* FORMULÁRIO DE PONTO */
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* 1. Seleção de Tipo e Membro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tipo: Entrada ou Saída */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">
                  Tipo de Registro
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#1c1d22] dark:bg-[#1c1d22] bg-slate-100 rounded-xl border border-[#2b2d35]">
                  <button
                    type="button"
                    onClick={() => setTipo('entrada')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      tipo === 'entrada'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    🟢 Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('saida')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      tipo === 'saida'
                        ? 'bg-[#FF5A3C] text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    🔴 Saída
                  </button>
                </div>
              </div>

              {/* Membro da Equipe */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">
                  Membro Escalado
                </label>
                <select
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    setLoggedEmployeeId(e.target.value);
                  }}
                  className="w-full bg-[#1c1d22] dark:bg-[#1c1d22] bg-slate-100 text-zinc-200 border border-[#2b2d35] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
                >
                  <optgroup label="🎥 Filmmakers" className="bg-[#1b1d22] text-[#38bdf8] font-bold">
                    {employees
                      .filter((e) => e.funcao === 'filmmaker')
                      .map((emp) => (
                        <option key={emp.id} value={emp.id} className="bg-[#1b1d22] text-white font-normal">
                          {emp.nome} (Filmmaker)
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="✨ Meninas dos Vídeos" className="bg-[#1b1d22] text-[#f472b6] font-bold">
                    {employees
                      .filter((e) => e.funcao === 'criadora')
                      .map((emp) => (
                        <option key={emp.id} value={emp.id} className="bg-[#1b1d22] text-white font-normal">
                          {emp.nome} (Criadora)
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* 2. Restaurante Cliente */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">
                Restaurante / Local da Gravação
              </label>
              <div className="relative">
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-[#1c1d22] dark:bg-[#1c1d22] bg-slate-50 text-white dark:text-white text-zinc-900 border border-[#2b2d35] dark:border-[#2b2d35] border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
                  required
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#1b1d22] text-white">
                      {c.nome} {c.endereco ? `— ${c.endereco}` : ''}
                    </option>
                  ))}
                </select>
                <Building className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 3. CAPTURA DE FOTO / SELFIE */}
            <div className="p-3.5 rounded-2xl bg-[#1b1d22] dark:bg-[#1b1d22] bg-slate-50 border border-[#2b2d35] dark:border-[#2b2d35] border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white dark:text-white text-zinc-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#FF5A3C]" />
                  Selfie de Comprovação *
                </span>
                <span className="text-[11px] text-zinc-400">
                  {photoDataUrl ? 'Foto Capturada ✅' : 'Tire a foto no local'}
                </span>
              </div>

              {photoDataUrl ? (
                /* Preview da Foto Capturada */
                <div className="relative w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl group">
                  <img
                    src={photoDataUrl}
                    alt="Selfie Comprovação"
                    className="w-full h-56 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoDataUrl(null);
                        startCamera();
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-zinc-900 font-bold text-xs shadow-lg hover:scale-105 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Tirar Outra Foto
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 py-1 px-2 rounded-lg bg-black/60 backdrop-blur-sm text-[10px] text-white font-mono flex items-center justify-between">
                    <span>{currentTime}</span>
                    <span className="text-emerald-400 font-bold">Foto validada</span>
                  </div>
                </div>
              ) : (
                /* Visualizador da Webcam ao vivo */
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden bg-black border border-[#2b2d35] flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover mirror"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    {!isCameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center gap-2 bg-[#121316]">
                        <Camera className="w-8 h-8 text-zinc-500 animate-pulse" />
                        <span className="text-xs text-zinc-400">
                          {cameraError || 'Ativando câmera...'}
                        </span>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-3 py-1.5 rounded-xl bg-[#26282f] text-xs text-white hover:bg-[#32353e] transition-colors cursor-pointer"
                        >
                          Tentar Ativar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação da Foto */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      disabled={!isCameraActive}
                      className="flex items-center gap-2 bg-[#FF5A3C] hover:bg-[#e04a2f] disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-[#FF5A3C]/20 transition-all cursor-pointer active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>📸 Tirar Foto / Selfie</span>
                    </button>

                    {/* Fallback de upload */}
                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#26282f] hover:bg-[#32353e] text-zinc-300 text-xs font-medium cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Enviar arquivo</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* 4. GEOLOCALIZAÇÃO & VALIDAÇÃO DO RESTAURANTE */}
            <div className="p-3.5 rounded-2xl bg-[#1b1d22] dark:bg-[#1b1d22] bg-slate-50 border border-[#2b2d35] dark:border-[#2b2d35] border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white dark:text-white text-zinc-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#38bdf8]" />
                  Geolocalização (GPS Real)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={requestGeolocation}
                    disabled={isLocating}
                    className="flex items-center gap-1 text-[11px] text-[#38bdf8] hover:underline cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Obtendo GPS...' : 'Atualizar GPS'}</span>
                  </button>
                </div>
              </div>

              {/* Se o GPS foi negado ou houve erro */}
              {(permissionState === 'denied' || geoError) && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="font-bold">Permissão de GPS no Navegador</span>
                    <span className="text-[11px] text-zinc-300">
                      {geoError ||
                        'Permissão negada. Clique no ícone de configurações/cadeado na barra de endereços e marque "Permitir Localização".'}
                    </span>
                  </div>
                </div>
              )}

              {/* Se temos latitude e longitude */}
              {latitude !== null && longitude !== null ? (
                <div className="flex flex-col gap-2.5">
                  {/* Endereço Real Detectado */}
                  <div className="p-2.5 rounded-xl bg-[#26282f] border border-[#32353e] flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase font-semibold">
                      <span>Endereço Atual Detectado</span>
                      {accuracy && (
                        <span className="text-emerald-400 font-normal">
                          Precisão: ±{accuracy}m
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>{realAddress || 'Buscando nome da rua e bairro via satélite...'}</span>
                    </div>
                  </div>

                  {/* Status do Raio de Distância */}
                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                      isInsideRadius
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isInsideRadius ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <div>
                        <span>
                          {isInsideRadius
                            ? 'Dentro do raio do restaurante'
                            : 'Atenção: Fora do raio do restaurante'}
                        </span>
                        {distanceMeters !== null && (
                          <span className="block text-[11px] font-normal opacity-90">
                            Distância calculada: <strong>{formatDistance(distanceMeters)}</strong> (Raio máximo permitido: {MAX_GEOFENCE_RADIUS_METERS}m)
                          </span>
                        )}
                      </div>
                    </div>

                    <a
                      href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] underline shrink-0 hover:opacity-80"
                    >
                      Google Maps ↗
                    </a>
                  </div>

                  {/* Mini Mapa Interativo OpenStreetMap */}
                  <div className="w-full h-32 rounded-xl overflow-hidden border border-[#2b2d35] relative shadow-inner bg-[#121316]">
                    <iframe
                      title="Mapa do Ponto"
                      width="100%"
                      height="100%"
                      className="w-full h-full border-0 pointer-events-none"
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                        longitude - 0.005
                      },${latitude - 0.004},${longitude + 0.005},${
                        latitude + 0.004
                      }&layer=mapnik&marker=${latitude},${longitude}`}
                    />
                    <div className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] text-white font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>Sua Posição GPS</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 font-mono">
                    <span>
                      {latitude.toFixed(5)}, {longitude.toFixed(5)}
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                      GPS Real Ativo
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#26282f] border border-[#32353e] flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center">
                    <Compass className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Permissão de Localização do Dispositivo Obrigatória
                    </h5>
                    <p className="text-[11px] text-zinc-400 max-w-xs mt-0.5">
                      Para validar sua presença física no restaurante com precisão, autorize o acesso ao GPS do aparelho.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={requestGeolocation}
                      disabled={isLocating}
                      className="px-5 py-2.5 rounded-xl bg-[#FF5A3C] hover:bg-[#e04a2f] active:scale-95 text-white font-bold text-xs shadow-md shadow-[#FF5A3C]/30 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{isLocating ? 'Conectando Satélite...' : '📍 Ativar GPS do Dispositivo'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Observação Opcional */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">
                Observação (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Chegada antecipada, iluminação pronta, gravação iniciada..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="w-full bg-[#1c1d22] dark:bg-[#1c1d22] bg-slate-50 border border-[#2b2d35] rounded-xl px-3 py-2 text-xs text-white dark:text-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C]"
              />
            </div>

            {/* 6. Botão de Envio */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={closePontoModal}
                className="flex-1 py-3 px-4 rounded-xl border border-[#2b2d35] text-zinc-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-[2] py-3 px-4 rounded-xl bg-[#FF5A3C] hover:bg-[#e04a2f] text-white text-xs font-bold shadow-lg shadow-[#FF5A3C]/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Confirmar Ponto de {tipo === 'entrada' ? 'Entrada' : 'Saída'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
