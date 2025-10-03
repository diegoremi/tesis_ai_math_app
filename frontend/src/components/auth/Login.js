import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
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
    } catch (err) {
      console.error(err);
      setError('No pudimos iniciar sesión. Verifica tus datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-[#0b1210] text-white"
      style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}
    >
      <div className="flex items-center justify-between whitespace-nowrap border-b border-[#29382f] px-6 md:px-10 py-3">
        <div className="flex items-center gap-3 text-white">
          <div className="size-8 text-[var(--primary-color, #38ef7d)]">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path
                clipRule="evenodd"
                d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z"
                fill="currentColor"
                fillRule="evenodd"
              ></path>
            </svg>
          </div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">Matemática AI</h1>
        </div>
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
                className="rounded-full border border-[#29382f] bg-[#0b1612] px-4 py-3 text-white placeholder:text-[#6aa58e] focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="ejemplo@correo.com"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-[#d2e4da]">
              Contraseña
              <input
                className="rounded-full border border-[#29382f] bg-[#0b1612] px-4 py-3 text-white placeholder:text-[#6aa58e] focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="••••••••"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full h-12 px-6 bg-[var(--primary-color)] text-black text-base font-bold tracking-[0.015em] hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? 'Iniciando sesión…' : 'Ingresar'}
            </button>
            {error && <p className="text-center text-sm text-red-400">{error}</p>}
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
