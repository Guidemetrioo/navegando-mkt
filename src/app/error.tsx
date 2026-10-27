'use client';
import { useEffect } from 'react';
export default function ErrorBoundary({error,reset}:{error:Error & {digest?:string};reset:()=>void}) {
  useEffect(()=>{console.error(JSON.stringify({event:'interface_error',digest:error.digest || 'client',at:new Date().toISOString()}));},[error]);
  return <main className="min-h-svh grid place-content-center gap-5 p-8"><h1 className="text-2xl">Esta tela não pôde ser carregada.</h1><p>Não repita um cadastro sem conferir o status de sincronização. Os registros já confirmados permanecem na base.</p><button onClick={reset} className="gradient-cta rounded-lg p-3">Tentar abrir novamente</button></main>;
}
