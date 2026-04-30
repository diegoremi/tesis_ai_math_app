import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { getProfile, updateProfile } from '../services/api.ts';

const Profile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then((res) => setProfile(res.data as Record<string, unknown>))
      .catch(() => setError('No pudimos cargar tu perfil.'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateProfile(profile);
      setError(null);
    } catch {
      setError('No pudimos actualizar tu perfil.');
    } finally {
      setSaving(false);
    }
  };

  void handleUpdate;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b1210]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1210] text-white">
      <nav className="flex items-center justify-between border-b border-[#29382f] px-6 md:px-10 py-3">
        <span className="text-lg font-bold">AI Math App</span>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-sm hover:text-emerald-400">Dashboard</button>
          <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">Salir</button>
        </div>
      </nav>
      <main className="px-6 md:px-10 py-10 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Mi perfil</h1>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        {profile && (
          <div className="space-y-4">
            <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6 space-y-4">
              <div>
                <label className="text-sm text-[#9eb7a8]">Nombre</label>
                <p className="font-medium">{String(profile.first_name ?? '')} {String(profile.last_name ?? '')}</p>
              </div>
              <div>
                <label className="text-sm text-[#9eb7a8]">Correo</label>
                <p className="font-medium">{String(profile.email ?? '')}</p>
              </div>
              <div>
                <label className="text-sm text-[#9eb7a8]">Rol</label>
                <p className="font-medium capitalize">{String(profile.role ?? '')}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/password')}
              className="w-full rounded-full h-12 bg-emerald-500 text-black font-bold hover:opacity-90 transition"
            >
              Cambiar contraseña
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
