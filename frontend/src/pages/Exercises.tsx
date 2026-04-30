import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { getExercise, submitAnswer, getHint } from '../services/api.ts';

const Exercises = () => {
  const navigate = useNavigate();
  const { logout, featureFlags } = useAuth();
  const [exercise, setExercise] = useState<Record<string, unknown> | null>(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatbotEnabled = Boolean(featureFlags?.chatbot);

  const fetchExercise = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setHint(null);
    setHintLevel(0);
    setAnswer('');
    try {
      const res = await getExercise();
      setExercise(res.data as Record<string, unknown>);
    } catch {
      setError('No pudimos cargar el ejercicio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercise();
  }, []);

  const handleSubmit = async () => {
    if (!exercise || !answer) return;
    setSubmitting(true);
    try {
      const res = await submitAnswer({
        exerciseId: exercise.id as number,
        userAnswer: answer,
      });
      setResult(res.data as Record<string, unknown>);
    } catch {
      setError('Error al enviar la respuesta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHint = async () => {
    if (!exercise) return;
    try {
      const res = await getHint(exercise.id as number, hintLevel);
      setHint((res.data as { hint?: string }).hint ?? 'Aqui tienes una pista...');
      setHintLevel((prev) => Math.min(prev + 1, 3));
    } catch {
      setError('No pudimos obtener la pista.');
    }
  };

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
        <span className="text-lg font-bold">Ejercicios</span>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-sm hover:text-emerald-400">Dashboard</button>
          <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">Salir</button>
        </div>
      </nav>
      <main className="px-6 md:px-10 py-10 max-w-2xl mx-auto">
        {error && <p className="text-red-400 mb-4">{error}</p>}
        {exercise && (
          <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-[#6aa58e]">{String(exercise.domain ?? '')} · {String(exercise.competency ?? '')}</span>
              {chatbotEnabled && (
                <button onClick={handleHint} className="text-sm text-emerald-400 hover:text-emerald-300">Pedir pista</button>
              )}
            </div>
            <p className="text-lg font-medium mb-6">{String(exercise.stem ?? '')}</p>
            <div className="space-y-3 mb-6">
              {((exercise.options as Array<{ key: string; label: string }>) ?? []).map((option) => (
                <button
                  key={option.key}
                  onClick={() => setAnswer(option.key)}
                  className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                    answer === option.key
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-[#29382f] hover:border-[#6aa58e]'
                  }`}
                >
                  <span className="font-bold mr-2">{option.key}.</span>
                  {option.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!answer || submitting}
              className="w-full rounded-full h-12 bg-emerald-500 text-black font-bold hover:opacity-90 transition disabled:opacity-60"
            >
              {submitting ? 'Enviando...' : 'Enviar respuesta'}
            </button>
            {hint && (
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <p className="text-sm text-blue-300">{hint}</p>
              </div>
            )}
            {result && (
              <div className={`mt-4 p-4 rounded-xl ${(result.correct as boolean) ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                <p className={`font-bold ${(result.correct as boolean) ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(result.correct as boolean) ? 'Correcto!' : 'Incorrecto'}
                </p>
                <p className="text-sm text-[#9eb7a8] mt-1">{String((result as { explanation?: string }).explanation ?? '')}</p>
                <button onClick={fetchExercise} className="mt-3 text-sm text-emerald-400 hover:text-emerald-300">Siguiente ejercicio</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Exercises;
