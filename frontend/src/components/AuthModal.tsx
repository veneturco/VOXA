import React, { useState } from 'react';
import { ShieldCheck, Key, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import axios from '../services/api';
import { setAdminKey } from '../services/api';

interface AuthModalProps {
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Validate key against backend /api/auth/verify
      const res = await axios.post(
        '/api/auth/verify',
        {},
        {
          headers: { 'X-Admin-Key': keyInput.trim() }
        }
      );

      if (res.data?.success) {
        setAdminKey(keyInput.trim());
        onSuccess();
      } else {
        setError(res.data?.error || 'Clave de acceso incorrecta.');
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Clave de acceso incorrecta o no autorizada.');
      } else if (err.response?.status === 429) {
        setError('Demasiados intentos fallidos. Por seguridad, espera 1 minuto.');
      } else {
        setError('Error al conectar con el servidor de autenticación.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0F17]/90 backdrop-blur-xl">
      <div className="w-full max-w-md bg-gradient-to-b from-[#111827] to-[#0B0F17] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 p-0.5 shadow-xl shadow-purple-600/25 flex items-center justify-center">
            <div className="w-full h-full bg-[#0B0F17] rounded-[14px] flex items-center justify-center">
              <Lock className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            Panel Protegido <span className="text-[#00D95F]">VOXA</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ingresa la Credencial Maestra (<code className="text-purple-300 font-mono">ADMIN_SECRET_KEY</code>) para acceder a la consola.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-purple-400" />
              Clave de Administrador
            </label>
            <input
              type="password"
              placeholder="Pega aquí tu ADMIN_SECRET_KEY..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[46px] rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Validando credencial...</span>
            ) : (
              <>
                <span>Acceder al Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00D95F]" />
            Blindaje Criptográfico VENE TURCO SecOps
          </p>
        </div>
      </div>
    </div>
  );
};
