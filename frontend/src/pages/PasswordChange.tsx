import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { updatePassword } from '../services/api.ts';

const PasswordChange = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updatePassword({ currentPassword, newPassword });
      setSuccess(true);
      setTimeout(() => {
        logout();
        navigate('/');
      }, 2000);
    } catch {
      setError('No pudimos actualizar la contraseña. Verifica tu contraseña actual.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1210] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-[#101a17] border border-[#29382f] rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6">Cambiar contraseña</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium text-[#d2e4da]">
            Contraseña actual
            <input
              className="rounded-full border border-[#29382f] bg-[#0b1612] px-4 py-3 text-white outline-none focus:border-emerald-500"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-[#d2e4da]">
            Nueva contraseña
            <input
              className="rounded-full border border-[#29382f] bg-[#0b1612] px-4 py-3 text-white outline-none focus:border-emerald-500"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full h-12 bg-emerald-500 text-black font-bold hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
          {error && <p className="text-center text-sm text-red-400">{error}</p>}
          {success && <p className="text-center text-sm text-emerald-400">Contraseña actualizada. Cerrando sesión...</p>}
        </form>
      </div>
    </div>
  );
};

export default PasswordChange;
