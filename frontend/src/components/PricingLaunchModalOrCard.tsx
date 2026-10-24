import React, { useState } from 'react';
import {
  Tag,
  Check,
  Copy,
  Sparkles,
  ShoppingBag,
  Wrench,
  Stethoscope,
  PhoneCall,
  Percent,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export function PricingLaunchModalOrCard() {
  const [copiedPlan, setCopiedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'tienda',
      name: 'Plan Tienda / Comercio',
      tagline: 'Ideal para tiendas de ropa, calzado, comida rápida y delivery.',
      icon: ShoppingBag,
      color: 'from-emerald-500 to-teal-600',
      borderColor: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
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
      tagline: 'Para talleres mecánicos, venta de repuestos y autolavados.',
      icon: Wrench,
      popular: true,
      color: 'from-purple-600 to-indigo-600',
      borderColor: 'border-purple-500/40',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
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
      color: 'from-sky-500 to-blue-600',
      borderColor: 'border-sky-500/30',
      badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
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
    <div className="rounded-3xl bg-[#0F172A]/90 border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Glow de fondo */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#00D95F]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30">
              <Percent className="w-3.5 h-3.5 text-amber-400" />
              OFERTA DE LANZAMIENTO V4.8
            </span>
            <span className="text-xs font-semibold text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
              Primeros Negocios Fundadores
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Planes y Precios Promocionales — VOXA
            <span className="text-xs font-normal text-purple-300 font-mono">(by VENE TURCO)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Aprovecha 50% de descuento en costo de instalación + 30% de descuento vitalicio en la mensualidad para impulsar el negocio.
          </p>
        </div>

        <a
          href="https://wa.me/584164883199?text=Hola%20VENE%20TURCO,%20deseo%20activar%20el%20Plan%20Fundador%20de%20VOXA"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-[#16A34A] hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer self-start md:self-auto"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Soporte: +58 416 488 3199</span>
        </a>
      </div>

      {/* Grid de los 3 Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 relative z-10">
        {plans.map((p) => {
          const Icon = p.icon;
          const isCopied = copiedPlan === p.id;
          return (
            <div
              key={p.id}
              className={`rounded-2xl bg-[#0B0F17]/90 border ${p.borderColor} p-5 flex flex-col justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl relative ${
                p.popular ? 'ring-2 ring-purple-500/50 shadow-purple-500/10' : ''
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-[10px] tracking-wider uppercase shadow-md">
                  Más Popular
                </div>
              )}

              <div>
                {/* Header Card */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-white shadow-lg`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.badgeBg}`}>
                    50% + 30% OFF
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">{p.name}</h3>
                <p className="text-xs text-slate-400 mb-4 h-9 leading-relaxed">{p.tagline}</p>

                {/* Precios Promocionales */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-2 mb-4">
                  {/* Instalación */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Instalación / Set-up:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="line-through text-slate-500 text-[11px]">${p.setupOriginal}</span>
                      <span className="font-extrabold text-[#00D95F] text-sm">${p.setupPromo}</span>
                    </div>
                  </div>

                  {/* Mensualidad */}
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/5">
                    <span className="text-slate-400">Mensualidad:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="line-through text-slate-500 text-[11px]">${p.monthlyOriginal}</span>
                      <span className="font-extrabold text-white text-base">${p.monthlyPromo}</span>
                      <span className="text-[10px] text-slate-400">/ mes</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00D95F] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botón de Copiar Propuesta Comercial */}
              <button
                onClick={() => handleCopyProposal(p.id)}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isCopied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>¡Propuesta Copiada al Portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-300" />
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
