import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallAppBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  useEffect(() => {
    // 1. Detectar si ya está ejecutándose como PWA instalada
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // 2. Detectar si es iOS (iPhone/iPad Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIos(isAppleDevice);

    // 3. Capturar el evento nativo de instalación de Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalledSuccessfully(true);
      setDeferredPrompt(null);
      setTimeout(() => {
        setIsStandalone(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ Usuario aceptó la instalación de VOXA PWA');
        setInstalledSuccessfully(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  // Si ya está instalada o el usuario la descartó, no mostramos el banner
  if (isStandalone || dismissed) {
    return null;
  }

  // Si es Android/Chrome y aún no ha disparado beforeinstallprompt ni es iOS, permitimos instalación manual
  return (
    <>
      <div className="relative mx-4 mt-3 mb-1 p-3 md:p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-highlight)] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all animate-fadeIn">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] shrink-0">
            <Smartphone className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span>INSTALAR VOXA APP</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-semibold">
                PWA MÓVIL & PC
              </span>
            </div>
            <p className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
              Accede directamente desde tu pantalla de inicio en pantalla completa sin navegador.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-end">
          {installedSuccessfully ? (
            <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5 py-1.5 px-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
              <Check className="w-3.5 h-3.5" /> ¡Instalada con éxito!
            </span>
          ) : (
            <button
              type="button"
              onClick={handleInstallClick}
              className="ui-btn-primary px-3.5 py-1.5 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar Aplicación</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Cerrar aviso de instalación"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal / Popover para usuarios de iOS Safari */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="ui-card max-w-sm w-full p-5 space-y-4 relative border-2 border-[var(--accent-primary)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--accent-primary)]">
                <Smartphone className="w-4 h-4" />
                <span>INSTALAR EN IPHONE / IPAD</span>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="text-[var(--text-muted)] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-primary)] font-mono leading-relaxed">
              En Safari para iOS la instalación se completa en 2 toques:
            </p>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <span className="w-5 h-5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
                  <div className="mt-1 flex items-center gap-1 text-[var(--accent-secondary)]">
                    <Share className="w-4 h-4" /> (Ícono con flecha hacia arriba)
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <span className="w-5 h-5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  Desplázate hacia abajo y selecciona <strong>"Agregar a pantalla de inicio"</strong>.
                  <div className="mt-1 flex items-center gap-1 text-emerald-400">
                    <PlusSquare className="w-4 h-4" /> (Agregar a Inicio)
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full ui-btn-primary py-2 text-xs font-mono font-bold text-center cursor-pointer"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
