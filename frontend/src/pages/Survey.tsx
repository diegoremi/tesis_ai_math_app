import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { getSurveyItems, submitSurvey } from '../services/api.ts';

const Survey = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [instrument, setInstrument] = useState('tam');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchItems = async (inst: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setResponses({});
    try {
      const res = await getSurveyItems({ instrument: inst });
      setItems((res.data as { items?: Array<Record<string, unknown>> }).items ?? []);
    } catch {
      setError('No pudimos cargar la encuesta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(instrument);
  }, [instrument]);

  const handleSubmit = async () => {
    const answeredItems = Object.keys(responses).length;
    if (answeredItems < items.length) {
      setError('Por favor responde todas las preguntas antes de enviar.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        instrument,
        responses: Object.entries(responses).map(([survey_item_id, value]) => ({
          survey_item_id: Number(survey_item_id),
          value,
        })),
      };
      await submitSurvey(payload);
      setSuccess(true);
    } catch {
      setError('Error al enviar la encuesta.');
    } finally {
      setSubmitting(false);
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
        <span className="text-lg font-bold">Encuestas</span>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-sm hover:text-emerald-400">Dashboard</button>
          <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">Salir</button>
        </div>
      </nav>
      <main className="px-6 md:px-10 py-10 max-w-2xl mx-auto">
        <div className="flex gap-3 mb-6">
          {['tam', 'motivacion', 'autonomia'].map((inst) => (
            <button
              key={inst}
              onClick={() => setInstrument(inst)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                instrument === inst
                  ? 'bg-emerald-500 text-black'
                  : 'bg-[#101a17] border border-[#29382f] hover:border-emerald-500'
              }`}
            >
              {inst === 'tam' ? 'TAM' : inst === 'motivacion' ? 'Motivación' : 'Autonomía'}
            </button>
          ))}
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
            <p className="text-emerald-400 font-bold">Encuesta enviada correctamente.</p>
          </div>
        )}

        <div className="space-y-4">
          {items.map((item) => {
            const itemId = Number((item as { survey_item_id: number }).survey_item_id);
            return (
              <div key={itemId} className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6">
                <p className="font-medium mb-4">{String((item as { statement: string }).statement ?? '')}</p>
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setResponses({ ...responses, [itemId]: value })}
                      className={`flex-1 rounded-xl py-3 text-sm font-bold transition ${
                        responses[itemId] === value
                          ? 'bg-emerald-500 text-black'
                          : 'bg-[#0b1612] border border-[#29382f] hover:border-emerald-500'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {items.length > 0 && !success && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full mt-6 rounded-full h-12 bg-emerald-500 text-black font-bold hover:opacity-90 transition disabled:opacity-60"
          >
            {submitting ? 'Enviando...' : 'Enviar encuesta'}
          </button>
        )}
      </main>
    </div>
  );
};

export default Survey;
