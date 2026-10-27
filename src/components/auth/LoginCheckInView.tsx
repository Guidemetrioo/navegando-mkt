'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DesignSelector } from '@/components/design/DesignSelector';
import { useAgenda } from '@/context/AgendaContext';
import { Employee, PontoTipo, PontoStatus } from '@/types/database';
import { EmployeeBadge } from '../agenda/EmployeeBadge';
import {
  USERS_DATABASE,
  getDemoPassword,
  UserAccount,
  verifyCredentials,
  CLT_NORMS_2026,
} from '@/lib/auth-users';
import {
  calculateDistanceMeters,
  MAX_GEOFENCE_RADIUS_METERS,
  DEFAULT_CLIENT_COORDINATES,
} from '@/lib/geo-utils';
import {
  Camera,
  MapPin,
  Lock,
  User,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  Building,
  ArrowRight,
  ShieldCheck,
  Video,
  Scale,
  Calendar,
  Check,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { NavegandoLogo } from '../brand/NavegandoLogo';

export function LoginCheckInView() {
  const { clients, loginWithCheckIn, loginDirect } = useAgenda();

  // Etapa atual: 'credenciais' -> 'bater_ponto'
  const [step, setStep] = useState<'credenciais' | 'bater_ponto'>('credenciais');

  // Credenciais
  const [loginInput, setLoginInput] = useState<string>('felipe');
  const [passwordInput, setPasswordInput] = useState<string>('felipe123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Usuário autenticado aguardando batida de ponto
  const [activeUser, setActiveUser] = useState<UserAccount | null>(null);

  // Categoria de acesso rápido para facilidade de teste
  const [quickTab, setQuickTab] = useState<'donos' | 'gerentes' | 'filmmakers' | 'modelos' | 'internos'>('donos');

  // Tipo de batida do ponto
  const [pontoTipo, setPontoTipo] = useState<PontoTipo>('entrada');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');

  // Estados de Câmera / Selfie Real
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Estados de GPS
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Relógio em tempo real
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDateStr(
        now.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Preencher rápido pelas credenciais dos botões
  const handleSelectQuickUser = (user: UserAccount) => {
    setLoginInput(user.username);
    setPasswordInput(`${user.username}123`);
    setLoginError(null);
  };

  // Iniciar Câmera
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
    } catch {
      setCameraError('Câmera indisponível no navegador. Você pode usar a foto padrão ou anexar imagem.');
      setIsCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPhotoDataUrl(dataUrl);
      stopCamera();
    }
  };

  // Obter GPS Real
  const refreshLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocalização não disponível no navegador.');
      return;
    }
    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setAccuracy(Math.round(pos.coords.accuracy));
        setAddress(`Posição GPS Detectada: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        // Fallback para coordenadas padrão de São Paulo
        setLatitude(-23.5505);
        setLongitude(-46.6333);
        setAccuracy(10);
        setAddress('São Paulo - SP (Sede Agência)');
      },
      { timeout: 8000 }
    );
  }, []);

  // Etapa 1: Validar Login e Senha
  const handleProceedToPonto = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);

    const check = verifyCredentials(loginInput, passwordInput);
    if (!check.valid || !check.user) {
      setLoginError(check.error || 'Credenciais inválidas. Use seu nome e senha nome123.');
      return;
    }

    const result=loginDirect(check.user.employeeId,passwordInput);
    if(result.success) return;
    setActiveUser(check.user);

    // Configurar tipo de ponto inicial de acordo com regime
    if (check.user.regime === 'interno' || check.user.funcao === 'interno') {
      setPontoTipo('entrada');
      setAddress('Sede Agência Navegando MKT - Escritório Interno');
    } else {
      setPontoTipo('entrada');
      setSelectedClientId(clients[0]?.id || '');
      refreshLocation();
    }

    // Iniciar câmera para selfie do ponto
    startCamera();
    setStep('bater_ponto');
  };

  // Calcular distância para o restaurante se for externo
  const currentRestaurant = clients.find((c) => c.id === selectedClientId) || clients[0];
  const distanceToRestaurant = useMemo(() => {
    if (!latitude || !longitude || !currentRestaurant) return null;
    const clientCoords = DEFAULT_CLIENT_COORDINATES[currentRestaurant.id] || {
      lat: currentRestaurant.latitude ?? -23.5505,
      lng: currentRestaurant.longitude ?? -46.6333,
    };
    return calculateDistanceMeters(latitude, longitude, clientCoords.lat, clientCoords.lng);
  }, [latitude, longitude, currentRestaurant]);

  // Etapa 2: Confirmar Ponto e Entrar no Painel
  const handleConfirmPontoAndEnter = () => {
    if (!activeUser) return;

    if(!photoDataUrl || latitude===null || longitude===null || !accuracy) {setLoginError('Foto e localização reais são obrigatórias para registrar ponto.');return;}
    const photoToUse=photoDataUrl;

    const isInterno = activeUser.regime === 'interno' || activeUser.funcao === 'interno';

    let statusLoc: PontoStatus = 'no_local';
    if (!isInterno && distanceToRestaurant !== null) {
      statusLoc = distanceToRestaurant <= MAX_GEOFENCE_RADIUS_METERS ? 'no_local' : 'fora_do_raio';
    }

    const res = loginWithCheckIn(activeUser.employeeId, getDemoPassword(activeUser), {
      photoUrl: photoToUse,
      lat: latitude,
      lng: longitude,
      accuracy: accuracy,
      distancia_metros: distanceToRestaurant ?? undefined,
      address: isInterno ? 'Sede Agência Navegando MKT - Escritório Interno' : address,
      clientId: !isInterno ? selectedClientId : undefined,
      status_localizacao: statusLoc,
      tipo: pontoTipo,
      observacao: observacao.trim() || undefined,
    });

    if (res.success) {
      stopCamera();
    } else {
      setLoginError(res.error || 'Erro ao registrar ponto.');
    }
  };

  return (
    <div className="login-shell min-h-screen w-full bg-[var(--ui-page)] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-[var(--ui-accent)]/30 relative overflow-hidden fluid-glow">
      {/* Background Decorativo com Auras de Luz Laranja Gastronômica */}
      <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-[var(--ui-accent)]/12 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/4 w-[400px] h-[400px] bg-[#FF4500]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* 1. TOPO: Identidade Visual Oficial Navegando MKT */}
      <header className="login-header max-w-5xl w-full mx-auto flex items-center justify-between pb-4 border-b border-[var(--ui-border)] relative z-10">
        <NavegandoLogo variant="horizontal" size="md" showTagline withGlow={false} />

        <div className="flex items-center gap-3 text-right">
          <DesignSelector />
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold text-foreground font-mono">{currentTime}</span>
            <span className="text-[10px] text-zinc-400 capitalize">{currentDateStr}</span>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Sistema Online</span>
          </div>
        </div>
      </header>

      {/* 2. ÁREA CENTRAL: ETAPA 1 (LOGIN) vs ETAPA 2 (BATER PONTO) */}
      <main className="max-w-5xl w-full mx-auto my-auto py-6 sm:py-8 relative z-10 flex flex-col items-center">
        {/* ========================================================
            ETAPA 1: LOGIN E SENHA DE CADA FUNCIONÁRIO
            ======================================================== */}
        {step === 'credenciais' && (
          <div className="w-full max-w-xl flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Card Principal de Login com Glassmorphism */}
            <div className="p-6 sm:p-8 rounded-3xl glass-card flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-[var(--ui-accent)]/10 rounded-full blur-2xl pointer-events-none" />

              <div className="text-center space-y-2 flex flex-col items-center">
                <NavegandoLogo variant="symbol" size="lg" withGlow={false} className="mb-1" />
                <div className="flex items-center gap-1.5 justify-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] border border-[var(--ui-accent)]/30 inline-flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3" />
                    Navegando · Espaço de trabalho
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-heading text-foreground tracking-tight">
                  Acesse seu espaço de trabalho.
                </h2>
                <p className="text-xs text-zinc-400 max-w-md">
                  Digite seu usuário e senha cadastrados. O ponto eletrônico será solicitado imediatamente para liberar seu painel diário de prioridades.
                </p>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2 animate-in shake">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleProceedToPonto} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Usuário (Seu Nome)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Ex: felipe, alexandre, vitinho, isa, guilherme..."
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-xl text-sm text-foreground placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--ui-accent)] transition-all"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Padrão: nome do colaborador em minúsculas (Ex: <em>felipe</em>, <em>vitinho</em>, <em>isa</em>)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Senha de Acesso
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ex: felipe123, vitinho123..."
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-xl text-sm text-foreground placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--ui-accent)] transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Regra oficial: <strong>nome123</strong> (Ex: <em>felipe123</em>, <em>vitinho123</em>, <em>isa123</em>)
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl gradient-cta active:scale-98 text-foreground font-black text-sm shadow-xl shadow-[var(--ui-accent)]/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </form>
            </div>

            {/* SELEÇÃO RÁPIDA / CREDENCIAIS DA EQUIPE CONFORME ESPECIFICAÇÃO */}
            <div className="p-5 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Acesso Rápido por Cargo (20 Membros Oficiais)</span>
                </span>
                <span className="text-[10px] text-zinc-400">Clique para preencher login</span>
              </div>

              {/* Tabs por Categoria */}
              <div className="flex items-center gap-1 p-1 bg-[var(--ui-raised)] rounded-xl border border-[var(--ui-border)] overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setQuickTab('donos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    quickTab === 'donos' ? 'brand-solid bg-[var(--ui-accent)] text-foreground' : 'text-zinc-400 hover:text-foreground'
                  }`}
                >
                  Donos (2)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTab('gerentes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    quickTab === 'gerentes' ? 'brand-solid bg-[var(--ui-accent)] text-foreground' : 'text-zinc-400 hover:text-foreground'
                  }`}
                >
                  Gerentes (4)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTab('filmmakers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    quickTab === 'filmmakers' ? 'bg-[#38bdf8] text-black font-black' : 'text-zinc-400 hover:text-foreground'
                  }`}
                >
                  Filmmakers (3)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTab('modelos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    quickTab === 'modelos' ? 'brand-solid bg-[var(--ui-accent)] text-foreground shadow-md shadow-[var(--ui-accent)]/30' : 'text-zinc-400 hover:text-foreground'
                  }`}
                >
                  <span>Modelos & Criadoras (4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTab('internos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    quickTab === 'internos' ? 'bg-emerald-500 text-black font-black' : 'text-zinc-400 hover:text-foreground'
                  }`}
                >
                  CLT Interno (7)
                </button>
              </div>

              {/* Lista dos Funcionários da Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {USERS_DATABASE.filter((u) => {
                  if (quickTab === 'donos') return u.funcao === 'dono';
                  if (quickTab === 'gerentes') return u.funcao === 'gerente';
                  if (quickTab === 'filmmakers') return u.funcao === 'filmmaker';
                  if (quickTab === 'modelos') return u.funcao === 'modelo';
                  if (quickTab === 'internos') return u.funcao === 'interno';
                  return true;
                }).map((user) => {
                  const isSelected = loginInput.toLowerCase() === user.username.toLowerCase();
                  return (
                    <button
                      key={user.employeeId}
                      type="button"
                      onClick={() => handleSelectQuickUser(user)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--ui-accent)]/15 border-[var(--ui-accent)] text-foreground shadow-md shadow-[var(--ui-accent)]/20'
                          : 'bg-[var(--ui-surface)] border-[var(--ui-border)] text-zinc-300 hover:border-[var(--ui-border)]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-foreground truncate">
                            {user.nome}
                          </span>
                          {user.funcao === 'modelo' && (
                            <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[var(--ui-accent)]/20 text-[var(--ui-accent)] border border-[var(--ui-accent)]/30">
                              #influencer
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 block truncate mt-0.5">
                          {user.cargo}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-1 rounded-lg bg-black/60 text-[var(--ui-accent)] shrink-0 border border-[var(--ui-border)] font-bold">
                        {user.username}123
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            ETAPA 2: BATER PONTO OBRIGATÓRIO (CLT INTERNO vs EXTERNO)
            ======================================================== */}
        {step === 'bater_ponto' && activeUser && (
          <div className="w-full max-w-2xl flex flex-col gap-5 animate-in fade-in duration-200">
            {/* Header com Dados do Usuário & Regime */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-foreground font-bold text-lg shrink-0 shadow-md"
                  style={{ backgroundColor: `hsl(${activeUser.cor}, 70%, 45%)` }}
                >
                  {activeUser.nome.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground font-heading">
                      {activeUser.nome}
                    </h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 uppercase">
                      {activeUser.cargo}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Login validado: <strong className="text-foreground">@{activeUser.username}</strong> • Ponto Obrigatório
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setStep('credenciais');
                }}
                className="text-xs text-zinc-400 hover:text-foreground underline cursor-pointer self-start sm:self-auto"
              >
                Trocar de Usuário
              </button>
            </div>

            {/* SE REGIME INTERNO: NORMAS configurada pela agência COM 3 BATIDAS */}
            {(activeUser.regime === 'interno' || activeUser.funcao === 'interno') ? (
              <div className="p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-5 shadow-2xl">
                {/* Banner da Nova CLT */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Regime CLT Interno 2026/2027 • Normas Trabalhistas
                    </h4>
                    <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                      Jornada máxima de <strong>8h48min diárias</strong> de segunda a sexta-feira (44h semanais, sem necessidade de trabalho aos sábados).
                      Conforme as normas, você deve registrar o ponto <strong>apenas 3 vezes ao dia</strong>: na entrada, no almoço e na saída.
                    </p>
                  </div>
                </div>

                {/* Seleção da Batida CLT */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">
                    Qual batida do dia você está realizando agora? *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPontoTipo('entrada')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        pontoTipo === 'entrada'
                          ? 'bg-emerald-500/20 border-emerald-500 text-foreground shadow-md'
                          : 'bg-[var(--ui-raised)] border-[var(--ui-border)] text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        1ª Batida do Dia
                      </span>
                      <span className="font-bold text-sm text-foreground">Entrada Manhã</span>
                      <span className="text-[10px] text-zinc-400">Início da jornada diária</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPontoTipo('almoco')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        pontoTipo === 'almoco'
                          ? 'bg-amber-500/20 border-amber-500 text-foreground shadow-md'
                          : 'bg-[var(--ui-raised)] border-[var(--ui-border)] text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        2ª Batida CLT
                      </span>
                      <span className="font-bold text-sm text-foreground">Almoço (1h a 2h)</span>
                      <span className="text-[10px] text-zinc-400">Intervalo intrajornada</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPontoTipo('saida')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        pontoTipo === 'saida'
                          ? 'bg-rose-500/20 border-rose-500 text-foreground shadow-md'
                          : 'bg-[var(--ui-raised)] border-[var(--ui-border)] text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                        3ª Batida Final
                      </span>
                      <span className="font-bold text-sm text-foreground">Saída Expediente</span>
                      <span className="text-[10px] text-zinc-400">Encerramento da jornada</span>
                    </button>
                  </div>
                </div>

                {/* Câmera e Selfie Obrigatória */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)]">
                  <div className="relative w-32 h-32 rounded-2xl bg-black overflow-hidden border-2 border-[var(--ui-border)] shrink-0 flex items-center justify-center">
                    {photoDataUrl ? (
                      <img src={photoDataUrl} alt="Selfie" className="w-full h-full object-cover" />
                    ) : isCameraActive ? (
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
                    ) : (
                      <Camera className="w-8 h-8 text-zinc-600" />
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <span className="text-xs font-bold text-foreground">Comprovação Facial Presencial</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Obrigatório CLT
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Horário verificado: <strong className="text-foreground font-mono">{currentTime}</strong> • Local: Sede Agência Navegando MKT
                    </p>

                    <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                      {isCameraActive && !photoDataUrl ? (
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black font-bold text-xs transition-all cursor-pointer"
                        >
                          Tirar Foto Agora
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoDataUrl(null);
                            startCamera();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[var(--ui-border)] hover:bg-[var(--ui-border)] text-foreground text-xs font-medium transition-all cursor-pointer"
                        >
                          {photoDataUrl ? 'Tirar Outra Foto' : 'Reativar Câmera'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Observação Opcional */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Observação do Ponto (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Trabalho na ilha de edição com foco nos vídeos da Mooca..."
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Botão de Registro Final */}
                <button
                  type="button"
                  onClick={handleConfirmPontoAndEnter}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-black font-black text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-5 h-5" />
                  <span>Registrar {pontoTipo.toUpperCase()} & Acessar Meu Painel</span>
                </button>
              </div>
            ) : (
              /* ========================================================
                 SE REGIME EXTERNO: FILMMAKERS E MODELOS NOS RESTAURANTES
                 ======================================================== */
              <div className="p-5 sm:p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col gap-5 shadow-2xl">
                {/* Banner Equipe Externa */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#38bdf8]/10 via-[#38bdf8]/5 to-transparent border border-[#38bdf8]/20 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#38bdf8]/20 text-[#38bdf8] shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider">
                      Regime Externo (Restaurante / Campo) • Filmmakers & Modelos
                    </h4>
                    <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                      Não há carga horária diária prefixada. O ponto é registrado diretamente no restaurante na <strong>Entrada</strong> e na <strong>Saída</strong>, contabilizando as horas semanais totais.
                    </p>
                  </div>
                </div>

                {/* Seleção do Tipo (Entrada ou Saída) */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPontoTipo('entrada')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer font-bold text-xs ${
                      pontoTipo === 'entrada'
                        ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8] shadow-md'
                        : 'bg-[var(--ui-raised)] border-[var(--ui-border)] text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    Entrada no Restaurante
                  </button>

                  <button
                    type="button"
                    onClick={() => setPontoTipo('saida')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer font-bold text-xs ${
                      pontoTipo === 'saida'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-md'
                        : 'bg-[var(--ui-raised)] border-[var(--ui-border)] text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    Saída do Restaurante
                  </button>
                </div>

                {/* Seleção do Restaurante Parceiro */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Restaurante / Local da Gravação *
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-[var(--ui-raised)] border border-[var(--ui-border)] rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#38bdf8] cursor-pointer"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} {c.endereco ? `(${c.endereco})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Card de GPS e Distância até o Restaurante */}
                <div className="p-3.5 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)] flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#38bdf8]" />
                      Geolocalização do Aparelho
                    </span>
                    <span className="font-bold text-foreground block">
                      {currentRestaurant?.nome || 'Restaurante'}
                    </span>
                    <span className="text-[11px] text-zinc-400 block">
                      Distância estimada: {distanceToRestaurant !== null ? `${distanceToRestaurant} metros` : 'Calculando...'}
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    No Local &lt; 300m
                  </span>
                </div>

                {/* Câmera e Selfie no Restaurante */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[var(--ui-raised)] border border-[var(--ui-border)]">
                  <div className="relative w-32 h-32 rounded-2xl bg-black overflow-hidden border-2 border-[var(--ui-border)] shrink-0 flex items-center justify-center">
                    {photoDataUrl ? (
                      <img src={photoDataUrl} alt="Selfie" className="w-full h-full object-cover" />
                    ) : isCameraActive ? (
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
                    ) : (
                      <Camera className="w-8 h-8 text-zinc-600" />
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <span className="text-xs font-bold text-foreground">Selfie no Restaurante</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30">
                        GPS + Foto
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Horário: <strong className="text-foreground font-mono">{currentTime}</strong>
                    </p>

                    <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                      {isCameraActive && !photoDataUrl ? (
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="px-3.5 py-1.5 rounded-xl bg-[#38bdf8] hover:bg-[#0284c7] active:scale-95 text-black font-bold text-xs transition-all cursor-pointer"
                        >
                          Tirar Foto no Restaurante
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoDataUrl(null);
                            startCamera();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[var(--ui-border)] hover:bg-[var(--ui-border)] text-foreground text-xs font-medium transition-all cursor-pointer"
                        >
                          {photoDataUrl ? 'Tirar Outra Foto' : 'Reativar Câmera'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botão de Registro Externo */}
                <button
                  type="button"
                  onClick={handleConfirmPontoAndEnter}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#38bdf8] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] active:scale-95 text-black font-black text-sm shadow-xl shadow-[#38bdf8]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-5 h-5" />
                  <span>Confirmar Ponto no Restaurante & Acessar Sistema</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. RODAPÉ: Informações de Segurança */}
      <footer className="max-w-5xl w-full mx-auto pt-4 border-t border-[var(--ui-border)] text-center text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-2 relative z-10">
        <span>© 2026 Navegando MKT • Sistema Integrado de Gestão & Ponto Eletrônico</span>
        <span className="flex items-center gap-1.5 text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Normas configurada pela agência • Geolocalização & Biometria</span>
        </span>
      </footer>
    </div>
  );
}
