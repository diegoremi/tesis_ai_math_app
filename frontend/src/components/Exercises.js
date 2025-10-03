import React, { useEffect, useState } from "react";
import { getExercise, submitAnswer, getHint } from "../services/api";
import { useAuth } from "context/AuthContext";
import TopNav from "./layout/TopNav";

const Exercises = () => {
  const { featureFlags } = useAuth();
  const chatbotEnabled = Boolean(featureFlags?.chatbot);
  const adaptativeEnabled = Boolean(featureFlags?.adaptativo);
  const assignedGroup = featureFlags?.assigned_group;

  const [exercise, setExercise] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [freeResponse, setFreeResponse] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hint, setHint] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchExercise();
  }, []);

  const fetchExercise = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    if (!silent) {
      setResult(null);
      setHint(null);
    }
    setError(null);
    try {
      const response = await getExercise();
      setExercise(response.data);
      setSelectedOption(null);
      setFreeResponse("");
      setHint(null);
      if (silent) {
        setResult(null);
      }
    } catch (err) {
      setError("No pudimos cargar un ejercicio nuevo. Intenta nuevamente más tarde.");
      console.error(err);
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleHint = async () => {
    if (!chatbotEnabled || !exercise) return;
    try {
      const response = await getHint(exercise.id);
      setHint(response.data.hint);
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 403) {
        setHint('Las pistas con IA no están habilitadas para tu cohorte.');
      } else {
        setHint('No pudimos obtener una pista en este momento.');
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!exercise) return;
    const payload = selectedOption ?? freeResponse.trim();
    if (!payload) {
      setError("Selecciona o escribe una respuesta antes de enviar.");
      return;
    }
    try {
      const response = await submitAnswer({
        exerciseId: exercise.id,
        userAnswer: payload,
      });
      const isCorrect = Boolean(response.data?.correct);
      setResult(isCorrect ? "¡Correcto!" : "Revisa tus pasos e inténtalo de nuevo.");
      if (isCorrect) {
        setTimeout(() => {
          fetchExercise({ silent: true });
        }, 1800);
      }
    } catch (err) {
      setError("Ocurrió un error al enviar tu respuesta.");
      console.error(err);
    }
  };

  const hasOptions = Array.isArray(exercise?.options) && exercise.options.length > 0;

  if (loading) {
    return <div className="min-h-screen bg-[#0b1210] text-white text-center pt-20">Cargando práctica…</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-[#0b1210] text-red-400 text-center pt-20">{error}</div>;
  }

  if (!exercise) {
    return <div className="min-h-screen bg-[#0b1210] text-white text-center pt-20">Sin ejercicios disponibles.</div>;
  }

  return (
    <div
      className="relative flex min-h-screen flex-col bg-[#0b1210] text-white"
      style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}
    >
      <TopNav />
      <main className="flex-1 px-6 md:px-10 py-10">
        <div className="mx-auto max-w-3xl space-y-8">
          {featureFlags && (!adaptativeEnabled || assignedGroup === 'GC') && (
            <div className="rounded-2xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {assignedGroup === 'GC'
                ? 'Tu cohorte utiliza la versión sin IA por diseño experimental. Podés practicar normalmente y registrar tus progresos.'
                : 'Activaremos la práctica adaptativa apenas se complete tu asignación experimental. Consultá con coordinación si el mensaje persiste.'}
            </div>
          )}

          <div className="relative space-y-4 rounded-2xl bg-[#1c2620] p-6 shadow-lg">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-[#9eb7a8]">Ejercicio</p>
              <h2 className="text-2xl font-bold">{exercise.stem}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {hasOptions ? (
                <div className="grid gap-3">
                  {exercise.options.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setSelectedOption(option.key)}
                      className={`text-left rounded-xl border px-4 py-3 transition ${
                        selectedOption === option.key
                          ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/10 text-white'
                          : 'border-[#3d5245] bg-[#111714] text-[#d2e4da] hover:border-[var(--primary-color)]/60'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  className="w-full rounded-full border border-[#3d5245] bg-[#111714] px-4 py-3 text-white placeholder:text-[#9eb7a8] focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                  placeholder="Escribe tu respuesta"
                  value={freeResponse}
                  onChange={(event) => setFreeResponse(event.target.value)}
                />
              )}
              <button
                className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-full bg-[var(--primary-color)] px-6 py-3 text-sm font-bold text-[#111714] transition-colors hover:bg-opacity-80"
                type="submit"
                disabled={refreshing}
              >
                Enviar respuesta
              </button>
            </form>
            {result && (
              <div className="rounded-xl border border-[#3d5245] bg-[#111714] px-4 py-3 text-sm text-white">
                {result}
              </div>
            )}
            {chatbotEnabled && (
              <button
                className="inline-flex items-center gap-2 rounded-full bg-[#29382f] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#3d5245]"
                onClick={handleHint}
                type="button"
              >
                Pedir pista
                <span className="material-symbols-outlined text-base">lightbulb</span>
              </button>
            )}
            {hint && (
              <div className="mt-4 p-4 bg-[#29382f] rounded-lg text-sm text-white">
                {hint}
              </div>
            )}
            {refreshing && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#0b1210]/70">
                <span className="text-sm text-[#9eb7a8]">Cargando nuevo ejercicio…</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Exercises;
