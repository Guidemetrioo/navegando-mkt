'use client';
import { useEffect, useState } from 'react';
import type { PontoRegistro } from '@/types/database';

const requests = new Map<string, Promise<string>>();
export function PontoStreet({ ponto }: { ponto: PontoRegistro }) {
  const key = `${ponto.latitude},${ponto.longitude}`;
  const [resolved, setResolved] = useState({ key: '', street: '' });
  useEffect(() => {
    if (ponto.rua) return;
    let active = true;
    if (!requests.has(key)) {
      if (requests.size >= 1000) requests.clear();
      requests.set(key, fetch(`/api/geocode/reverse?lat=${ponto.latitude}&lng=${ponto.longitude}`)
        .then(r => r.json()).then(data => data.street || 'Rua não identificada')
        .catch(() => 'Não foi possível consultar a rua'));
    }
    void requests.get(key)!.then(street => { if (active) setResolved({ key, street }); });
    return () => { active = false; };
  }, [key, ponto.latitude, ponto.longitude, ponto.rua]);
  return <span>{ponto.rua || (resolved.key === key ? resolved.street : 'Consultando rua…')}</span>;
}
