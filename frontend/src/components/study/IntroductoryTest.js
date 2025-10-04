import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAssessment, getAssessmentItems } from '../../services/api';
import { useAuth } from 'context/AuthContext';
import AppBrand from '../layout/AppBrand';
import LoadingSpinner from '../common/LoadingSpinner';

const IntroductoryTest = () => {
  const navigate = useNavigate();
  const { refreshAssessmentStatus } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await getAssessmentItems({ type: 'pretest' });
        const fetched = response.data.items ?? [];
        setItems(fetched);
        setAnswers({});
        setStep(0);
      } catch (err) {
        console.error('Error fetching pretest items:', err);
        setError('No pudimos cargar las preguntas del pretest. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const SUPERSCRIPT_MAP = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };

  const toSuperscript = (text = '') =>
    String(text).replace(/\^([0-9]+)/g, (_, digits) =>
      digits
        .split('')
        .map((digit) => SUPERSCRIPT_MAP[digit] ?? digit)
        .join(''),
    );

  const currentQuestion = items[step];
  const optionList = Array.isArray(currentQuestion?.options) ? currentQuestion.options : [];

  const progress = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.round(((step + 1) / items.length) * 100);
  }, [step, items.length]);

  const handleInput = (value) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.item_id]: value }));
  };

  const handleNext = () => {
    if (step < items.length - 1) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const totalCorrect = items.reduce((acc, question) => {
        const userAnswer = answers[question.item_id];
        if (!userAnswer) return acc;
        return acc + (String(userAnswer).trim().toLowerCase() === question.correct_key.toLowerCase() ? 1 : 0);
      }, 0);

      await createAssessment({
        assessment_type: 'pretest',
        test_version: 'v1',
        total_score: totalCorrect,
        responses: items.map((item) => ({
          item_id: item.item_id,
          answer: answers[item.item_id] ?? null,
          is_correct:
            answers[item.item_id] !== undefined
              ? String(answers[item.item_id]).trim().toLowerCase() === item.correct_key.toLowerCase()
              : null,
        })),
      });

      await refreshAssessmentStatus();
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit pretest:', err);
      setError('No pudimos guardar tus respuestas. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Cargando pretest…" fullscreen subdued />;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-50 flex items-center justify-center px-6">
        <div className="max-w-lg w-full bg-gray-900 rounded-3xl border border-gray-800 p-12 text-center shadow-2xl">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-400 mb-4">
            <span className="material-symbols-outlined text-3xl">task_alt</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">¡Pretest completado!</h1>
          <p className="mt-4 text-base text-gray-400">
            Guardamos tus resultados. Ahora las prácticas y recomendaciones se adaptarán a tu nivel.
          </p>
          <button
            type="button"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-gray-950 hover:bg-emerald-400 transition"
            onClick={() => navigate('/dashboard', { replace: true })}
          >
            Ir al panel
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">No hay preguntas disponibles en este momento.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-50" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
      <header className="flex flex-col gap-4 border-b border-gray-800 px-8 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 text-white">
          <AppBrand />
          <div className="text-xs uppercase tracking-[0.35em] text-gray-400">
            <span>Evaluación inicial · Pretest diagnóstico</span>
          </div>
        </div>
        <span className="text-sm text-gray-400">Tiempo estimado: 15 minutos</span>
      </header>

      <main className="px-6 py-12 flex justify-center">
        <div className="w-full max-w-2xl bg-gray-900/60 rounded-2xl border border-gray-800 shadow-2xl p-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-white">Pregunta {step + 1} de {items.length}</h2>
            <p className="text-sm text-gray-400">Responde sin ayuda externa. Esto nos ayuda a personalizar el plan.</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300 font-medium">Progreso</span>
              <span className="text-emerald-400 font-semibold">{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-700 overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          <section className="space-y-5">
            <h3 className="text-lg font-semibold">{toSuperscript(currentQuestion.stem)}</h3>
            <div className="grid gap-3">
              {optionList.map((option) => (
                <button
                  key={option.key ?? option.label}
                  type="button"
                  onClick={() => handleInput(option.key ?? option.label)}
                  className={`text-left rounded-xl border px-4 py-3 transition ${
                    answers[currentQuestion.item_id] === (option.key ?? option.label)
                      ? 'border-emerald-400 bg-emerald-500/10 text-white'
                      : 'border-gray-700 bg-gray-900 hover:border-emerald-500/60'
                  }`}
                >
                  {toSuperscript(option.label ?? option)}
                </button>
              ))}
            </div>
          </section>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <footer className="flex flex-col sm:flex-row gap-3 justify-between">
            <button
              type="button"
              onClick={handlePrev}
              disabled={step === 0 || submitting}
              className="flex items-center justify-center gap-2 rounded-full border border-gray-700 px-6 py-2 text-sm font-semibold text-gray-200 disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Anterior
            </button>
            {step < items.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-gray-950 hover:bg-emerald-400 transition disabled:opacity-70"
              >
                Siguiente
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-gray-950 hover:bg-emerald-400 transition disabled:opacity-70"
              >
                {submitting ? 'Enviando…' : 'Finalizar pretest'}
                <span className="material-symbols-outlined text-base">check</span>
              </button>
            )}
          </footer>
        </div>
      </main>
    </div>
  );
};

export default IntroductoryTest;
