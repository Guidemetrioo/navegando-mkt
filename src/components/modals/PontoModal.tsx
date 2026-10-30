'use client';
import { todayInSaoPaulo } from '@/lib/date-utils';

import { IS_DEMO } from '@/lib/app-mode';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { PontoTipo, PontoStatus, PontoRegistro, Client } from '@/types/database';
import { EmployeeBadge } from '../agenda/EmployeeBadge';
import { USERS_DATABASE } from '@/lib/auth-users';
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
    pontos,
    syncStatus,
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
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
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
  const [submittedPontoDraft, setSubmittedPonto] = useState<PontoRegistro | null>(null);

  const submittedPonto=submittedPontoDraft ? pontos.find(p=>p.id===submittedPontoDraft.id) || submittedPontoDraft : null;

  const isConfirmed=Boolean(!IS_DEMO && submittedPonto?.photo_storage_path && syncStatus==='saved');

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

  // Iniciar webcam com suporte a Frontal/Traseira
  const startCamera = useCallback(async (facing: 'user' | 'environment' = cameraFacing) => {
    try {
      setCameraError(null);
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraError('Câmera não disponível no navegador. Selecione ou tire uma foto pelo botão abaixo.');
        setIsCameraActive(false);
        return;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.warn);
        };
      }
      setIsCameraActive(true);
    } catch (err: unknown) {
      console.warn('Câmera indisponível ou permissão negada:', err);
      setCameraError('Câmera não permitida ou indisponível. Carregue uma foto da pessoa pelo botão abaixo.');
      setIsCameraActive(false);
    }
  }, [cameraFacing]);

  // Garantir que a stream de vídeo seja vinculada ao elemento <video> assim que ele for renderizado
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(console.warn);
      }
    }
  }, [isCameraActive]);

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Parar webcam
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Capturar foto real da webcam da pessoa ou gerar comprovação de identificação
  const capturePhoto = () => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const width = 640;
    const height = 480;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const video = videoRef.current;
    if (video && video.videoWidth > 0 && isCameraActive) {
      ctx.save();
      if (cameraFacing === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, width, height);
      ctx.restore();
    } else {
      // Fallback de alta fidelidade visual corporativa caso o dispositivo não possua hardware de webcam
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Gradiente suave
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Círculo com inicial do colaborador
      const emp = currentMember;
      const hue = emp?.cor || 200;
      ctx.fillStyle = `hsl(${hue}, 70%, 45%)`;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2 - 35, 75, 0, Math.PI * 2);
      ctx.fill();

      // Iniciais
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 52px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initials = (emp?.nome || 'NK')
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      ctx.fillText(initials, width / 2, height / 2 - 35);

      // Nome do colaborador
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(emp?.nome || 'Colaborador', width / 2, height / 2 + 75);

      // Cargo / Função
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(emp?.cargo_detalhado || (emp?.funcao === 'filmmaker' ? 'Filmmaker Gastronômico' : 'Equipe Navegando MKT'), width / 2, height / 2 + 105);

      // Barra de carimbo temporal
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, height - 45, width, 45);

      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'left';
      ctx.fillText(`VALIDAÇÃO DIGITAL • ${new Date().toLocaleTimeString('pt-BR')}`, 20, height - 18);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(selectedClient?.nome || 'Sede Navegando MKT', width - 20, height - 18);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setPhotoDataUrl(dataUrl);
    stopCamera();
  };

  // Upload de foto real do colaborador
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setPhotoDataUrl(result);
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseOfficialCoords = () => {
    const coords =
      (selectedClient?.latitude && selectedClient?.longitude
        ? { lat: selectedClient.latitude, lng: selectedClient.longitude }
        : DEFAULT_CLIENT_COORDINATES[selectedClient?.id || 'cli-sede']) || { lat: -23.5615, lng: -46.6560 };
    setLatitude(coords.lat);
    setLongitude(coords.lng);
    setAccuracy(5);
    setPermissionState('granted');
    setGeoError(null);
    setRealAddress('');
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the evidence draft on opening and synchronize camera lifecycle.
      setEmployeeId(loggedEmployeeId);
      setTipo(pontoModalConfig?.tipo || 'entrada');
      setSubmittedPonto(null);
      setPhotoDataUrl(null);
      setObservacao('');

      // Descobrir gravação de hoje para este membro
      const todayIso = todayInSaoPaulo();
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
  let statusLocalizacao: PontoStatus = 'no_local';

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
      alert('A foto de comprovação é obrigatória. Por favor, tire uma foto com a câmera ou carregue uma foto do colaborador.');
      return;
    }

    const finalPhoto = photoDataUrl;

    if (latitude === null || longitude === null || !accuracy || permissionState !== 'granted') {
      alert('Permita o GPS e aguarde uma localização real antes de registrar o ponto.');
      return;
    }
    const finalLat = latitude;
    const finalLng = longitude;
    const finalDist = distanceMeters ?? undefined;
    const finalStatus = statusLocalizacao;

    const now = new Date();
    const exactIso = now.toISOString();

    const novoPonto = addPonto({
      employee_id: employeeId,
      client_id: clientId || null,
      event_id: eventId || null,
      tipo,
      data_hora: exactIso,
      foto_url: finalPhoto,
      latitude: finalLat,
      longitude: finalLng,
      precisao_metros: accuracy ?? 5,
      distancia_metros: finalDist,
      status_localizacao: finalStatus,
      endereco: realAddress || undefined,
      observacao: observacao.trim() || undefined,
    });

    if(novoPonto) setSubmittedPonto(novoPonto);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
      onClick={closePontoModal}
    >
      <div
        className="relative w-full max-w-xl bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] bg-white rounded-t-3xl sm:rounded-3xl border-t sm:border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 shadow-2xl p-5 sm:p-7 flex flex-col gap-5 max-h-[92vh] overflow-y-auto pb-safe sm:pb-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar para mobile */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700 mx-auto -mt-1 sm:hidden shrink-0" />

        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--ui-accent)] to-[var(--ui-accent-hover)] flex items-center justify-center text-foreground shadow-lg shadow-[var(--ui-accent)]/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-foreground dark:text-foreground text-zinc-900 font-heading">
                  Ponto de Gravação & Expediente
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  GPS + Foto
                </span>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-400 text-zinc-500 mt-0.5">
                Foto e localização registradas no momento da batida.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closePontoModal}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-foreground hover:bg-[var(--ui-border)] dark:hover:bg-[var(--ui-border)] hover:bg-slate-100 transition-colors cursor-pointer"
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
              <h4 className="text-xl font-bold text-foreground dark:text-foreground text-zinc-900 font-heading">
                Ponto de {submittedPonto.tipo === 'entrada' ? 'Entrada' : submittedPonto.tipo === 'almoco' ? 'Almoço (Intervalo)' : 'Saída'} {IS_DEMO ? 'salvo neste navegador' : isConfirmed ? 'confirmado na base central' : 'aguardando confirmação central'}
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Horário informado: <strong className="text-emerald-400 font-mono">{new Date(submittedPonto.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>. Aguarde o status de sincronização da base central.
              </p>
            </div>

            {/* Cartão Comprovante */}
            <div className="w-full bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 rounded-2xl p-4 text-left flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--ui-border)]">
                <div className="flex items-center gap-2">
                  <EmployeeBadge employee={currentMember} size="md" showRole />
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 justify-end">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(submittedPonto.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {new Date(submittedPonto.data_hora).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Local / Estabelecimento:</span>
                  <div className="font-bold text-foreground dark:text-foreground text-zinc-900 truncate">
                    {selectedClient?.nome || 'Sede Agência Navegando MKT'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Validação GPS:</span>
                  <div className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {submittedPonto.status_localizacao === 'no_local'
                      ? `No Local (${formatDistance(submittedPonto.distancia_metros)})`
                      : `Fora do Raio (${formatDistance(submittedPonto.distancia_metros)})`}
                  </div>
                </div>
              </div>

              {submittedPonto.endereco && (
                <div className="p-2.5 rounded-xl bg-[var(--ui-border)] border border-[var(--ui-border)] flex flex-col gap-0.5">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[var(--ui-accent)]" />
                    Endereço Registrado:
                  </span>
                  <div className="text-xs font-medium text-foreground">
                    {submittedPonto.endereco}
                  </div>
                </div>
              )}

              <div className="mt-1">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Foto de Identificação do Ponto:
                </span>
                {submittedPonto.foto_url ? (
                  <img
                    src={submittedPonto.foto_url}
                    alt="Foto do Ponto"
                    className="w-28 h-28 object-cover rounded-xl border border-[var(--ui-border)] shadow-md"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-xl border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface)] flex flex-col items-center justify-center text-zinc-400 gap-1">
                    <Camera className="w-5 h-5 text-zinc-400" />
                    <span className="text-[9px] text-zinc-400">Espaço para foto</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[var(--ui-border)] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>AUTENTICAÇÃO: #{submittedPonto.id.slice(-8).toUpperCase()}</span>
                <span>GPS: {submittedPonto.latitude.toFixed(4)}, {submittedPonto.longitude.toFixed(4)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={closePontoModal}
              className="w-full brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground font-semibold py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-[var(--ui-accent)]/20"
            >
              Concluir & Fechar
            </button>
          </div>
        ) : (
          /* FORMULÁRIO DE PONTO */
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* 1. Seleção de Tipo e Membro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tipo: Entrada, Almoço ou Saída */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">
                  Tipo de Registro {currentMember?.regime === 'interno' ? '(CLT 3 Batidas)' : '(Campo)'}
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-100 rounded-xl border border-[var(--ui-border)]">
                  <button
                    type="button"
                    onClick={() => setTipo('entrada')}
                    className={`py-1.5 px-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center ${
                      tipo === 'entrada'
                        ? 'bg-emerald-500 text-foreground shadow-sm'
                        : 'text-zinc-400 hover:text-foreground'
                    }`}
                  >
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('almoco')}
                    className={`py-1.5 px-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center ${
                      tipo === 'almoco'
                        ? 'bg-amber-500 text-foreground shadow-sm'
                        : 'text-zinc-400 hover:text-foreground'
                    }`}
                  >
                    Almoço
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('saida')}
                    className={`py-1.5 px-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center ${
                      tipo === 'saida'
                        ? 'brand-solid bg-[var(--ui-accent)] text-foreground shadow-sm'
                        : 'text-zinc-400 hover:text-foreground'
                    }`}
                  >
                    Saída
                  </button>
                </div>
              </div>

              {/* Membro da Equipe */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">
                  Colaborador
                </label>
                <select
                  value={employeeId}
                  disabled={!IS_DEMO}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    setLoggedEmployeeId(e.target.value);
                  }}
                  className="w-full bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-100 text-zinc-200 border border-[var(--ui-border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                >
                  <optgroup label="Equipe Interna (CLT 3 Batidas)" className="bg-[var(--ui-raised)] text-[#10b981] font-bold">
                    {employees
                      .filter((e) => e.regime === 'interno' || e.funcao === 'interno')
                      .map((emp) => {
                        const acc = USERS_DATABASE.find((u) => u.employeeId === emp.id);
                        return (
                          <option key={emp.id} value={emp.id} className="bg-[var(--ui-raised)] text-foreground font-normal">
                            {emp.nome} ({acc?.cargo || 'Interno CLT'})
                          </option>
                        );
                      })}
                  </optgroup>
                  <optgroup label="Filmmakers (Externo - Restaurante)" className="bg-[var(--ui-raised)] text-[#38bdf8] font-bold">
                    {employees
                      .filter((e) => e.funcao === 'filmmaker')
                      .map((emp) => (
                        <option key={emp.id} value={emp.id} className="bg-[var(--ui-raised)] text-foreground font-normal">
                          {emp.nome} (Filmmaker)
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Modelos Gastronômicas (Externo)" className="bg-[var(--ui-raised)] text-[#f472b6] font-bold">
                    {employees
                      .filter((e) => e.funcao === 'modelo' || e.funcao === 'criadora')
                      .map((emp) => (
                        <option key={emp.id} value={emp.id} className="bg-[var(--ui-raised)] text-foreground font-normal">
                          {emp.nome} (Modelo)
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Gestão & Donos (Acesso Total)" className="bg-[var(--ui-raised)] text-[#fbbf24] font-bold">
                    {employees
                      .filter((e) => e.funcao === 'dono' || e.funcao === 'gerente')
                      .map((emp) => {
                        const acc = USERS_DATABASE.find((u) => u.employeeId === emp.id);
                        return (
                          <option key={emp.id} value={emp.id} className="bg-[var(--ui-raised)] text-foreground font-normal">
                            {emp.nome} ({acc?.cargo || (emp.funcao === 'dono' ? 'Dono' : 'Gerente')})
                          </option>
                        );
                      })}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Aviso de Rotina interna / Regime */}
            <div className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
              currentMember?.regime === 'interno'
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                : 'bg-sky-500/10 border-sky-500/25 text-sky-300'
            }`}>
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                {currentMember?.regime === 'interno'
                  ? 'Norma configurada pela agência: Jornada interna de seg. a sex. (máx 8h48/dia para 44h sem sábados). 3 batidas diárias: Entrada, Almoço e Saída.'
                  : 'Regime Externo (Restaurante): Ponto de Entrada e Saída no local com selfie e geolocalização por satélite (raio máx. 300m). Totalização semanal.'}
              </span>
            </div>

            {/* 2. Restaurante Cliente (Opcional) */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">
                Restaurante / Local da Gravação (Opcional)
              </label>
              <div className="relative">
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 text-foreground dark:text-foreground text-zinc-900 border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                >
                  <option value="" className="bg-[var(--ui-raised)] text-zinc-400">
                    Sem restaurante selecionado (Usar localização GPS atual / Sede)
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[var(--ui-raised)] text-foreground">
                      {c.nome} {c.endereco ? `— ${c.endereco}` : ''}
                    </option>
                  ))}
                </select>
                <Building className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 3. CAPTURA DE FOTO / SELFIE */}
            <div className="p-3.5 rounded-2xl bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground dark:text-foreground text-zinc-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[var(--ui-accent)]" />
                  Selfie de Comprovação *
                </span>
                <span className={`text-[11px] font-semibold ${photoDataUrl ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  {photoDataUrl ? 'Foto Capturada' : 'Foto obrigatória'}
                </span>
              </div>

              {photoDataUrl ? (
                /* Preview da Foto Real Capturada */
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl group">
                    <img
                      src={photoDataUrl}
                      alt="Selfie do Colaborador"
                      className="w-full h-56 object-cover"
                    />
                    <div className="absolute bottom-2 left-2 right-2 py-1 px-2.5 rounded-lg bg-black/75 backdrop-blur-sm text-[10px] text-white font-mono flex items-center justify-between">
                      <span>{currentTime}</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> Foto validada
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoDataUrl(null);
                        startCamera();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--ui-border)] hover:bg-slate-200 dark:hover:bg-zinc-800 text-foreground text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Tirar Outra Foto
                    </button>
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--ui-border)] hover:bg-slate-200 dark:hover:bg-zinc-800 text-foreground text-xs font-semibold shadow-sm cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      Trocar Arquivo
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
              ) : (
                /* Visualizador da Webcam ao vivo */
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden bg-black border border-[var(--ui-border)] flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'transform scale-x-[-1]' : ''}`}
                    />
                    {isCameraActive && (
                      <button
                        type="button"
                        onClick={toggleCameraFacing}
                        className="absolute top-2 right-2 p-2 rounded-xl bg-black/60 backdrop-blur-md text-foreground border border-[var(--ui-border)] hover:bg-black/80 active:scale-90 transition-all cursor-pointer shadow-lg z-10 flex items-center gap-1 text-[11px]"
                        title="Virar Câmera"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{cameraFacing === 'user' ? 'Frontal' : 'Traseira'}</span>
                      </button>
                    )}
                    {!isCameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center gap-2 bg-[var(--ui-surface)]">
                        <Camera className="w-8 h-8 text-zinc-500 animate-pulse" />
                        <span className="text-xs text-zinc-400">
                          {cameraError || 'Ativando câmera...'}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => startCamera()}
                            className="px-3 py-1.5 rounded-xl bg-[var(--ui-border)] text-xs text-foreground hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          >
                            Tentar Ativar Câmera
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação da Foto */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="flex items-center gap-2 brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-[var(--ui-accent)]/20 transition-all cursor-pointer active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isCameraActive ? 'Tirar Foto / Selfie' : 'Capturar Foto da Pessoa'}</span>
                    </button>

                    <label className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[var(--ui-border)] hover:bg-slate-200 dark:hover:bg-zinc-800 text-foreground text-xs font-semibold cursor-pointer transition-colors shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Carregar Foto / Arquivo</span>
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
            <div className="p-3.5 rounded-2xl bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 border border-[var(--ui-border)] dark:border-[var(--ui-border)] border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground dark:text-foreground text-zinc-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#38bdf8]" />
                  Geolocalização (GPS Real)
                </span>
                <div className="flex items-center gap-2">
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
              {(permissionState === 'denied' || geoError || (latitude === null && !isLocating)) && (
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-foreground">Localização do Estabelecimento</span>
                      <span className="text-[11px] text-zinc-300">
                        {geoError || 'Utilize as coordenadas oficiais cadastradas para o local selecionado.'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseOfficialCoords}
                    className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-black font-bold text-xs transition-all shadow shrink-0 cursor-pointer self-start sm:self-auto"
                  >
                    Confirmar Local Selecionado
                  </button>
                </div>
              )}

              {/* Se temos latitude e longitude */}
              {latitude !== null && longitude !== null ? (
                <div className="flex flex-col gap-2.5">
                  {/* Endereço Real Detectado */}
                  <div className="p-2.5 rounded-xl bg-[var(--ui-border)] border border-[var(--ui-border)] flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase font-semibold">
                      <span>Endereço Atual Detectado</span>
                      {accuracy && (
                        <span className="text-emerald-400 font-normal">
                          Precisão: ±{accuracy}m
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
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
                  <div className="w-full h-32 rounded-xl overflow-hidden border border-[var(--ui-border)] relative shadow-inner bg-[var(--ui-surface)]">
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
                    <div className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] text-foreground font-mono flex items-center gap-1">
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
                <div className="p-4 rounded-xl bg-[var(--ui-border)] border border-[var(--ui-border)] flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center">
                    <Compass className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">
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
                      className="px-5 py-2.5 rounded-xl brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] active:scale-95 text-foreground font-bold text-xs shadow-md shadow-[var(--ui-accent)]/30 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{isLocating ? 'Conectando Satélite...' : 'Ativar GPS do Dispositivo'}</span>
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
                className="w-full bg-[var(--ui-raised)] dark:bg-[var(--ui-raised)] bg-slate-50 border border-[var(--ui-border)] rounded-xl px-3 py-2 text-xs text-foreground dark:text-foreground text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
              />
            </div>

            {/* 6. Botão de Envio */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={closePontoModal}
                className="flex-1 py-3 px-4 rounded-xl border border-[var(--ui-border)] text-zinc-400 hover:text-foreground text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-[2] py-3 px-4 rounded-xl brand-solid bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-foreground text-xs font-bold shadow-lg shadow-[var(--ui-accent)]/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Confirmar Ponto de {tipo === 'entrada' ? 'Entrada' : tipo === 'almoco' ? 'Almoço (Intervalo)' : 'Saída'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
