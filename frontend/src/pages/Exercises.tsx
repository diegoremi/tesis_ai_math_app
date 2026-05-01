import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { getExercise, submitAnswer, getHint } from '../services/api.ts';
import { TM, TMFrame, TMNav, TMBox, TMBtn, TMPrompt } from '../components/terminal';

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
      setError('no pudimos cargar el ejercicio.');
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
      setError('error al enviar la respuesta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHint = async () => {
    if (!exercise) return;
    try {
      const res = await getHint(exercise.id as number, hintLevel);
      setHint((res.data as { hint?: string }).hint ?? 'aquí va una pista…');
      setHintLevel((prev) => Math.min(prev + 1, 3));
    } catch {
      setError('no pudimos obtener la pista.');
    }
  };

  const handleNav = (id: string) => {
    if (id === 'dash') navigate('/dashboard');
    else if (id === 'theory') navigate('/theory');
    else if (id === 'practice') navigate('/exercises');
    else if (id === 'chatbot') navigate('/chatbot');
    else if (id === 'profile') navigate('/profile');
  };

  const options = (exercise?.options as Array<{ key: string; label: string }>) ?? [];
  const correct = result?.correct as boolean | undefined;
  const explanation = result?.explanation as string | undefined;
  const steps = result?.steps as Array<string> | undefined;

  return (
    <TMFrame title="mathlab" subtitle="~/practice">
      <TMNav active="practice" onNav={handleNav} />
      <main style={{ padding: 26, height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
        <TMPrompt>./practice --adaptive</TMPrompt>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '14px 0 4px', color: TM.fg }}>
          <span style={{ color: TM.amber }}>&gt;</span> ejercicios
        </h1>
        <div style={{ fontSize: 11, color: TM.dim, marginBottom: 24 }}>
          // resolvé el ejercicio y enviá tu respuesta
        </div>

        {error && (
          <div style={{ marginBottom: 16, fontSize: 12, color: TM.red }}>
            <span style={{ color: TM.dim }}>err →</span> {error}
          </div>
        )}

        {loading && (
          <div style={{ fontSize: 12, color: TM.dim }}>$ cargando ejercicio…</div>
        )}

        {!loading && exercise && (
          <div style={{ maxWidth: 640 }}>
            {/* Enunciado */}
            <TMBox
              title={`${String(exercise.domain ?? '')} · ${String(exercise.competency ?? '')}`}
              accent={TM.amber}
              style={{ marginBottom: 14 }}
            >
              <p style={{ fontSize: 15, color: TM.fg, lineHeight: 1.6, margin: 0 }}>
                {String(exercise.stem ?? '')}
              </p>
            </TMBox>

            {/* Opciones múltiple choice */}
            {options.length > 0 && !result && (
              <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                {options.map((option) => {
                  const selected = answer === option.key;
                  return (
                    <button
                      key={option.key}
                      onClick={() => setAnswer(option.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        background: selected ? 'rgba(255,180,84,0.08)' : TM.panel,
                        border: `1px solid ${selected ? TM.amber : TM.rule}`,
                        borderLeft: `2px solid ${selected ? TM.amber : TM.rule}`,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        color: TM.fg,
                        fontSize: 13,
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ color: selected ? TM.amber : TM.dim, fontWeight: 700 }}>
                        {selected ? '[x]' : '[ ]'}
                      </span>
                      <span style={{ color: TM.amber, fontWeight: 700 }}>{option.key}.</span>
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Input libre (si no hay opciones) */}
            {options.length === 0 && !result && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block' }}>
                  <span style={{ fontSize: 10, color: TM.amber, letterSpacing: 1.5 }}>&gt; respuesta</span>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="escribí tu respuesta…"
                    style={{
                      display: 'block',
                      width: '100%',
                      boxSizing: 'border-box',
                      background: TM.panel,
                      color: TM.fg,
                      border: `1px solid ${TM.rule}`,
                      borderLeft: `2px solid ${TM.amber}`,
                      padding: '8px 12px',
                      marginTop: 4,
                      fontSize: 14,
                      fontFamily: 'inherit',
                      outline: 'none',
                      borderRadius: 0,
                    }}
                  />
                </label>
              </div>
            )}

            {/* Acciones */}
            {!result && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <TMBtn kind="amber" onClick={handleSubmit} disabled={!answer || submitting}>
                  {submitting ? './enviando…' : './solve'}
                </TMBtn>
                {chatbotEnabled && (
                  <TMBtn kind="ghost" onClick={handleHint}>./hint</TMBtn>
                )}
              </div>
            )}

            {/* Pista */}
            {hint && (
              <TMBox title="PISTA" accent={TM.cyan} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: TM.fg }}>
                  <span style={{ color: TM.cyan }}>↳</span> {hint}
                </div>
              </TMBox>
            )}

            {/* Verificación */}
            {result && (
              <>
                <TMBox
                  title="VERIFICACIÓN"
                  accent={correct ? TM.green : TM.red}
                  style={{ marginBottom: 14 }}
                >
                  <div style={{ fontSize: 14, color: correct ? TM.green : TM.red, fontWeight: 700, marginBottom: 8 }}>
                    {correct
                      ? <><span>[x]</span> respuesta correcta</>
                      : <><span>[ ]</span> respuesta incorrecta</>
                    }
                  </div>
                  {explanation && (
                    <div style={{ fontSize: 13, color: TM.fg }}>{explanation}</div>
                  )}
                </TMBox>

                {/* Tutor IA */}
                {steps && steps.length > 0 && (
                  <TMBox title="TUTOR.AI" accent={TM.amber} style={{ marginBottom: 14 }}>
                    {steps.map((step, i) => (
                      <div key={i} style={{ fontSize: 13, color: TM.fg, marginBottom: 6 }}>
                        <span style={{ color: TM.cyan }}>↳</span> {step}
                      </div>
                    ))}
                  </TMBox>
                )}

                <TMBtn kind="ghost" onClick={fetchExercise}>./siguiente --ejercicio</TMBtn>
              </>
            )}
          </div>
        )}

        <div style={{ marginTop: 26, textAlign: 'right' }}>
          <span
            onClick={logout}
            style={{ fontSize: 11, color: TM.dim, cursor: 'pointer' }}
          >
            // ./logout
          </span>
        </div>
      </main>
    </TMFrame>
  );
};

export default Exercises;
