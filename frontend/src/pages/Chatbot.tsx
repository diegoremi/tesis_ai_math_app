import { useState, type FormEvent, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { chat } from '../services/api.ts';
import { TM, TMFrame, TMNav, TMBox, TMBtn, FONT_MONO } from '../components/terminal';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const QUICK_ASKS = [
  '¿podés explicarme este ejercicio paso a paso?',
  '¿cuál es la diferencia entre estos conceptos?',
  '¿cómo se resuelve este tipo de problema?',
  '¿podés mostrarme un ejemplo similar?',
  'no entiendo el error que cometí',
];

const renderAssistantText = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const stepMatch = line.match(/^(\d+[.)]\s|[-•]\s|↳\s?)/);
    if (stepMatch) {
      return (
        <div key={i} style={{ display: 'flex', gap: 8, paddingLeft: 24, marginBottom: 4 }}>
          <span style={{ color: TM.cyan, flexShrink: 0 }}>↳</span>
          <span>{line.replace(stepMatch[0], '').trim()}</span>
        </div>
      );
    }
    return line ? <p key={i} style={{ margin: '0 0 4px' }}>{line}</p> : <br key={i} />;
  });
};

const Chatbot = () => {
  const navigate = useNavigate();
  const { featureFlags, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCount] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatbotEnabled = Boolean(featureFlags?.chatbot);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text: text.trim() }]);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      const res = await chat(text.trim());
      const data = res.data as { response?: string };
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: data.response ?? 'no tengo una respuesta en este momento.',
      }]);
    } catch {
      setError('el tutor ia no está disponible. intentá más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const handleNav = (id: string) => {
    if (id === 'dash') navigate('/dashboard');
    else if (id === 'theory') navigate('/theory');
    else if (id === 'practice') navigate('/exercises');
    else if (id === 'chatbot') navigate('/chatbot');
    else if (id === 'profile') navigate('/profile');
  };

  if (!chatbotEnabled) {
    return (
      <TMFrame title="mathlab" subtitle="~/tutor">
        <TMNav active="chatbot" onNav={handleNav} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 80px)', padding: 36 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: TM.dim, marginBottom: 14 }}>$ ./tutor --status</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TM.fg, marginBottom: 8 }}>
              <span style={{ color: TM.dim }}>[ ]</span> tutor ia no disponible
            </div>
            <p style={{ fontSize: 13, color: TM.dim, marginBottom: 18 }}>
              // el tutor ia está desactivado para tu grupo de estudio.
            </p>
            <TMBtn kind="ghost" onClick={() => navigate('/dashboard')}>./volver al panel</TMBtn>
          </div>
        </div>
      </TMFrame>
    );
  }

  return (
    <TMFrame title="mathlab" subtitle="~/tutor">
      <TMNav active="chatbot" onNav={handleNav} />
      <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>

        {/* Chat principal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: 60 }}>
                <div style={{ fontSize: 12, color: TM.dim, marginBottom: 10 }}>$ ./tutor --init</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: TM.fg, marginBottom: 6 }}>
                  <span style={{ color: TM.amber }}>&gt;</span> tutor.ai listo
                </div>
                <div style={{ fontSize: 12, color: TM.dim }}>// hacé tu pregunta sobre ejercicios o conceptos</div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {msg.role === 'user' ? (
                  <div style={{
                    maxWidth: '72%',
                    background: TM.cyan,
                    color: TM.bgDeep,
                    padding: '10px 14px',
                    fontSize: 13,
                    lineHeight: 1.5,
                    fontFamily: FONT_MONO,
                  }}>
                    {msg.text}
                  </div>
                ) : (
                  <div style={{
                    maxWidth: '78%',
                    background: TM.panel,
                    borderLeft: `2px solid ${TM.amber}`,
                    border: `1px solid ${TM.rule}`,
                    borderLeftWidth: 2,
                    borderLeftColor: TM.amber,
                    padding: '10px 14px',
                    fontSize: 13,
                    color: TM.fg,
                    lineHeight: 1.6,
                    fontFamily: FONT_MONO,
                  }}>
                    {renderAssistantText(msg.text)}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  background: TM.panel, border: `1px solid ${TM.rule}`,
                  borderLeft: `2px solid ${TM.amber}`, borderLeftWidth: 2,
                  padding: '10px 14px', fontSize: 13, color: TM.dim,
                }}>
                  <span style={{ animation: 'tm-blink 1.1s steps(1) infinite' }}>▌</span> procesando…
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '0 22px 8px', fontSize: 12, color: TM.red }}>
              <span style={{ color: TM.dim }}>err →</span> {error}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex', gap: 0,
              borderTop: `1px solid ${TM.rule}`,
              padding: '12px 22px',
              background: TM.bg,
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="escribí tu pregunta…"
              style={{
                flex: 1,
                background: TM.panel, color: TM.fg,
                border: `1px solid ${TM.rule}`,
                borderLeft: `2px solid ${TM.amber}`,
                borderRight: 'none',
                padding: '8px 12px',
                fontSize: 14, fontFamily: FONT_MONO,
                outline: 'none', borderRadius: 0,
              }}
            />
            <TMBtn kind="amber" type="submit" disabled={loading || !input.trim()}>
              ./send
            </TMBtn>
          </form>
        </div>

        {/* Sidebar derecho 220px */}
        <div style={{
          width: 220, flexShrink: 0,
          borderLeft: `1px solid ${TM.rule}`,
          display: 'flex', flexDirection: 'column', gap: 0,
          overflowY: 'auto',
          padding: 14,
          background: TM.bg,
        }}>
          <TMBox title="CONTEXT" accent={TM.amber} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: TM.fg, lineHeight: 1.8 }}>
              <div>
                <span style={{ color: TM.dim }}>topic:</span>{' '}
                <span style={{ color: TM.amber }}>matemática</span>
              </div>
              <div>
                <span style={{ color: TM.dim }}>session:</span>{' '}
                <span style={{ color: TM.fg }}>{sessionCount}</span>
              </div>
              <div>
                <span style={{ color: TM.dim }}>mensajes:</span>{' '}
                <span style={{ color: TM.fg }}>{messages.length}</span>
              </div>
              {error && (
                <div style={{ marginTop: 4 }}>
                  <span style={{ color: TM.dim }}>last_err:</span>{' '}
                  <span style={{ color: TM.red }}>timeout</span>
                </div>
              )}
            </div>
          </TMBox>

          <TMBox title="QUICK ASKS" accent={TM.cyan}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {QUICK_ASKS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  style={{
                    background: TM.panel2, border: `1px solid ${TM.rule}`,
                    padding: '6px 8px', cursor: 'pointer',
                    fontFamily: FONT_MONO, fontSize: 11, color: TM.dim,
                    textAlign: 'left', lineHeight: 1.4,
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  <span style={{ color: TM.cyan }}>↳</span> {q}
                </button>
              ))}
            </div>
          </TMBox>

          <div style={{ marginTop: 'auto', paddingTop: 14, textAlign: 'right' }}>
            <span onClick={logout} style={{ fontSize: 11, color: TM.dim, cursor: 'pointer' }}>
              // ./logout
            </span>
          </div>
        </div>
      </div>
    </TMFrame>
  );
};

export default Chatbot;
