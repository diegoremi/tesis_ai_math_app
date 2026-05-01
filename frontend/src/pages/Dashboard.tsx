import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { getActivities, getAssessments } from '../services/api.ts';
import { TM, TMFrame, TMNav, TMBox, TMPrompt } from '../components/terminal';

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout, featureFlags, studyStatus, refreshStudyStatus } = useAuth();
  const [, setActivities] = useState<Array<Record<string, unknown>>>([]);
  const [assessments, setAssessments] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activitiesResponse, assessmentsResponse] = await Promise.all([
          getActivities(),
          getAssessments(),
        ]);
        setActivities(activitiesResponse.data as Array<Record<string, unknown>>);
        setAssessments(assessmentsResponse.data as Array<Record<string, unknown>>);
        await refreshStudyStatus();
      } catch {
        setError('no pudimos cargar tu información. iniciá sesión de nuevo.');
        logout();
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [logout, navigate, refreshStudyStatus]);

  if (loading) {
    return (
      <TMFrame title="mathlab" subtitle="~/dashboard">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 32px)' }}>
          <span style={{ fontSize: 12, color: TM.dim }}>$ cargando…</span>
        </div>
      </TMFrame>
    );
  }

  if (error) {
    return (
      <TMFrame title="mathlab" subtitle="~/dashboard">
        <div style={{ padding: 26, fontSize: 13, color: TM.red }}>
          <span style={{ color: TM.dim }}>err →</span> {error}
        </div>
      </TMFrame>
    );
  }

  const chatbotEnabled = Boolean(featureFlags?.chatbot);
  const adaptativeEnabled = Boolean(featureFlags?.adaptativo);
  const modeLabel = featureFlags ? (adaptativeEnabled ? 'tutor ia activo' : 'práctica estándar') : 'configuración pendiente';
  const modulesRemaining = Math.max((studyStatus?.requiredModules ?? 0) - (studyStatus?.modulesCompleted ?? 0), 0);
  const checkpointsRemaining = Math.max(
    (studyStatus?.requiredCheckpoints ?? 0) - (studyStatus?.checkpointsPassed ?? 0),
    0,
  );
  const posttestUnlocked = Boolean(studyStatus?.posttestUnlocked);

  const getLatestByType = (type: string) => {
    const filtered = assessments.filter((a) => (a as { assessment_type: string }).assessment_type === type);
    if (!filtered.length) return null;
    return filtered.reduce((latest, current) => {
      const latestDate = new Date((latest as { created_at: string }).created_at);
      const currentDate = new Date((current as { created_at: string }).created_at);
      return currentDate > latestDate ? current : latest;
    }, filtered[0]);
  };

  const latestPre = getLatestByType('pretest');
  const latestPost = getLatestByType('posttest');
  const deltaScore = latestPre && latestPost
    ? ((latestPost as { total_score: number }).total_score ?? 0) - ((latestPre as { total_score: number }).total_score ?? 0)
    : null;

  const handleNav = (id: string) => {
    if (id === 'dash') navigate('/dashboard');
    else if (id === 'theory') navigate('/theory');
    else if (id === 'practice') navigate('/exercises');
    else if (id === 'chatbot') navigate('/chatbot');
    else if (id === 'profile') navigate('/profile');
  };

  return (
    <TMFrame title="mathlab" subtitle="~/dashboard">
      <TMNav active="dash" onNav={handleNav} />
      <main style={{ padding: 26, height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
        <TMPrompt>./dashboard --status</TMPrompt>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '14px 0 4px', color: TM.fg }}>
          <span style={{ color: TM.amber }}>&gt;</span> panel de aprendizaje
        </h1>
        <div style={{ fontSize: 11, color: TM.dim, marginBottom: 24 }}>
          // modo: {modeLabel}
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          <TMBox title="MÓDULOS" accent={TM.amber}>
            <div style={{ fontSize: 28, fontWeight: 700, color: TM.amber }}>
              {studyStatus?.modulesCompleted ?? 0}
              <span style={{ fontSize: 14, color: TM.dim }}> / {studyStatus?.requiredModules ?? 0}</span>
            </div>
            {modulesRemaining > 0 && (
              <div style={{ fontSize: 11, color: TM.dim, marginTop: 4 }}>// faltan {modulesRemaining}</div>
            )}
          </TMBox>
          <TMBox title="CHECKPOINTS" accent={TM.cyan}>
            <div style={{ fontSize: 28, fontWeight: 700, color: TM.cyan }}>
              {studyStatus?.checkpointsPassed ?? 0}
              <span style={{ fontSize: 14, color: TM.dim }}> / {studyStatus?.requiredCheckpoints ?? 0}</span>
            </div>
            {checkpointsRemaining > 0 && (
              <div style={{ fontSize: 11, color: TM.dim, marginTop: 4 }}>// faltan {checkpointsRemaining}</div>
            )}
          </TMBox>
          <TMBox title="MIN. EN TEORÍA" accent={TM.amber}>
            <div style={{ fontSize: 28, fontWeight: 700, color: TM.amber }}>
              {studyStatus?.minutesInTheory ?? 0}
              <span style={{ fontSize: 14, color: TM.dim }}> min</span>
            </div>
          </TMBox>
        </div>

        {/* Resultados */}
        {latestPre && (
          <TMBox title="RESULTADOS" accent={TM.cyan} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 32 }}>
              <div>
                <div style={{ fontSize: 10, color: TM.dim, letterSpacing: 1.5 }}>PRETEST</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: TM.fg }}>
                  {(latestPre as { total_score: number }).total_score ?? '─'}
                </div>
              </div>
              {latestPost && (
                <div>
                  <div style={{ fontSize: 10, color: TM.dim, letterSpacing: 1.5 }}>POSTEST</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: TM.fg }}>
                    {(latestPost as { total_score: number }).total_score ?? '─'}
                  </div>
                </div>
              )}
              {deltaScore !== null && (
                <div>
                  <div style={{ fontSize: 10, color: TM.dim, letterSpacing: 1.5 }}>DELTA</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: deltaScore >= 0 ? TM.green : TM.red }}>
                    {deltaScore >= 0 ? '+' : ''}{deltaScore}
                  </div>
                </div>
              )}
            </div>
          </TMBox>
        )}

        {/* Links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <TMBox
            title="TEORÍA"
            accent={TM.amber}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ fontSize: 13, color: TM.fg, marginBottom: 6 }} onClick={() => navigate('/theory')}>
              ./theory --modules
            </div>
            <div style={{ fontSize: 11, color: TM.dim }}>// estudiá los conceptos clave</div>
          </TMBox>

          <TMBox
            title="PRÁCTICA"
            accent={TM.cyan}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ fontSize: 13, color: TM.fg, marginBottom: 6 }} onClick={() => navigate('/exercises')}>
              ./practice --adaptive
            </div>
            <div style={{ fontSize: 11, color: TM.dim }}>// ejercicios adaptados a tu nivel</div>
          </TMBox>

          {chatbotEnabled && (
            <TMBox
              title="TUTOR IA"
              accent={TM.amber}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ fontSize: 13, color: TM.fg, marginBottom: 6 }} onClick={() => navigate('/chatbot')}>
                ./tutor --chat
              </div>
              <div style={{ fontSize: 11, color: TM.dim }}>// preguntá dudas y recibí ayuda paso a paso</div>
            </TMBox>
          )}

          <TMBox
            title="ENCUESTA"
            accent={TM.cyan}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ fontSize: 13, color: TM.fg, marginBottom: 6 }} onClick={() => navigate('/survey')}>
              ./survey --run
            </div>
            <div style={{ fontSize: 11, color: TM.dim }}>// compartí tu experiencia</div>
          </TMBox>

          {posttestUnlocked && (
            <TMBox
              title="POSTEST DISPONIBLE"
              accent={TM.green}
              style={{ cursor: 'pointer', gridColumn: '1 / -1' }}
            >
              <div style={{ fontSize: 13, color: TM.green, marginBottom: 6 }} onClick={() => navigate('/study/exit-test')}>
                <span style={{ color: TM.green }}>[x]</span> ./posttest --start
              </div>
              <div style={{ fontSize: 11, color: TM.dim }}>// completaste los requisitos — evaluá tu progreso</div>
            </TMBox>
          )}
        </div>

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

export default Dashboard;
