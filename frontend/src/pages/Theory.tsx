import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { generateTheoryModule, recordTheoryProgress } from '../services/api.ts';
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

  const handleNav = (id: string) => {
    if (id === 'dash') navigate('/dashboard');
    else if (id === 'theory') navigate('/theory');
    else if (id === 'practice') navigate('/exercises');
    else if (id === 'chatbot') navigate('/chatbot');
    else if (id === 'profile') navigate('/profile');
  };

  const content = activeModule?.content as Record<string, unknown> | undefined;
  const description = activeModule?.description as string | undefined;
  const glossary = activeModule?.glossary as Array<{ term: string; definition: string }> | undefined;

  const renderText = (text: string) => {
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

  const renderBodyItem = (item: unknown, i: number) => {
    if (typeof item === 'string') {
      return <p key={i} style={{ marginBottom: 10 }}>{renderText(item)}</p>;
    }
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, string>;
      if (obj.math) {
        return <div key={i} style={{ margin: '12px 0' }}><BlockMath math={obj.math} /></div>;
      }
      if (obj.callout) {
        return (
          <div key={i} style={{ margin: '12px 0', padding: '10px 14px', background: 'rgba(74,203,178,0.08)', borderLeft: `2px solid ${TM.cyan}` }}>
            <span style={{ color: TM.cyan, fontSize: 12 }}>&gt; </span>
            <span style={{ color: TM.fg, fontSize: 13 }}>{renderText(obj.callout)}</span>
          </div>
        );
      }
    }
    return null;
  };

  const renderSectionItem = (item: unknown, key: string | number) => {
    if (typeof item === 'string') {
      // Heuristic: short strings ending with ":" are headings
      if (item.length < 60 && item.trim().endsWith(':')) {
        return (
          <h3 key={key} style={{ fontSize: 15, color: TM.amber, marginBottom: 10, marginTop: 20, fontWeight: 700 }}>
            {item}
          </h3>
        );
      }
      return <p key={key} style={{ marginBottom: 10, lineHeight: 1.7 }}>{renderText(item)}</p>;
    }
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      if (typeof obj.math === 'string') {
        return (
          <div key={key} style={{ margin: '12px 0' }}>
            <BlockMath math={obj.math} />
          </div>
        );
      }
      if (typeof obj.callout === 'string') {
        return (
          <div
            key={key}
            style={{
              margin: '12px 0',
              padding: '10px 14px',
              background: 'rgba(74,203,178,0.08)',
              borderLeft: `2px solid ${TM.cyan}`,
            }}
          >
            <span style={{ color: TM.cyan, fontSize: 12 }}>&gt; </span>
            <span style={{ color: TM.fg, fontSize: 13 }}>{renderText(obj.callout)}</span>
          </div>
        );
      }
      if (obj.visualization) {
        return (
          <div key={key} style={{ margin: '12px 0', padding: 10, background: TM.panel, border: `1px solid ${TM.rule}` }}>
            <span style={{ color: TM.dim, fontSize: 11 }}>// visualización disponible en el contenido</span>
          </div>
        );
      }
    }
    return null;
  };

  const renderStructuredSection = (section: Record<string, unknown>, idx: number) => {
    return (
      <div key={idx} style={{ marginBottom: 24 }}>
        {Boolean(section.heading) && (
          <h3 style={{ fontSize: 15, color: TM.amber, marginBottom: 10, fontWeight: 700 }}>
            {String(section.heading)}
          </h3>
        )}
        {Array.isArray(section.body) && section.body.map((item, i) => renderBodyItem(item, i))}
        {Boolean(section.visualization) && (
          <div style={{ margin: '12px 0', padding: 10, background: TM.panel, border: `1px solid ${TM.rule}` }}>
            <span style={{ color: TM.dim, fontSize: 11 }}>// visualización disponible en el contenido</span>
          </div>
        )}
      </div>
    );
  };

  const renderSections = (sections: unknown[]) => {
    // Detect format: structured (fallback) vs flat (AI-generated)
    const isFlat = sections.length > 0 && (typeof sections[0] === 'string' || (typeof sections[0] === 'object' && sections[0] !== null && !('heading' in (sections[0] as object))));
    
    if (isFlat) {
      return <div>{sections.map((item, i) => renderSectionItem(item, i))}</div>;
    }
    
    return <div>{sections.map((section, i) => renderStructuredSection(section as Record<string, unknown>, i))}</div>;
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
                  {content && Array.isArray(content.sections) ? (
                    renderSections(content.sections)
                  ) : (
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
