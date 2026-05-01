import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { getSurveyItems, submitSurvey } from '../services/api.ts';
import { TM, TMFrame, TMNav, TMBox, TMBtn, TMPrompt, FONT_MONO } from '../components/terminal';

const INSTRUMENTS = [
  { id: 'tam', label: './tam' },
  { id: 'motivacion', label: './motivacion' },
  { id: 'autonomia', label: './autonomia' },
];

const Survey = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [openText, setOpenText] = useState('');
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
    setOpenText('');
    try {
      const res = await getSurveyItems({ instrument: inst });
      setItems((res.data as { items?: Array<Record<string, unknown>> }).items ?? []);
    } catch {
      setError('no pudimos cargar la encuesta.');
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
      setError('respondé todas las preguntas antes de enviar.');
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
      setError('error al enviar la encuesta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNav = (id: string) => {
    if (id === 'dash') navigate('/dashboard');
    else if (id === 'theory') navigate('/theory');
    else if (id === 'practice') navigate('/exercises');
    else if (id === 'chatbot') navigate('/chatbot');
    else if (id === 'profile') navigate('/profile');
  };

  return (
    <TMFrame title="mathlab" subtitle="~/survey">
      <TMNav onNav={handleNav} />
      <main style={{ padding: 26, height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
        <TMPrompt>./survey --run</TMPrompt>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '14px 0 4px', color: TM.fg }}>
          <span style={{ color: TM.amber }}>&gt;</span> encuesta
        </h1>
        <div style={{ fontSize: 11, color: TM.dim, marginBottom: 22 }}>
          // tu opinión nos ayuda a mejorar la experiencia de aprendizaje
        </div>

        {/* Selector de instrumento */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {INSTRUMENTS.map((inst) => (
            <button
              key={inst.id}
              onClick={() => setInstrument(inst.id)}
              style={{
                background: instrument === inst.id ? TM.amber : TM.panel,
                color: instrument === inst.id ? TM.bgDeep : TM.fg,
                border: `1px solid ${instrument === inst.id ? TM.amber : TM.rule}`,
                padding: '5px 14px',
                fontFamily: FONT_MONO, fontSize: 12,
                cursor: 'pointer', fontWeight: instrument === inst.id ? 700 : 400,
              }}
            >
              {instrument === inst.id ? '▸ ' : ''}{inst.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ marginBottom: 16, fontSize: 12, color: TM.red }}>
            <span style={{ color: TM.dim }}>err →</span> {error}
          </div>
        )}

        {success && (
          <TMBox title="ENVIADO" accent={TM.green} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: TM.green }}>
              <span>[x]</span> encuesta enviada correctamente. gracias por tu tiempo.
            </div>
          </TMBox>
        )}

        {loading && (
          <div style={{ fontSize: 12, color: TM.dim }}>$ cargando preguntas…</div>
        )}

        {!loading && !success && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
            {items.map((item, idx) => {
              const itemId = Number((item as { survey_item_id: number }).survey_item_id);
              const accent = idx % 2 === 0 ? TM.amber : TM.cyan;
              return (
                <TMBox key={itemId} accent={accent}>
                  <p style={{ fontSize: 13, color: TM.fg, marginBottom: 14, lineHeight: 1.5 }}>
                    {String((item as { statement: string }).statement ?? '')}
                  </p>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: TM.dim, marginRight: 4 }}>en desacuerdo</span>
                    {[1, 2, 3, 4, 5].map((value) => {
                      const selected = responses[itemId] === value;
                      return (
                        <button
                          key={value}
                          onClick={() => setResponses({ ...responses, [itemId]: value })}
                          style={{
                            width: 36, height: 36,
                            background: selected ? accent : TM.panel,
                            color: selected ? TM.bgDeep : TM.dim,
                            border: `1px solid ${selected ? accent : TM.rule}`,
                            fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {value}
                        </button>
                      );
                    })}
                    <span style={{ fontSize: 10, color: TM.dim, marginLeft: 4 }}>de acuerdo</span>
                  </div>
                </TMBox>
              );
            })}

            {items.length > 0 && (
              <>
                {/* Pregunta abierta */}
                <div>
                  <label style={{ display: 'block' }}>
                    <span style={{ fontSize: 10, color: TM.cyan, letterSpacing: 1.5 }}>
                      &gt; comentario libre
                    </span>
                    <textarea
                      value={openText}
                      onChange={(e) => setOpenText(e.target.value)}
                      placeholder="¿algo más que quieras compartir sobre tu experiencia?"
                      rows={4}
                      style={{
                        display: 'block', width: '100%',
                        boxSizing: 'border-box',
                        background: TM.panel, color: TM.fg,
                        border: `1px solid ${TM.rule}`,
                        borderLeft: `2px solid ${TM.cyan}`,
                        padding: '8px 12px', marginTop: 4,
                        fontSize: 13, fontFamily: FONT_MONO,
                        outline: 'none', borderRadius: 0, resize: 'vertical',
                      }}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                  <TMBtn kind="amber" size="lg" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? './enviando…' : './submit --encuesta'}
                  </TMBtn>
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ marginTop: 26, textAlign: 'right' }}>
          <span onClick={logout} style={{ fontSize: 11, color: TM.dim, cursor: 'pointer' }}>
            // ./logout
          </span>
        </div>
      </main>
    </TMFrame>
  );
};

export default Survey;
