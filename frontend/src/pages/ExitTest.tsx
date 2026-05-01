import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAssessment, getAssessmentItems } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { TM, TMFrame, TMBtn, TMBox, FONT_MONO } from '../components/terminal';

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};

const toSuperscript = (text = '') =>
  String(text).replace(/\^([0-9]+)/g, (_, digits: string) =>
    digits.split('').map((d) => SUPERSCRIPT_MAP[d] ?? d).join(''),
  );

const ASSESSMENT_DURATION_MINUTES = 20;

interface AssessmentItem {
  item_id: number;
  stem: string;
  options: Array<{ key: string; label: string }>;
}

const ExitTest = () => {
  const navigate = useNavigate();
  const { refreshAssessmentStatus } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(ASSESSMENT_DURATION_MINUTES * 60);
  const [tabSwitches, setTabSwitches] = useState(0);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await getAssessmentItems({ type: 'posttest', version: 'exit_v1' });
        const fetched = (response.data as { items?: AssessmentItem[] }).items ?? [];
        setItems(fetched);
        setAnswers({});
        setFlagged({});
        setStep(0);
      } catch {
        setError('no pudimos cargar las preguntas del exit test. intentá de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Timer
  useEffect(() => {
    if (loading || submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, submitted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Anti-copy
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => { e.preventDefault(); };
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); };
    const handleVisibilityChange = () => {
      if (document.hidden) setTabSwitches((prev) => prev + 1);
    };
    document.addEventListener('copy', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleAutoSubmit = useCallback(async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      const responses = items.map((item) => ({
        item_id: item.item_id,
        answer: answers[item.item_id] ?? null,
      }));
      await createAssessment({ assessment_type: 'posttest', test_version: 'exit_v1', responses });
      await refreshAssessmentStatus();
      setSubmitted(true);
    } catch {
      setError('el tiempo se agotó y no pudimos guardar tus respuestas.');
    } finally {
      setSubmitting(false);
    }
  }, [items, answers, submitting, submitted, refreshAssessmentStatus]);

  const currentQuestion = items[step];
  const optionList = Array.isArray(currentQuestion?.options) ? currentQuestion.options : [];

  const progress = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.round(((step + 1) / items.length) * 100);
  }, [step, items.length]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleInput = (value: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.item_id]: value }));
  };

  const handleNext = () => { if (step < items.length - 1) setStep(step + 1); };
  const handlePrev = () => { if (step > 0) setStep(step - 1); };

  const toggleFlag = () => {
    if (!currentQuestion) return;
    setFlagged((prev) => ({ ...prev, [currentQuestion.item_id]: !prev[currentQuestion.item_id] }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const responses = items.map((item) => ({
        item_id: item.item_id,
        answer: answers[item.item_id] ?? null,
      }));
      await createAssessment({ assessment_type: 'posttest', test_version: 'exit_v1', responses });
      await refreshAssessmentStatus();
      setSubmitted(true);
    } catch {
      setError('no pudimos guardar tus respuestas. intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const timeWarning = timeLeft < 300;

  // ─── estados ───────────────────────────────────────────────────

  if (loading) {
    return (
      <TMFrame title="mathlab" subtitle="~/posttest">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 32px)' }}>
          <span style={{ fontSize: 12, color: TM.dim }}>$ cargando preguntas…</span>
        </div>
      </TMFrame>
    );
  }

  if (submitted) {
    return (
      <TMFrame title="mathlab" subtitle="~/posttest/done">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 32px)', padding: 36 }}>
          <div style={{ width: 460, maxWidth: '100%' }}>
            <div style={{ fontSize: 12, color: TM.dim, marginBottom: 14 }}>$ ./posttest --formal</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: TM.fg, margin: '0 0 8px' }}>
              <span style={{ color: TM.green }}>[x]</span> exit test completado
            </h1>
            <p style={{ fontSize: 13, color: TM.dim, marginBottom: 22, lineHeight: 1.6 }}>
              // gracias por compartir tu progreso. revisá los reportes finales desde el panel.
            </p>
            {tabSwitches > 0 && (
              <div style={{ fontSize: 11, color: TM.amber, marginBottom: 16 }}>
                warn → se detectaron {tabSwitches} cambios de pestaña durante la evaluación.
              </div>
            )}
            <TMBtn kind="amber" onClick={() => navigate('/dashboard', { replace: true })}>
              ./volver al panel →
            </TMBtn>
          </div>
        </div>
      </TMFrame>
    );
  }

  if (!currentQuestion) {
    return (
      <TMFrame title="mathlab" subtitle="~/posttest">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 32px)' }}>
          <span style={{ fontSize: 12, color: TM.dim }}>// no hay preguntas disponibles en este momento.</span>
        </div>
      </TMFrame>
    );
  }

  // ─── pantalla principal ────────────────────────────────────────

  return (
    <TMFrame title="mathlab" subtitle="~/posttest">
      <div
        style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 32px)' }}
        onCopy={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Header sticky */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 26px',
          background: TM.panel,
          borderBottom: `1px solid ${TM.rule}`,
        }}>
          <div style={{ fontSize: 12, color: TM.amber }}>
            $ ./posttest --formal
            <span style={{ color: TM.amber, animation: 'tm-blink 1.1s steps(1) infinite', marginLeft: 4 }}>▌</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {tabSwitches > 0 && (
              <span style={{ fontSize: 11, color: TM.amber }}>
                warn → {tabSwitches} cambios de pestaña
              </span>
            )}
            <span style={{
              fontSize: 13, fontWeight: 700, fontFamily: FONT_MONO,
              color: timeWarning ? TM.red : TM.cyan,
              padding: '2px 10px',
              border: `1px solid ${timeWarning ? TM.red : TM.cyan}`,
            }}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Body: 2 columnas */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Columna principal */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '26px 26px 0' }}>
            {/* Numeración y progreso */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                <span style={{ color: TM.amber }}>Q{step + 1}</span>
                <span style={{ color: TM.dim }}> / {items.length}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 120, height: 4, background: TM.rule }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: TM.amber }} />
                </div>
                <span style={{ fontSize: 11, color: TM.dim }}>{progress}%</span>
              </div>
            </div>

            {/* Enunciado */}
            <div style={{
              fontSize: 16, color: TM.fg, lineHeight: 1.65,
              marginBottom: 22, padding: '14px 18px',
              background: TM.panel, border: `1px solid ${TM.rule}`,
              borderLeft: `2px solid ${TM.amber}`, borderLeftWidth: 2,
            }}>
              {toSuperscript(currentQuestion.stem)}
            </div>

            {/* Opciones */}
            <div style={{ display: 'grid', gap: 8, marginBottom: 22 }}>
              {optionList.map((option) => {
                const selected = answers[currentQuestion.item_id] === (option.key ?? option.label);
                return (
                  <button
                    key={option.key ?? option.label}
                    type="button"
                    onClick={() => handleInput(option.key ?? option.label)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px',
                      background: selected ? 'rgba(255,180,84,0.08)' : TM.panel,
                      border: `1px solid ${selected ? TM.amber : TM.rule}`,
                      borderLeft: `2px solid ${selected ? TM.amber : TM.rule}`,
                      cursor: 'pointer', fontFamily: FONT_MONO,
                      color: TM.fg, fontSize: 14, textAlign: 'left',
                    }}
                  >
                    <span style={{ color: selected ? TM.amber : TM.dim, fontWeight: 700, flexShrink: 0 }}>
                      {selected ? '[x]' : '[ ]'}
                    </span>
                    <span style={{ color: TM.amber, fontWeight: 700, flexShrink: 0 }}>{option.key}.</span>
                    {toSuperscript(option.label)}
                  </button>
                );
              })}
            </div>

            {/* Marcar para revisar */}
            <div style={{ marginBottom: 16 }}>
              <TMBtn
                kind="ghost"
                size="sm"
                onClick={toggleFlag}
                style={{ borderColor: flagged[currentQuestion.item_id] ? TM.amber : TM.rule }}
              >
                {flagged[currentQuestion.item_id] ? '▓ marcada para revisar' : '░ marcar para revisar'}
              </TMBtn>
            </div>

            {error && (
              <div style={{ marginBottom: 16, fontSize: 12, color: TM.red }}>
                <span style={{ color: TM.dim }}>err →</span> {error}
              </div>
            )}
          </div>

          {/* Sidebar: hoja de respuestas */}
          <div style={{
            width: 200, flexShrink: 0, borderLeft: `1px solid ${TM.rule}`,
            overflowY: 'auto', padding: 14,
          }}>
            <TMBox title="RESPUESTAS" accent={TM.cyan} style={{ border: 'none', padding: 0, background: 'transparent' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {items.map((item, i) => {
                  const answered = Boolean(answers[item.item_id]);
                  const isFlagged = Boolean(flagged[item.item_id]);
                  const isCurrent = i === step;
                  let glyph = '░';
                  if (isFlagged) glyph = '▓';
                  else if (answered) glyph = '▒';

                  return (
                    <button
                      key={item.item_id}
                      onClick={() => setStep(i)}
                      title={`Q${i + 1}`}
                      style={{
                        width: 28, height: 28,
                        background: isCurrent ? 'rgba(255,180,84,0.15)' : TM.panel,
                        border: `1px solid ${isCurrent ? TM.amber : TM.rule}`,
                        cursor: 'pointer', fontFamily: FONT_MONO, fontSize: 13,
                        color: isFlagged ? TM.amber : answered ? TM.cyan : TM.dim,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {glyph}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 14, fontSize: 10, color: TM.dim, lineHeight: 1.8 }}>
                <div><span style={{ color: TM.dim }}>░</span> sin responder</div>
                <div><span style={{ color: TM.cyan }}>▒</span> contestada</div>
                <div><span style={{ color: TM.amber }}>▓</span> revisar</div>
              </div>
            </TMBox>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 26px',
          borderTop: `1px solid ${TM.rule}`,
          background: TM.bg,
        }}>
          <TMBtn kind="ghost" onClick={handlePrev} disabled={step === 0 || submitting}>
            ./back
          </TMBtn>
          {step < items.length - 1 ? (
            <TMBtn kind="amber" onClick={handleNext} disabled={submitting}>
              ./next →
            </TMBtn>
          ) : (
            <TMBtn kind="amber" onClick={handleSubmit} disabled={submitting}>
              {submitting ? './enviando…' : './submit --posttest →'}
            </TMBtn>
          )}
        </div>
      </div>
    </TMFrame>
  );
};

export default ExitTest;
