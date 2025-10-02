import React, { useEffect, useMemo, useState } from 'react';
import { submitSurvey, getSurveyItems } from '../services/api';

const likertOptions = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
];

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
      setNotice({ type: 'error', message: 'Unable to load survey items. Please retry later.' });
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
      if (value && item.subscale) {
        if (!acc[item.subscale]) {
          acc[item.subscale] = [];
        }
        acc[item.subscale].push(value);
      }
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
      setNotice({ type: 'error', message: 'No survey items available.' });
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
      setNotice({ type: 'success', message: 'Thanks for your feedback! Your responses were saved.' });
    } catch (error) {
      console.error('Error submitting survey:', error);
      setNotice({ type: 'error', message: 'We could not submit the survey. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-10 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-[#137fec] font-semibold">AI</div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Feedback</p>
            <h1 className="text-xl font-semibold">User Satisfaction Survey</h1>
          </div>
        </div>
        <span className="text-sm text-gray-500">Session {new Date().toLocaleDateString()}</span>
      </header>

      <main className="px-6 py-12 flex justify-center bg-gray-50">
        <form onSubmit={handleSubmit} className="w-full max-w-3xl bg-white border border-gray-200 rounded-3xl shadow-sm">
          <div className="px-8 py-12 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Your feedback matters</h2>
              <p className="text-sm text-gray-600">Tell us how the experience felt this week.</p>
            </div>

            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.survey_item_id ?? item.id} className="rounded-2xl border border-gray-200 p-6">
                  <p className="text-base font-semibold text-gray-800">{item.prompt ?? item.question}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-500">1</span>
                    <div className="flex flex-1 justify-center gap-2">
                      {likertOptions.map((option) => (
                        <div key={option.value}>
                          <input
                            type="radio"
                            id={`item-${item.survey_item_id ?? item.id}-${option.value}`}
                            className="hidden"
                            checked={responses[item.survey_item_id ?? item.id] === option.value}
                            onChange={() => handleSelect(item.survey_item_id ?? item.id, option.value)}
                          />
                          <label
                            htmlFor={`item-${item.survey_item_id ?? item.id}-${option.value}`}
                            className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold cursor-pointer transition ${
                              responses[item.survey_item_id ?? item.id] === option.value
                                ? 'border-[#137fec] bg-[#e8f2fe] text-[#137fec]'
                                : 'border-gray-200 text-gray-600 hover:border-[#137fec] hover:text-[#137fec]'
                            }`}
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">5</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
                Additional comments
              </label>
              <textarea
                id="comments"
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec]"
                placeholder="Tell us about moments where the AI surprised you or where you wish it had done more."
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

          {loading && (
            <div className="px-8 text-sm text-gray-500">Loading questions…</div>
          )}

          <div className="px-8 py-6 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-500">
              Average usefulness: <span className="font-semibold text-gray-700">{aggregates.perceived_utility ?? '—'}</span>
            </div>
            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#137fec] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0d6fd0] disabled:opacity-70"
            >
              {submitting ? 'Sending…' : 'Submit feedback'}
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Survey;
