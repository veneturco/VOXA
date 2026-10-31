import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// PWA Service Worker Registration (Instalación en teléfonos y computadoras)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('✅ [PWA] Service Worker registrado con éxito:', reg.scope);
      })
      .catch((err) => {
        console.warn('⚠️ [PWA] Error al registrar Service Worker:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
