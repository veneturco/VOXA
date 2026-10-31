import React, { useState, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';

export type SkinTheme = 'obsidian' | 'cyber-telemetry' | 'editorial-light' | 'neo-brutal';

interface SkinOption {
  id: SkinTheme;
  name: string;
  tag: string;
  accent: string;
  bgPreview: string;
}

const SKINS: SkinOption[] = [
  {
    id: 'obsidian',
    name: 'Obsidian',
    tag: 'Luxury Tech Dark',
    accent: '#10B981',
    bgPreview: '#070709'
  },
  {
    id: 'cyber-telemetry',
    name: 'Cyber Telemetry',
    tag: 'Command Center',
    accent: '#06B6D4',
    bgPreview: '#030712'
  },
  {
    id: 'editorial-light',
    name: 'Editorial Light',
    tag: 'Swiss Paper',
    accent: '#FF4F00',
    bgPreview: '#F7F6F2'
  },
  {
    id: 'neo-brutal',
    name: 'Neo Brutal',
    tag: 'High Impact 3D',
    accent: '#10B981',
    bgPreview: '#EFECE6'
  }
];

export const SkinSelector: React.FC = () => {
  const [currentSkin, setCurrentSkin] = useState<SkinTheme>(() => {
    try {
      const saved = localStorage.getItem('voxa_skin_theme') as SkinTheme;
      if (saved && SKINS.some(s => s.id === saved)) return saved;
    } catch {}
    return 'obsidian';
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-skin', currentSkin);
    try {
      localStorage.setItem('voxa_skin_theme', currentSkin);
    } catch {}
  }, [currentSkin]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-xs font-semibold text-white cursor-pointer min-h-[38px] shadow-sm"
        title="Cambiar Skin / Tema Visual"
      >
        <Palette className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline capitalize">
          {SKINS.find(s => s.id === currentSkin)?.name}
        </span>
        <span
          className="w-2.5 h-2.5 rounded-full border border-white/20"
          style={{ backgroundColor: SKINS.find(s => s.id === currentSkin)?.accent }}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0F1015] border border-white/10 p-2 shadow-2xl z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Skins de Autor
              </span>
              <span className="text-[10px] text-slate-500 font-mono">v5.5</span>
            </div>

            <div className="space-y-1 mt-1">
              {SKINS.map((skin) => (
                <button
                  key={skin.id}
                  onClick={() => {
                    setCurrentSkin(skin.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    currentSkin === skin.id
                      ? 'bg-white/10 text-white font-bold border border-white/15'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-5 h-5 rounded-lg border border-white/20 flex items-center justify-center shrink-0 shadow-inner"
                      style={{ backgroundColor: skin.bgPreview }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: skin.accent }}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold leading-tight">{skin.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{skin.tag}</div>
                    </div>
                  </div>
                  {currentSkin === skin.id && (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
