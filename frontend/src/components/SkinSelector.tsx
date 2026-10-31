import React, { useState, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';

export type SkinTheme =
  | 'hyperframe-tactical'
  | 'obsidian-linear'
  | 'kinetic-studio'
  | 'tactile-bento'
  | 'editorial-swiss'
  | 'neo-brutal';

interface SkinOption {
  id: SkinTheme;
  name: string;
  tag: string;
  accent: string;
  bgPreview: string;
}

const SKINS: SkinOption[] = [
  {
    id: 'hyperframe-tactical',
    name: 'Hyperframe Tactical',
    tag: 'HUD / Hardware 2026',
    accent: '#06B6D4',
    bgPreview: '#050811'
  },
  {
    id: 'obsidian-linear',
    name: 'Obsidian Linear',
    tag: 'Luxury Dark',
    accent: '#10B981',
    bgPreview: '#050507'
  },
  {
    id: 'kinetic-studio',
    name: 'Kinetic Studio',
    tag: 'High-Impact Production',
    accent: '#CCFF00',
    bgPreview: '#09090B'
  },
  {
    id: 'tactile-bento',
    name: 'Tactile Bento',
    tag: 'Titanium Hardware',
    accent: '#F97316',
    bgPreview: '#111113'
  },
  {
    id: 'editorial-swiss',
    name: 'Editorial Swiss',
    tag: 'Swiss Paper Minimal',
    accent: '#FF4F00',
    bgPreview: '#F7F6F2'
  },
  {
    id: 'neo-brutal',
    name: 'Neo Brutal',
    tag: '3D Physical Buttons',
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
    return 'hyperframe-tactical';
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-skin', currentSkin);
    try {
      localStorage.setItem('voxa_skin_theme', currentSkin);
    } catch {}
  }, [currentSkin]);

  const activeOption = SKINS.find(s => s.id === currentSkin) || SKINS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ui-btn-secondary flex items-center gap-2 py-1.5 px-3 min-h-[38px] shadow-sm group"
        title="Cambiar Skin / Motor Visual"
      >
        <Palette className="w-3.5 h-3.5 text-[var(--accent-primary)] group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
          {activeOption.name}
        </span>
        <span
          className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-xs"
          style={{ backgroundColor: activeOption.accent }}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-2 shadow-2xl z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[var(--accent-primary)]" />
                // SKINS REGISTRY 2026
              </span>
              <span className="text-[9px] text-[var(--accent-primary)] font-mono font-bold bg-[var(--accent-primary)]/10 px-1.5 py-0.5 rounded">
                6 PRESETS
              </span>
            </div>

            <div className="space-y-1 mt-1.5">
              {SKINS.map((skin) => (
                <button
                  key={skin.id}
                  onClick={() => {
                    setCurrentSkin(skin.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    currentSkin === skin.id
                      ? 'bg-[var(--accent-primary)]/15 border border-[var(--border-highlight)] text-[var(--text-primary)] font-bold'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-5 h-5 rounded-md border border-[var(--border-subtle)] flex items-center justify-center shrink-0 shadow-inner"
                      style={{ backgroundColor: skin.bgPreview }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: skin.accent }}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold leading-tight font-mono">{skin.name}</div>
                      <div className="text-[9px] text-[var(--text-muted)] font-normal">{skin.tag}</div>
                    </div>
                  </div>
                  {currentSkin === skin.id && (
                    <Check className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
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
