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
    return <div className="min-h-screen bg-gray-50 text-center text-gray-600 pt-20">Cargando encuesta…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-10 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-[#137fec] font-semibold">AI</div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Encuesta</p>
            <h1 className="text-xl font-semibold">Satisfacción con la plataforma</h1>
          </div>
        </div>
        <span className="text-sm text-gray-500">Sesión {new Date().toLocaleDateString()}</span>
      </header>

      <main className="px-6 py-12 flex justify-center bg-gray-50">
        <form onSubmit={handleSubmit} className="w-full max-w-3xl bg-white border border-gray-200 rounded-3xl shadow-sm">
          <div className="px-8 py-12 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Tu opinión es clave</h2>
              <p className="text-sm text-gray-600">Cuéntanos cómo te acompañó la plataforma esta semana.</p>
            </div>

            <div className="space-y-6">
              {items.map((item) => {
                const key = item.survey_item_id ?? item.id;
                return (
                  <div key={key} className="rounded-2xl border border-gray-200 p-6">
                    <p className="text-base font-semibold text-gray-800">{item.prompt ?? item.question}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs text-gray-500">1</span>
                      <div className="flex flex-1 justify-center gap-2">
                        {likertOptions.map((value) => (
                          <div key={value}>
                            <input
                              type="radio"
                              id={`item-${key}-${value}`}
                              className="hidden"
                              checked={responses[key] === value}
                              onChange={() => handleSelect(key, value)}
                            />
                            <label
                              htmlFor={`item-${key}-${value}`}
                              className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold cursor-pointer transition ${
                                responses[key] === value
                                  ? 'border-[#137fec] bg-[#e8f2fe] text-[#137fec]'
                                  : 'border-gray-200 text-gray-600 hover:border-[#137fec] hover:text-[#137fec]'
                              }`}
                            >
                              {value}
                            </label>
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">5</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
                Comentarios adicionales
              </label>
              <textarea
                id="comments"
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec]"
                placeholder="¿Qué funcionó mejor? ¿Qué podemos mejorar?"
              />
            </div>

            {notice && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  notice.type === 'success'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-red-300 bg-red-50 text-red-600'
                }`}
              >
                {notice.message}
              </div>
            )}
          </div>

          <div className="px-8 py-6 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-500">
              Promedio utilidad: <span className="font-semibold text-gray-700">{aggregates.perceived_utility ?? '—'}</span>
            </div>
            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#137fec] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0d6fd0] disabled:opacity-70"
            >
              {submitting ? 'Enviando…' : 'Enviar respuestas'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Survey;
