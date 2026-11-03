import React, { useState } from 'react';
import {
  ShoppingBag,
  Wrench,
  Stethoscope,
  PhoneCall,
  Percent,
  CheckCircle2,
  Check,
  Copy,
  Sparkles
} from 'lucide-react';

export function PricingLaunchModalOrCard() {
  const [copiedPlan, setCopiedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'tienda',
      name: 'Plan Tienda / Comercio',
      tagline: 'Para tiendas de ropa, calzado, comida rápida y delivery.',
      icon: ShoppingBag,
      accentColor: 'var(--accent-primary)',
      badge: 'COMERCIO 24/7',
      setupOriginal: 40,
      setupPromo: 20,
      monthlyOriginal: 25,
      monthlyPromo: '17.50',
      features: [
        'Catálogo interactivo con IA multimodal',
        'Validación de capturas de pago móvil',
        'Buffer antirráfagas de 4.5s',
        'Soporte técnico VENE TURCO prioritario'
      ]
    },
    {
      id: 'taller',
      name: 'Plan Taller & Repuestos',
      tagline: 'Para talleres mecánicos, repuestos y centros de servicio.',
      icon: Wrench,
      popular: true,
      accentColor: 'var(--accent-primary)',
      badge: 'MÁS POPULAR',
      setupOriginal: 50,
      setupPromo: 25,
      monthlyOriginal: 35,
      monthlyPromo: '24.50',
      features: [
        'Cotización de repuestos por foto/código',
        'Agendamiento de revisiones en taller',
        'Desvío de llamadas con IA Camaleón',
        'Alerta caliente de 1 clic al dueño (wa.me)'
      ]
    },
    {
      id: 'clinica',
      name: 'Plan Clínica / Consultorio',
      tagline: 'Consultorios médicos, odontología, estética y laboratorios.',
      icon: Stethoscope,
      accentColor: 'var(--accent-secondary)',
      badge: 'ALTA PRECISIÓN',
      setupOriginal: 70,
      setupPromo: 35,
      monthlyOriginal: 50,
      monthlyPromo: '35.00',
      features: [
        'Triaje preliminar y preguntas de síntomas',
        'Agendamiento y confirmación de citas',
        'Notas de voz ultra-realistas (Edge TTS)',
        'Respuesta Condicional Estricta sin inventar'
      ]
    }
  ];

  const handleCopyProposal = (planId: string) => {
    const p = plans.find((item) => item.id === planId) || plans[0];
    const proposalText = [
      `🚀 *PROPUESTA DE LANZAMIENTO EXCLUSIVA: VOXA (by VENE TURCO)*`,
      `Automatiza tu WhatsApp 24/7 con Inteligencia Artificial Multimodal (Voz, Texto y Fotos).`,
      ``,
      `📌 *${p.name.toUpperCase()}*`,
      `• ${p.tagline}`,
      ``,
      `🔥 *OFERTA FUNDADOR (50% OFF Instalación + 30% OFF Mensualidad):*`,
      `✅ *Instalación e inducción completa:* ~$${p.setupOriginal}~ ➔ *$${p.setupPromo} USD* (Pago único)`,
      `✅ *Mensualidad del servicio:* ~$${p.monthlyOriginal}~ ➔ *$${p.monthlyPromo} USD / mes*`,
      ``,
      `✨ *Lo que incluye tu sistema:*`,
      ...p.features.map((f) => `• ${f}`),
      ``,
      `🛡️ *Escudo Anti-Baneo VENE TURCO Shield incluido:* Tu número WhatsApp 100% blindado contra bloqueos.`,
      ``,
      `📲 *¿Activamos tu demo en 24 horas?*`,
      `Contáctanos al directo: https://wa.me/584164883199`
    ].join('\n');

    navigator.clipboard.writeText(proposalText);
    setCopiedPlan(planId);
    setTimeout(() => setCopiedPlan(null), 3000);
  };

  return (
    <div className="ui-card p-6 md:p-8 relative overflow-hidden">
      {/* Header Táctico */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)] relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="ui-badge-led">
              <Percent className="w-3.5 h-3.5" />
              OFERTA FUNDADOR 2026
            </span>
            <span className="text-[11px] font-mono text-[var(--text-muted)] px-2 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              // CUPO LIMITADO: PRIMEROS NEGOCIOS
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] font-mono tracking-tight flex items-center gap-2">
            Planes & Despliegue Comercial — VOXA
            <span className="text-xs font-mono text-[var(--accent-primary)] font-normal">(by VENE TURCO)</span>
          </h2>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1 max-w-2xl leading-relaxed">
            Estructura de precios bimoneda con 50% de descuento en set-up inicial + 30% vitalicio en infraestructura mensual.
          </p>
        </div>

        <a
          href="https://wa.me/584164883199?text=Hola%20VENE%20TURCO,%20deseo%20activar%20el%20Plan%20Fundador%20de%20VOXA"
          target="_blank"
          rel="noopener noreferrer"
          className="ui-btn-primary self-start md:self-auto text-xs"
        >
          <PhoneCall className="w-3.5 h-3.5 mr-1.5" />
          <span>Soporte Directo: +58 416 488 3199</span>
        </a>
      </div>

      {/* Grid Bento de los 3 Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 relative z-10">
        {plans.map((p) => {
          const Icon = p.icon;
          const isCopied = copiedPlan === p.id;
          return (
            <div
              key={p.id}
              className={`p-5 rounded-[var(--radius-card)] bg-[var(--bg-elevated)] border transition-all duration-200 flex flex-col justify-between relative ${
                p.popular
                  ? 'border-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/10 ring-1 ring-[var(--accent-primary)]/40'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-highlight)]'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded font-mono text-[10px] font-bold tracking-wider uppercase bg-[var(--accent-primary)] text-[#050811] shadow-sm">
                  {p.badge}
                </div>
              )}

              <div>
                {/* Header Card */}
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="ui-badge-led text-[10px] tabular-nums">
                    50% + 30% OFF
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono mb-1">{p.name}</h3>
                <p className="text-xs font-mono text-[var(--text-muted)] mb-4 min-h-[38px] leading-relaxed">{p.tagline}</p>

                {/* Precios Promocionales */}
                <div className="p-3.5 rounded-[var(--radius-button)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 mb-4 font-mono">
                  {/* Instalación */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Set-up / Inducción:</span>
                    <div className="flex items-center gap-1.5 tabular-nums">
                      <span className="line-through text-[var(--text-muted)] text-[11px] opacity-70">${p.setupOriginal}</span>
                      <span className="font-bold text-[var(--accent-primary)] text-sm">${p.setupPromo}</span>
                    </div>
                  </div>

                  {/* Mensualidad */}
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">Infraestructura mensual:</span>
                    <div className="flex items-center gap-1.5 tabular-nums">
                      <span className="line-through text-[var(--text-muted)] text-[11px] opacity-70">${p.monthlyOriginal}</span>
                      <span className="font-bold text-[var(--text-primary)] text-base">${p.monthlyPromo}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">/ mes</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6 font-mono">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[var(--text-primary)]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                      <span className="leading-tight">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botón de Copiar Propuesta Comercial */}
              <button
                onClick={() => handleCopyProposal(p.id)}
                className={`w-full py-2.5 px-4 font-mono font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isCopied
                    ? 'ui-btn-primary'
                    : 'ui-btn-secondary'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    <span>¡Copiada al Portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1 text-[var(--accent-primary)]" />
                    <span>Copiar Propuesta WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PricingLaunchModalOrCard;
