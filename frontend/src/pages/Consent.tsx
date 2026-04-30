import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { submitConsent } from '../services/api.ts';

const Consent = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!accepted) {
      setError('Debes aceptar el consentimiento para continuar.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitConsent({ documentVersion: 'v1', accepted: true });
      navigate('/study/pretest');
    } catch {
      setError('Error al registrar el consentimiento.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1210] text-white">
      <nav className="flex items-center justify-between border-b border-[#29382f] px-6 md:px-10 py-3">
        <span className="text-lg font-bold">Consentimiento informado</span>
        <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">Salir</button>
      </nav>
      <main className="px-6 md:px-10 py-10 max-w-2xl mx-auto">
        <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-6">Consentimiento informado</h1>
          <div className="space-y-4 text-[#d2e4da] text-sm leading-relaxed mb-8">
            <p>Bienvenido/a a este estudio de investigación sobre el uso de inteligencia artificial en el aprendizaje de matemáticas.</p>
            <p>Este estudio tiene como objetivo evaluar el impacto de un tutor inteligente en el rendimiento académico de estudiantes adultos en matemáticas básicas.</p>
            <p>Tu participación es voluntaria. Puedes retirarte en cualquier momento sin penalización.</p>
            <p>Los datos recopilados serán utilizados únicamente con fines de investigación académica y serán tratados de forma confidencial.</p>
            <p>Si tienes alguna pregunta sobre el estudio, puedes contactar al investigador principal.</p>
          </div>

          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-[#29382f] bg-[#0b1612] text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-sm text-[#d2e4da]">
              He leído y comprendido la información proporcionada. Acepto participar voluntariamente en este estudio.
            </span>
          </label>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-full h-12 bg-emerald-500 text-black font-bold hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? 'Procesando...' : 'Continuar al pretest'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default Consent;
