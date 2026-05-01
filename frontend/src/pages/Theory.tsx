import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { generateTheoryModule, recordTheoryProgress, submitTheoryCheckpoint } from '../services/api.ts';
import { TM, TMFrame, TMNav, TMBox, TMBtn, TMPrompt } from '../components/terminal';
import { BlockMath, InlineMath } from 'react-katex';

const Theory = () => {
  const navigate = useNavigate();
  const { logout, studyStatus, refreshStudyStatus } = useAuth();
  const [, setModules] = useState<Array<Record<string, unknown>>>([]);
  const [activeModule, setActiveModule] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateModule = async (index: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateTheoryModule(index);
      const data = res.data as { module?: Record<string, unknown> };
      if (data.module) {
        setModules((prev) => {
          const exists = prev.find((m) => (m as { module_id: number }).module_id === (data.module as { module_id: number }).module_id);
          if (exists) return prev;
          return [...prev, data.module!];
        });
        setActiveModule(data.module);
      }
    } catch {
      setError('no pudimos generar el módulo. intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleProgress = async (moduleId: number, progress: number) => {
    try {
      await recordTheoryProgress({ moduleId, progress });
      if (progress >= 1) {
        await refreshStudyStatus();
      }
    } catch {
      // silently fail
    }
  };

  const handleCheckpoint = async (moduleId: number, answers: Array<{ id: string; answer: string }>) => {
    try {
      await submitTheoryCheckpoint({ moduleId, answers });
      await refreshStudyStatus();
    } catch {
      setError('error al validar el checkpoint.');
    }
  };

  void handleCheckpoint;

  const handleNav = (id: string) => {
    if (id === 'dash') navigate('/dashboard');
    else if (id === 'theory') navigate('/theory');
    else if (id === 'practice') navigate('/exercises');
    else if (id === 'chatbot') navigate('/chatbot');
    else if (id === 'profile') navigate('/profile');
  };

  const content = activeModule?.content as string | undefined;
  const description = activeModule?.description as string | undefined;
  const glossary = activeModule?.glossary as Array<{ term: string; definition: string }> | undefined;

  const renderContent = (text: string) => {
    const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const latex = part.slice(2, -2).trim();
        return <BlockMath key={i} math={latex} />;
      }
      if (part.startsWith('$') && part.endsWith('$')) {
        const latex = part.slice(1, -1).trim();
        return <InlineMath key={i} math={latex} />;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <TMFrame title="mathlab" subtitle="~/theory">
      <TMNav active="theory" onNav={handleNav} />
      <main style={{ padding: 26, height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
        <TMPrompt>./theory --load</TMPrompt>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '14px 0 4px', color: TM.fg }}>
          <span style={{ color: TM.amber }}>&gt;</span> módulos de teoría
        </h1>
        <div style={{ fontSize: 11, color: TM.dim, marginBottom: 24 }}>
          // seleccioná un módulo para comenzar
        </div>

        {error && (
          <div style={{ marginBottom: 16, fontSize: 12, color: TM.red }}>
            <span style={{ color: TM.dim }}>err →</span> {error}
          </div>
        )}

        {/* Módulo selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8, marginBottom: 24 }}>
          {Array.from({ length: 6 }).map((_, i) => {
            const isCompleted = i < (studyStatus?.modulesCompleted ?? 0);
            return (
              <button
                key={i}
                onClick={() => generateModule(i)}
                disabled={loading}
                style={{
                  background: isCompleted ? 'rgba(155,212,84,0.08)' : TM.panel,
                  border: `1px solid ${isCompleted ? TM.green : TM.rule}`,
                  borderLeft: `2px solid ${isCompleted ? TM.green : TM.amber}`,
                  padding: '10px 6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  fontFamily: 'inherit',
                  color: TM.fg,
                  fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 2 }}>M{i + 1}</div>
                {isCompleted && <div style={{ fontSize: 10, color: TM.green }}>[x]</div>}
                {!isCompleted && <div style={{ fontSize: 10, color: TM.dim }}>[ ]</div>}
              </button>
            );
          })}
        </div>

        {/* Módulo activo */}
        {loading && (
          <div style={{ fontSize: 12, color: TM.dim }}>$ generando módulo…</div>
        )}

        {activeModule && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: glossary?.length ? '1fr 240px' : '1fr', gap: 16, alignItems: 'start' }}>
            <div>
              <TMBox title={String(activeModule.title ?? 'MÓDULO')} accent={TM.amber}>
                {description && (
                  <p style={{ fontSize: 12, color: TM.dim, marginBottom: 14 }}>// {description}</p>
                )}
                <div style={{ fontSize: 14, color: TM.fg, lineHeight: 1.7 }}>
                  {content ? renderContent(content) : (
                    <span style={{ color: TM.dim }}>sin contenido disponible.</span>
                  )}
                </div>
                <div style={{ marginTop: 20 }}>
                  <TMBtn
                    kind="amber"
                    onClick={() => handleProgress((activeModule as { module_id: number }).module_id, 1)}
                  >
                    ./marcar --completado
                  </TMBtn>
                </div>
              </TMBox>
            </div>

            {glossary && glossary.length > 0 && (
              <TMBox title="GLOSARIO" accent={TM.cyan}>
                {glossary.map((item, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: TM.cyan }}>
                      <span style={{ color: TM.green }}>[x]</span> {item.term}
                    </div>
                    <div style={{ fontSize: 11, color: TM.dim, marginTop: 2, paddingLeft: 16 }}>
                      {item.definition}
                    </div>
                  </div>
                ))}
              </TMBox>
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

export default Theory;
