'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type GeoPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface RealLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
  road?: string;
  suburb?: string;
  city?: string;
  state?: string;
}

export function useRealGeolocation() {
  const [permissionState, setPermissionState] = useState<GeoPermissionState>('prompt');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [location, setLocation] = useState<RealLocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isFetchingAddress = useRef(false);

  // Verificar status de permissão inicial
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      queueMicrotask(()=>setPermissionState('unsupported'));
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((permission) => {
          setPermissionState(permission.state as GeoPermissionState);
          permission.onchange = () => {
            setPermissionState(permission.state as GeoPermissionState);
          };
        })
        .catch(() => {
          // Em navegadores onde query não suporta geolocation
          setPermissionState('prompt');
        });
    }
  }, []);

  // Buscar endereço reverso via endpoint local
  const fetchAddress = async (lat: number, lng: number) => {
    if (isFetchingAddress.current) return;
    isFetchingAddress.current = true;

    try {
      const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (data.success && data.address) {
        setLocation((prev) =>
          prev
            ? {
                ...prev,
                address: data.address,
                road: data.details?.road,
                suburb: data.details?.suburb,
                city: data.details?.city,
                state: data.details?.state,
              }
            : null
        );
      }
    } catch (e) {
      console.warn('Falha ao obter endereço reverso:', e);
    } finally {
      isFetchingAddress.current = false;
    }
  };

  // Solicitar permissão e obter coordenadas reais do dispositivo
  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocalização não é suportada neste navegador ou dispositivo.');
      queueMicrotask(()=>setPermissionState('unsupported'));
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newLoc: RealLocationData = {
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          timestamp: position.timestamp,
        };
        setLocation(newLoc);
        setPermissionState('granted');
        setIsLocating(false);

        // Buscar nome da rua e bairro
        fetchAddress(latitude, longitude);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionState('denied');
          setError(
            'Permissão de localização foi negada no seu navegador. Clique no ícone de cadeado na barra de endereços para permitir.'
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Sinal de GPS indisponível no momento.');
        } else if (err.code === err.TIMEOUT) {
          setError('Tempo esgotado ao buscar sinal GPS.');
        } else {
          setError('Não foi possível obter sua localização exata.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, []);

  return {
    permissionState,
    isLocating,
    location,
    error,
    requestLocation,
    hasLocation: Boolean(location),
  };
}
