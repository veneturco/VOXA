import React, { useState } from 'react';
import {
  Users,
  Search,
  Flame,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Smile,
  AlertTriangle,
  Frown,
  Meh
} from 'lucide-react';
import axios from 'axios';
import { Lead, Transaction } from '../types';

interface CrmTransactionsViewProps {
  leads: Lead[];
  transactions: Transaction[];
  onRefreshAll: () => void;
}

export const CrmTransactionsView: React.FC<CrmTransactionsViewProps> = ({
  leads,
  transactions,
  onRefreshAll
}) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'transactions'>('leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStatus = async (txId: string, status: 'verificado' | 'rechazado') => {
    setUpdatingId(txId);
    try {
      const res = await axios.patch(`/api/transactions/${txId}/status`, { status });
      if (res.data.success) {
        onRefreshAll();
      }
    } catch (err) {
      console.error('Error updating transaction status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const renderSentiment = (sentiment?: string) => {
    switch (sentiment) {
      case 'positivo':
        return <span className="inline-flex items-center gap-1 text-[10px] text-[#00D95F] bg-[#00D95F]/10 px-2 py-0.5 rounded-full font-bold border border-[#00D95F]/20"><Smile className="w-3 h-3" /> Positivo</span>;
      case 'frustrado':
        return <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full font-bold border border-rose-500/20"><Frown className="w-3 h-3" /> Frustrado</span>;
      case 'urgente':
        return <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold border border-amber-500/20"><AlertTriangle className="w-3 h-3" /> Urgente</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[10px] text-slate-300 bg-white/5 px-2 py-0.5 rounded-full"><Meh className="w-3 h-3" /> Neutro</span>;
    }
  };

  const filteredLeads = leads.filter(
    (l) =>
      (l.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone_or_user_id.includes(searchTerm) ||
      (l.need_or_vehicle_or_symptom || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(
    (t) =>
      (t.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.phone_or_user_id.includes(searchTerm) ||
      (t.reference_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            CRM Invisible, Semáforo de Sentimiento y Transacciones Bimoneda
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Perfiles autocompletados con intención de compra, sentimiento emocional detectado y comprobantes bancarios con equivalencia USD/Bs BCV.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#0B0F17] border border-white/10 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'leads'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Leads Clasificados ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pedidos, Citas & Pagos ({transactions.length})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Buscar por cliente, teléfono, síntoma, sentimiento o referencia bancaria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full glass-panel rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* TAB 1: CRM LEADS */}
      {activeTab === 'leads' && (
        <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0B0F17] text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                <tr>
                  <th className="p-4">Cliente / Teléfono</th>
                  <th className="p-4">Score Comercial</th>
                  <th className="p-4">Sentimiento</th>
                  <th className="p-4">Necesidad / Vehículo / Síntoma</th>
                  <th className="p-4">Zona / Ubicación</th>
                  <th className="p-4">Objeción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      No hay clientes registrados en el CRM aún.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold text-white">
                        <div>{lead.customer_name || 'Cliente'}</div>
                        <div className="text-[11px] font-mono text-slate-400 font-normal">
                          {lead.phone_or_user_id}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                            lead.buying_score >= 80
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : lead.buying_score >= 50
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-[#00D95F]/10 text-[#00D95F] border border-[#00D95F]/20'
                          }`}
                        >
                          {lead.buying_score >= 80 && <Flame className="w-3 h-3" />}
                          {lead.buying_score}/100
                        </span>
                      </td>
                      <td className="p-4">{renderSentiment(lead.sentiment)}</td>
                      <td className="p-4 text-slate-200">
                        {lead.need_or_vehicle_or_symptom || '—'}
                      </td>
                      <td className="p-4 text-slate-400">{lead.address_or_zone || '—'}</td>
                      <td className="p-4 text-slate-400">{lead.main_objection || 'Ninguna'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0B0F17] text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                <tr>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Detalles</th>
                  <th className="p-4">Monto USD / Bs BCV</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acción Humana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      No hay transacciones registradas.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <span className="capitalize font-bold text-white px-2.5 py-1 rounded-lg bg-white/5 text-[11px]">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white">{tx.customer_name}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {tx.phone_or_user_id}
                        </div>
                      </td>
                      <td className="p-4 max-w-xs">
                        <div className="text-slate-300 text-[11px] truncate">
                          {tx.details.items
                            ? `Ítems: ${tx.details.items.join(', ')}`
                            : tx.details.service_or_specialty
                            ? `Cita: ${tx.details.service_or_specialty} (${tx.details.requested_date || ''})`
                            : tx.details.bank_or_platform
                            ? `Banco: ${tx.details.bank_or_platform}`
                            : 'Registrado en chat'}
                        </div>
                        {tx.proof_image_url && (
                          <a
                            href={tx.proof_image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-[#00D95F] hover:underline mt-1"
                          >
                            <Eye className="w-3 h-3" /> Ver comprobante adjunto
                          </a>
                        )}
                      </td>
                      <td className="p-4">
                        {tx.amount ? (
                          <div>
                            <div className="font-mono font-black text-[#00D95F] text-sm">
                              ${tx.amount.toFixed(2)} USD
                            </div>
                            {tx.amount_ves && (
                              <div className="text-[10px] font-mono text-emerald-300/80">
                                ≈ Bs. {tx.amount_ves.toLocaleString('es-VE')} {tx.bcv_rate_applied ? `(Tasa ${tx.bcv_rate_applied})` : ''}
                              </div>
                            )}
                          </div>
                        ) : null}
                        {tx.reference_number && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            Ref: {tx.reference_number}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {tx.status === 'pendiente_de_verificacion' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" /> Pendiente
                          </span>
                        ) : tx.status === 'verificado' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#00D95F]/10 text-[#00D95F] border border-[#00D95F]/20">
                            <CheckCircle className="w-3 h-3" /> Verificado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3 h-3" /> Rechazado
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {tx.status === 'pendiente_de_verificacion' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdateStatus(tx.id, 'verificado')}
                              disabled={updatingId === tx.id}
                              className="px-3 py-1 rounded-xl bg-[#00D95F] hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Verificar
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(tx.id, 'rechazado')}
                              disabled={updatingId === tx.id}
                              className="px-3 py-1 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-[11px] transition-colors cursor-pointer"
                            >
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Procesado</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
