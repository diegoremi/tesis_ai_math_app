import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitSurvey, getSurveyItems } from '../services/api';
import LoadingSpinner from './common/LoadingSpinner';

const likertOptions = [
  { value: 1, label: 'Totalmente en desacuerdo' },
  { value: 2, label: 'En desacuerdo' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'De acuerdo' },
  { value: 5, label: 'Totalmente de acuerdo' },
];

const SUBSCALE_LABELS = {
  utilidad: 'Utilidad percibida',
  facilidad: 'Facilidad de uso',
  intencion: 'Intención de uso',
  motivacion: 'Motivación',
  autonomia: 'Autonomía',
};

const Survey = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState({});
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await getSurveyItems({ instrument: 'tam', version: 'v1' });
        const fetched = response.data.items ?? [];
        setItems(fetched);
        setResponses(
          fetched.reduce((acc, item) => ({ ...acc, [item.survey_item_id]: 4 }), {})
        );
      } catch (error) {
        console.error('Error fetching survey items:', error);
        setItems([]);
        setResponses({});
        setNotice({ type: 'error', message: 'No pudimos cargar las preguntas. Intenta nuevamente.' });
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleSelect = (itemId, value) => {
    setResponses((prev) => ({ ...prev, [itemId]: value }));
  };

  const subscaleAverages = useMemo(() => {
    const buckets = items.reduce((acc, item) => {
      const key = item.survey_item_id ?? item.id;
      const responseValue = responses[key];
      if (!item.subscale || !responseValue) {
        return acc;
      }
      if (!acc[item.subscale]) {
        acc[item.subscale] = [];
      }
      acc[item.subscale].push(responseValue);
      return acc;
    }, {});

    const average = (values) => {
      if (!values || values.length === 0) {
        return null;
      }
      return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
    };

    return Object.fromEntries(
      Object.entries(buckets).map(([subscale, values]) => [subscale, average(values)]),
    );
  }, [items, responses]);

  const aggregates = useMemo(() => {
    return {
      perceived_utility: subscaleAverages.utilidad ?? null,
      ease_of_use: subscaleAverages.facilidad ?? null,
      motivation: subscaleAverages.motivacion ?? null,
      autonomy: subscaleAverages.autonomia ?? null,
    };
  }, [subscaleAverages]);

  const presentSubscales = useMemo(() => {
    return Array.from(
      new Set(
        items
          .map((item) => item.subscale)
          .filter((subscale) => typeof subscale === 'string' && subscale.length > 0),
      ),
    );
  }, [items]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice(null);
    if (items.length === 0) {
      setNotice({ type: 'error', message: 'No hay preguntas disponibles por ahora.' });
      setSubmitting(false);
      return;
    }

    try {
      await submitSurvey({
        instrument: 'tam',
        version: 'v1',
        timepoint: 'exit',
        responses: items.map((item) => {
          const key = item.survey_item_id ?? item.id;
          return {
            survey_item_id: key,
            value: responses[key],
          };
        }),
        comments,
        aggregates,
      });
      setNotice({ type: 'success', message: '¡Gracias por tu respuesta! Guardamos tus resultados.' });
    } catch (error) {
      console.error('Error submitting survey:', error);
      setNotice({ type: 'error', message: 'No pudimos enviar la encuesta. Intenta nuevamente.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Cargando encuesta…" fullscreen subdued />;
  }

  return (
    <div
      className="min-h-screen bg-[#0b1210] text-white"
      style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}
    >
      <header className="flex items-center justify-between gap-4 border-b border-[#1f2c26] bg-[#0f1713] px-6 md:px-10 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#6aa58e]">Encuesta</p>
          <h1 className="text-xl font-semibold">Satisfacción con la plataforma</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-[#6aa58e] md:inline-flex">Sesión {new Date().toLocaleDateString()}</span>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex h-10 items-center justify-center rounded-full border border-[#2a3a33] bg-transparent px-5 text-sm font-semibold text-[#cbe0d7] transition hover:border-[var(--primary-color)] hover:text-white"
          >
            Volver al dashboard
          </button>
        </div>
      </header>

      <main className="px-6 md:px-10 py-10">
        <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-4xl flex-col gap-8">
          <section className="rounded-3xl border border-[#203028] bg-[#101a17] px-6 md:px-8 py-10 shadow-lg">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white">Tu opinión es clave</h2>
              <p className="text-sm text-[#94b1a3]">Contanos cómo fue tu experiencia esta semana. Cada respuesta ayuda a mejorar el tutor.</p>
            </div>

            <div className="mt-8 space-y-6">
              {items.map((item) => {
                const key = item.survey_item_id ?? item.id;
                return (
                  <div key={key} className="rounded-2xl border border-[#1f2c26] bg-[#0d1612] p-6">
                    <p className="text-base font-semibold text-white">{item.prompt ?? item.question}</p>
                    <div className="mt-4">
                      <div className="hidden md:grid grid-cols-5 text-[11px] uppercase tracking-[0.2em] text-[#6aa58e]">
                        {likertOptions.map((option) => (
                          <span key={option.value} className="text-center">
                            {option.label}
                          </span>
                        ))}
                      </div>
                      <div
                        className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3"
                        role="radiogroup"
                        aria-label="Escala de respuesta Likert"
                      >
                        {likertOptions.map((option) => {
                          const inputId = `item-${key}-${option.value}`;
                          const selected = responses[key] === option.value;
                          return (
                            <label
                              key={option.value}
                              htmlFor={inputId}
                              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border px-3 py-3 text-center transition ${
                                selected
                                  ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/15 text-white'
                                  : 'border-[#1f2c26] text-[#9eb7a8] hover:border-[var(--primary-color)]/60 hover:text-white'
                              }`}
                            >
                              <input
                                type="radio"
                                id={inputId}
                                name={`item-${key}`}
                                className="sr-only"
                                checked={selected}
                                onChange={() => handleSelect(key, option.value)}
                              />
                              <span className="text-lg font-semibold">{option.value}</span>
                              <span className="mt-1 text-[11px] font-medium text-[#6aa58e] md:hidden">
                                {option.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 space-y-2">
              <label className="text-sm font-medium text-[#cbe0d7]" htmlFor="comments">
                Comentarios adicionales
              </label>
              <textarea
                id="comments"
                className="w-full rounded-3xl border border-[#203028] bg-[#0d1612] px-4 py-3 text-sm text-white placeholder:text-[#6aa58e] focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)]"
                rows={4}
                placeholder="¿Qué funcionó mejor? ¿Qué podemos mejorar?"
                value={comments}
                onChange={(event) => setComments(event.target.value)}
              />
            </div>
          </section>

          {notice && (
            <div
              className={`rounded-3xl border px-5 py-4 text-sm ${
                notice.type === 'error'
                  ? 'border-red-500/40 bg-red-500/10 text-red-200'
                  : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
              }`}
            >
              {notice.message}
            </div>
          )}

          <section className="rounded-3xl border border-[#203028] bg-[#101a17] p-6 md:p-8 shadow-lg">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="grid grid-cols-2 gap-4 text-sm text-[#94b1a3]">
                {presentSubscales.map((subscale) => (
                  <div key={subscale}>
                    <p className="text-xs uppercase tracking-[0.25em] text-[#6aa58e]">
                      {SUBSCALE_LABELS[subscale] ?? subscale}
                    </p>
                    <p className="mt-1 text-base font-semibold text-white">
                      {subscaleAverages[subscale] ?? '—'}
                    </p>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={submitting || items.length === 0}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary-color)] px-8 text-sm font-semibold text-[#0b1210] transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Enviando…' : 'Enviar respuestas'}
              </button>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
};

export default Survey;
