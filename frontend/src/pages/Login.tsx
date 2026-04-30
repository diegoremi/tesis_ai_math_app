import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await login({ email, password });
      if (result === 'pretest') {
        navigate('/study/pretest', { replace: true });
      } else if (result === 'dashboard') {
        navigate('/dashboard', { replace: true });
      } else {
        setError('Correo o contraseña incorrectos.');
      }
    } catch {
      setError('No pudimos iniciar sesión. Verifica tus datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-[#0b1210] text-white">
      <div className="flex items-center justify-between whitespace-nowrap border-b border-[#29382f] px-6 md:px-10 py-3">
        <span className="text-lg font-bold tracking-tight">AI Math App</span>
        <button
          className="rounded-full h-10 px-4 bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition"
          onClick={() => navigate('/register')}
        >
          Crear cuenta
        </button>
      </div>

      <main className="flex flex-1 justify-center py-10 px-6 md:px-0">
        <div className="w-full max-w-xl bg-[#101a17] border border-[#1f2c26] rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="text-center mb-10">
            <p className="text-sm uppercase tracking-[0.3em] text-[#6aa58e]">Bienvenido</p>
            <h2 className="text-3xl font-bold tracking-tight">Inicia sesión</h2>
            <p className="text-sm text-[#9eb7a8] mt-3">
              Ingresa con tu correo institucional para continuar con el plan de aprendizaje.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm font-medium text-[#d2e4da]">
              Correo electrónico
              <input
                className="rounded-full border border-[#29382f] bg-[#0b1612] px-4 py-3 text-white placeholder:text-[#6aa58e] focus:border-emerald-500 focus:ring-emerald-500 outline-none"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ejemplo@correo.com"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-[#d2e4da]">
              Contraseña
              <input
                className="rounded-full border border-[#29382f] bg-[#0b1612] px-4 py-3 text-white placeholder:text-[#6aa58e] focus:border-emerald-500 focus:ring-emerald-500 outline-none"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full h-12 px-6 bg-emerald-500 text-black text-base font-bold tracking-[0.015em] hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? 'Iniciando sesión...' : 'Ingresar'}
            </button>
            {error && <p className="text-center text-sm text-red-400">{error}</p>}
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
