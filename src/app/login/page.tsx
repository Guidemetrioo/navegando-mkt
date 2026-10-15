'use client';

import React from 'react';
import { AgendaProvider, useAgenda } from '@/context/AgendaContext';
import { LoginCheckInView } from '@/components/auth/LoginCheckInView';
import { useRouter } from 'next/navigation';

function LoginContent() {
  const { isAuthenticated } = useAgenda();
  const router = useRouter();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  return <LoginCheckInView />;
}

export default function LoginPage() {
  return (
    <AgendaProvider>
      <LoginContent />
    </AgendaProvider>
  );
}
