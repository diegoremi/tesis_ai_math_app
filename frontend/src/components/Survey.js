import React, { useEffect, useMemo, useState } from 'react';
import { submitSurvey, getSurveyItems } from '../services/api';

const likertOptions = [1, 2, 3, 4, 5];

const Survey = () => {
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
        const response = await getSurveyItems({ instrument: 'satisfaccion', version: 'v1' });
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

  const aggregates = useMemo(() => {
    const group = items.reduce((acc, item) => {
      const key = item.survey_item_id ?? item.id;
      const value = responses[key];
      if (!value || !item.subscale) {
        return acc;
      }
      if (!acc[item.subscale]) {
        acc[item.subscale] = [];
      }
      acc[item.subscale].push(value);
      return acc;
    }, {});

    const average = (values) => {
      if (!values || values.length === 0) return null;
      return Number((values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2));
    };

    return {
      perceived_utility: average(group.utilidad),
      ease_of_use: average(group.facilidad),
      motivation: average(group.motivacion),
      autonomy: average(group.autonomia),
    };
  }, [responses, items]);

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
        instrument: 'satisfaccion',
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
    return (
      <div className="min-h-screen bg-[#0b1210] text-white flex items-center justify-center">
        <p className="text-sm text-[#9eb7a8]">Cargando encuesta…</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#0b1210] text-white"
      style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}
    >
      <header className="flex items-center justify-between border-b border-[#1f2c26] bg-[#0f1713] px-6 md:px-10 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#6aa58e]">Encuesta</p>
          <h1 className="text-xl font-semibold">Satisfacción con la plataforma</h1>
        </div>
        <span className="text-sm text-[#6aa58e]">Sesión {new Date().toLocaleDateString()}</span>
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
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs text-[#6aa58e]">1</span>
                      <div className="flex flex-1 justify-center gap-2">
                        {likertOptions.map((value) => (
                          <div key={value}>
                            <input
                              type="radio"
                              id={`item-${key}-${value}`}
                              className="peer hidden"
                              checked={responses[key] === value}
                              onChange={() => handleSelect(key, value)}
                            />
                            <label
                              htmlFor={`item-${key}-${value}`}
                              className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold cursor-pointer transition ${
                                responses[key] === value
                                  ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/15 text-[var(--primary-color)]'
                                  : 'border-[#1f2c26] text-[#9eb7a8] hover:border-[var(--primary-color)]/60 hover:text-white'
                              }`}
                            >
                              {value}
                            </label>
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-[#6aa58e]">5</span>
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
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#6aa58e]">Utilidad</p>
                  <p className="mt-1 text-base font-semibold text-white">{aggregates.perceived_utility ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#6aa58e]">Facilidad</p>
                  <p className="mt-1 text-base font-semibold text-white">{aggregates.ease_of_use ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#6aa58e]">Motivación</p>
                  <p className="mt-1 text-base font-semibold text-white">{aggregates.motivation ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#6aa58e]">Autonomía</p>
                  <p className="mt-1 text-base font-semibold text-white">{aggregates.autonomy ?? '—'}</p>
                </div>
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
