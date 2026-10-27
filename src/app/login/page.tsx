'use client';

import React from 'react';
import { IS_DEMO } from '@/lib/app-mode';
import { ProductionLogin } from '@/components/auth/ProductionLogin';
import { AgendaProvider, useAgenda } from '@/context/AgendaContext';
import { LoginCheckInView } from '@/components/auth/LoginCheckInView';
import { useRouter } from 'next/navigation';

function LoginContent() {
  const { isAuthenticated, syncStatus, syncMessage } = useAgenda();
  const router = useRouter();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  return IS_DEMO ? <LoginCheckInView /> : <ProductionLogin loading={syncStatus==='loading'} feedback={syncMessage} />;
}

export default function LoginPage() {
  return (
    <AgendaProvider>
      <LoginContent />
    </AgendaProvider>
  );
}
