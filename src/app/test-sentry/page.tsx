'use client';

import * as Sentry from '@sentry/nextjs';

export default function SentryTestPage() {
  const triggerClientError = () => {
    console.log('Disparando error de cliente...');
    throw new Error('Sentry Client Test Error - Grecia Fashion Store');
  };

  const triggerCaughtException = () => {
    try {
      const obj = {} as any;
      console.log(obj.nonExistentMethod());
    } catch (error) {
      console.log('Capturando excepción manualmente y enviando a Sentry...');
      Sentry.captureException(error, {
        tags: { section: 'testing' },
        extra: { info: 'Error capturado manualmente en página de test' }
      });
      alert('Error capturado y enviado a Sentry.');
    }
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>🧪 Panel de Prueba de Sentry</h1>
      <p>Usa estos botones para verificar que los errores se reportan correctamente a tu dashboard.</p>
      
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' }}>
        <button 
          onClick={triggerClientError}
          style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Disparar Error de Cliente (Crash)
        </button>

        <button 
          onClick={triggerCaughtException}
          style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Capturar Excepción (Sentry.captureException)
        </button>

        <button 
          onClick={() => {
            fetch('/api/test-sentry-error');
            alert('Petición al API enviada. Revisa los logs del servidor.');
          }}
          style={{ padding: '10px 20px', backgroundColor: '#f1c40f', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Disparar Error de Servidor (API)
        </button>
      </div>

      <div style={{ marginTop: '50px' }}>
        <a href="/" style={{ color: '#7f8c8d' }}>Volver al Inicio</a>
      </div>
    </div>
  );
}
