'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { Employee, PontoStatus } from '@/types/database';
import { EmployeeBadge } from '../agenda/EmployeeBadge';
import { verifyCredentials, DEFAULT_EMPLOYEE_CREDENTIALS } from '@/lib/auth-users';
import {
  calculateDistanceMeters,
  MAX_GEOFENCE_RADIUS_METERS,
  DEFAULT_CLIENT_COORDINATES,
  formatDistance,
} from '@/lib/geo-utils';
import {
  Camera,
  MapPin,
  Lock,
  User,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  Building,
  Upload,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Compass,
} from 'lucide-react';

export function LoginCheckInView() {
  const { employees, clients, loginWithCheckIn, loginDirect } = useAgenda();

  // Estados de Usuário e Senha
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('emp-1');
  const [password, setPassword] = useState<string>('123456');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Estados de Câmera / Foto Real
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Estados de GPS Real & Preciso (Sem simulações)
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Relógio em Tempo Real
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

  const selectedMember = employees.find((e) => e.id === selectedEmployeeId) || employees[0];

  // Iniciar Câmera com suporte a Frontal/Traseira
  const startCamera = useCallback(async (facing: 'user' | 'environment' = cameraFacing) => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Câmera indisponível:', err);
      setCameraError('Câmera não permitida ou sem suporte. Você pode capturar selfie rápida ou enviar foto.');
      setIsCameraActive(false);
    }
  }, [cameraFacing]);

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Iniciar câmera automaticamente ao carregar
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Capturar Foto Real do Rosto (Câmera ao Vivo)
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setCameraError('Câmera indisponível. Por favor, tente reativar a câmera ou envie a foto real.');
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError('Aguarde o vídeo da câmera carregar antes de bater a foto.');
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
      setPhotoDataUrl(dataUrl);
      setCameraError(null);
      stopCamera();
    }
  };

  // Upload Real de Foto (Via Câmera do Smartphone ou Arquivo)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCameraError('Formato inválido. Por favor, tire ou selecione uma imagem.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoDataUrl(event.target?.result as string);
      setCameraError(null);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  // Obter Localização GPS Real e Precisa (Via Satélite do Dispositivo)
  const refreshLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocalização não é suportada pelo seu navegador/dispositivo.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);

        setLatitude(lat);
        setLongitude(lng);
        setAccuracy(acc);

        try {
          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.address) {
              setAddress(data.address);
            } else {
              setAddress(`Posição GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)} (±${acc}m)`);
            }
          } else {
            setAddress(`Posição GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)} (±${acc}m)`);
          }
        } catch {
          setAddress(`Posição GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)} (±${acc}m)`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Erro ao capturar sinal de GPS do aparelho.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Permissão de GPS bloqueada. Ative a localização no navegador para comprovar o ponto.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Sinal de GPS indisponível no momento.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Tempo esgotado ao buscar satélite GPS. Toque em "Atualizar GPS".';
        }
        setGpsError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  // Submissão do Login + Ponto Obrigatório
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    // 1. Validação estrita de Foto Real
    if (!photoDataUrl) {
      setLoginError('A FOTO REAL DO ROSTO É OBRIGATÓRIA. Por favor, ligue a câmera ou tire a foto para registrar o ponto.');
      return;
    }

    // 2. Validação estrita de GPS Real
    if (latitude === null || longitude === null) {
      setLoginError('A LOCALIZAÇÃO GPS PRECISA É OBRIGATÓRIA. Por favor, clique em "Atualizar GPS" e autorize o acesso à localização.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 3. Cálculo de distância real caso tenha selecionado um restaurante
      let distMeters: number | undefined;
      let statusLoc: PontoStatus = 'no_local';

      if (selectedClientId && DEFAULT_CLIENT_COORDINATES[selectedClientId]) {
        const clientCoord = DEFAULT_CLIENT_COORDINATES[selectedClientId];
        distMeters = calculateDistanceMeters(latitude, longitude, clientCoord.lat, clientCoord.lng);
        statusLoc = distMeters <= MAX_GEOFENCE_RADIUS_METERS ? 'no_local' : 'fora_do_raio';
      }

      const result = loginWithCheckIn(selectedEmployeeId, password, {
        photoUrl: photoDataUrl,
        lat: latitude,
        lng: longitude,
        address: address || `Coordenadas GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        accuracy: accuracy ?? undefined,
        distancia_metros: distMeters,
        clientId: selectedClientId || undefined,
        status_localizacao: statusLoc,
      });

      if (!result.success) {
        setLoginError(result.error || 'Falha na autenticação.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Erro ao processar o ponto e login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0d0e11] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 md:p-8 animate-in fade-in duration-300">
      {/* 1. TOPO: Branding da Agência & Relógio Digital */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-3 border-b border-[#26282f]/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF5A3C] via-[#e04a2f] to-[#b32b15] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#FF5A3C]/25">
            N
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black tracking-wider text-base text-white">
                NAVEGANDO MKT
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#FF5A3C]/15 text-[#FF5A3C] border border-[#FF5A3C]/30">
                PORTAL
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Ponto Eletrônico Obrigatório & Login da Equipe
            </p>
          </div>
        </div>

        {/* Relógio Digital */}
        <div className="text-right">
          <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight flex items-center gap-1.5 justify-end">
            <Clock className="w-4 h-4 text-[#FF5A3C]" />
            <span>{currentTime || '--:--:--'}</span>
          </div>
          <div className="text-[10px] text-zinc-400 capitalize hidden sm:block">
            {currentDateStr}
          </div>
        </div>
      </header>

      {/* 2. CARD CENTRAL DE LOGIN COM PONTO ELETRÔNICO */}
      <main className="max-w-4xl w-full mx-auto my-auto py-6">
        <div className="bg-[#141519] border border-[#2b2d35] rounded-3xl p-5 sm:p-8 shadow-2xl flex flex-col gap-6">
          {/* Alerta de Diretriz */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1c1d22] border border-[#26282f]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Check-in Diário Obrigatório
                </span>
                <span className="text-[11px] text-zinc-400">
                  Para acessar o painel de tarefas e gravações, registre sua foto e localização GPS.
                </span>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30 hidden md:inline">
              GPS ATIVO
            </span>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* COLUNA ESQUERDA (6 cols): Câmera & Foto do Rosto */}
            <div className="md:col-span-6 flex flex-col gap-3">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Camera className="w-4 h-4 text-[#FF5A3C]" />
                <span>1. Foto do Ponto Eletrônico *</span>
              </span>

              {/* Viewport da Câmera / Preview */}
              <div className="relative aspect-square max-h-[320px] w-full rounded-2xl overflow-hidden bg-[#0a0b0e] border-2 border-dashed border-[#2f323c] flex flex-col items-center justify-center group shadow-inner">
                {photoDataUrl ? (
                  <>
                    <img
                      src={photoDataUrl}
                      alt="Foto do ponto capturada"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Foto Registrada
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoDataUrl(null);
                            startCamera();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-[10px] font-bold backdrop-blur-md cursor-pointer transition-colors"
                        >
                          Tirar Outra
                        </button>
                      </div>
                    </div>
                  </>
                ) : isCameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      autoPlay
                      muted
                      className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'transform scale-x-[-1]' : ''}`}
                    />
                    {/* Botão de Alternar Câmera Frontal / Traseira */}
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="absolute top-3 right-3 p-2.5 rounded-xl bg-black/60 backdrop-blur-md text-white border border-white/20 hover:bg-black/80 active:scale-90 transition-all cursor-pointer shadow-lg z-10 flex items-center gap-1 text-[11px]"
                      title="Virar Câmera"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{cameraFacing === 'user' ? 'Frontal' : 'Traseira'}</span>
                    </button>

                    {/* Moldura Guia de Rosto */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-44 h-44 rounded-full border-2 border-dashed border-[#FF5A3C]/70 animate-pulse" />
                    </div>
                    {/* Botão de Tirar Foto */}
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="absolute bottom-3 py-2.5 px-5 rounded-2xl bg-[#FF5A3C] hover:bg-[#e04a2f] active:scale-95 text-white text-xs font-bold shadow-lg shadow-[#FF5A3C]/40 flex items-center gap-2 cursor-pointer transition-all z-10"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capturar Foto do Rosto</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center gap-3 text-zinc-400">
                    <Camera className="w-10 h-10 text-zinc-500 animate-pulse" />
                    <p className="text-xs max-w-xs text-zinc-300">
                      {cameraError || 'Ative a câmera do seu dispositivo para capturar a foto do ponto.'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="px-3.5 py-2 rounded-xl bg-[#1c1d22] border border-[#2b2d35] text-white text-xs font-semibold hover:bg-[#282a32] active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Ligar Câmera</span>
                      </button>
                      <label className="px-3.5 py-2 rounded-xl bg-[#FF5A3C] hover:bg-[#e04a2f] active:scale-95 text-white text-xs font-bold shadow-lg shadow-[#FF5A3C]/30 flex items-center gap-1.5 cursor-pointer">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Abrir Câmera do Celular</span>
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

              {/* Botão de Upload Alternativo de Foto Real */}
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Ou selecione a foto capturada:</span>
                <label className="text-[#38bdf8] hover:underline cursor-pointer font-medium flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>Enviar Foto Real</span>
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

            {/* COLUNA DIREITA (6 cols): Credenciais & Localização GPS */}
            <div className="md:col-span-6 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <User className="w-4 h-4 text-[#38bdf8]" />
                  <span>2. Identificação & Credenciais</span>
                </span>

                {/* Seleção Rápida de Funcionário no Mobile (1 toque) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Selecione o seu Perfil *
                    </label>
                    <span className="text-[10px] text-zinc-400">Toque no seu nome:</span>
                  </div>

                  {/* Chips rápidos de 1-toque */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                    {employees.map((emp) => {
                      const isSelected = selectedEmployeeId === emp.id;
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            setSelectedEmployeeId(emp.id);
                            setPassword('123456');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
                            isSelected
                              ? 'bg-[#FF5A3C] text-white border-[#FF5A3C] shadow-md shadow-[#FF5A3C]/30'
                              : 'bg-[#1c1d22] text-zinc-400 border-[#2b2d35] hover:text-white'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: `hsl(${emp.cor}, 80%, 60%)` }}
                          />
                          <span>{emp.nome}</span>
                        </button>
                      );
                    })}
                  </div>

                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full bg-[#1c1d22] border border-[#2b2d35] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FF5A3C] cursor-pointer"
                  >
                    <optgroup label="Filmmakers / Câmeras">
                      {employees
                        .filter((e) => e.funcao === 'filmmaker')
                        .map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.nome} (Filmmaker)
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Criadoras de Conteúdo / Apresentação">
                      {employees
                        .filter((e) => e.funcao === 'criadora')
                        .map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.nome} (Criadora)
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Diretoria / Gestão">
                      <option value="admin">Administrador Geral (Admin)</option>
                    </optgroup>
                  </select>
                </div>

                {/* Senha */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-300">
                      Senha de Acesso *
                    </label>
                    <span className="text-[10px] text-zinc-400">Padrão: 123456</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#1c1d22] border border-[#2b2d35] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#FF5A3C] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Validação de GPS e Local de Entrada (Sem simulações, 100% Real) */}
                <div className="p-3.5 rounded-2xl bg-[#1c1d22] border border-[#2b2d35] flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>3. Localização GPS Real do Aparelho *</span>
                    </span>
                    <button
                      type="button"
                      onClick={refreshLocation}
                      disabled={isLocating}
                      className="text-[10px] text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                      <span>{isLocating ? 'Buscando satélite...' : 'Atualizar GPS'}</span>
                    </button>
                  </div>

                  {/* Estado do GPS: Erro, Buscando ou Ativo */}
                  {gpsError ? (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-[11px]">Sinal GPS Obrigatório:</span>
                        <p className="text-[10px] leading-relaxed text-zinc-300">{gpsError}</p>
                        <button
                          type="button"
                          onClick={refreshLocation}
                          className="mt-1 self-start px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] cursor-pointer"
                        >
                          Tentar Novamente
                        </button>
                      </div>
                    </div>
                  ) : latitude !== null && longitude !== null ? (
                    <div className="text-[11px] text-zinc-300 bg-[#16171b] p-2.5 rounded-xl border border-emerald-500/30 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>GPS Satélite Confirmado</span>
                        </span>
                        {accuracy !== null && (
                          <span className="text-[9px] font-mono text-zinc-400">
                            Precisão: ±{accuracy}m
                          </span>
                        )}
                      </div>
                      <div className="flex items-start gap-2">
                        <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed font-medium text-white">
                          {address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500">
                        {latitude.toFixed(5)}, {longitude.toFixed(5)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                        <span>Detectando coordenadas do satélite...</span>
                      </div>
                      <button
                        type="button"
                        onClick={refreshLocation}
                        className="text-[10px] font-bold underline cursor-pointer"
                      >
                        Autorizar
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">
                      Destino ou Base de Início:
                    </label>
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full bg-[#16171b] border border-[#2b2d35] rounded-xl px-2.5 py-2 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      <option value="">🏢 Sede da Agência Navegando MKT</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          🍽️ {c.nome} ({c.endereco?.split('-')[0] || 'São Paulo'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Botão de Confirmação Principal */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#FF5A3C] hover:bg-[#e04a2f] text-white font-bold text-sm shadow-xl shadow-[#FF5A3C]/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Validando Ponto...' : 'Bater Ponto & Entrar no Meu Painel'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* 3. RODAPÉ DE SEGURANÇA */}
      <footer className="max-w-4xl w-full mx-auto text-center py-3 border-t border-[#26282f]/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sistema Seguro • Registro com Foto, Horário Pure-Date e Satélite GPS</span>
        </span>
        <button
          type="button"
          onClick={() => {
            loginDirect('admin', 'admin123');
          }}
          className="text-zinc-400 hover:text-white transition-colors underline cursor-pointer"
        >
          Acesso Rápido para Gestão / Admin →
        </button>
      </footer>
    </div>
  );
}
