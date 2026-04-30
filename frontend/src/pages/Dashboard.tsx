import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { getActivities, getAssessments } from '../services/api.ts';

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
        setError('No pudimos cargar tu información. Inicia sesión nuevamente.');
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
      <div className="flex items-center justify-center min-h-screen bg-[#0b1210]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-400 mt-10">{error}</div>;
  }

  const chatbotEnabled = Boolean(featureFlags?.chatbot);
  const adaptativeEnabled = Boolean(featureFlags?.adaptativo);
  const modeLabel = featureFlags ? (adaptativeEnabled ? 'Tutor IA activo' : 'Práctica estándar') : 'Configuración pendiente';
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

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0b1210] text-white">
      <nav className="flex items-center justify-between border-b border-[#29382f] px-6 md:px-10 py-3">
        <span className="text-lg font-bold">AI Math App</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6aa58e]">{modeLabel}</span>
          <Link to="/profile" className="text-sm text-white hover:text-emerald-400">Perfil</Link>
          <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">Salir</button>
        </div>
      </nav>
      <main className="flex-1 px-6 md:px-10 py-10">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">Panel de aprendizaje</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6">
              <p className="text-sm text-[#6aa58e] uppercase tracking-wider">Módulos</p>
              <p className="text-2xl font-bold mt-1">{studyStatus?.modulesCompleted ?? 0} / {studyStatus?.requiredModules ?? 0}</p>
              {modulesRemaining > 0 && <p className="text-xs text-[#9eb7a8] mt-1">Faltan {modulesRemaining}</p>}
            </div>
            <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6">
              <p className="text-sm text-[#6aa58e] uppercase tracking-wider">Checkpoints</p>
              <p className="text-2xl font-bold mt-1">{studyStatus?.checkpointsPassed ?? 0} / {studyStatus?.requiredCheckpoints ?? 0}</p>
              {checkpointsRemaining > 0 && <p className="text-xs text-[#9eb7a8] mt-1">Faltan {checkpointsRemaining}</p>}
            </div>
            <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6">
              <p className="text-sm text-[#6aa58e] uppercase tracking-wider">Minutos en teoría</p>
              <p className="text-2xl font-bold mt-1">{studyStatus?.minutesInTheory ?? 0}</p>
            </div>
          </div>

          {latestPre && (
            <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Resultados</h2>
              <div className="flex gap-6">
                <div>
                  <p className="text-sm text-[#9eb7a8]">Pretest</p>
                  <p className="text-xl font-bold">{(latestPre as { total_score: number }).total_score ?? '-'}</p>
                </div>
                {latestPost && (
                  <div>
                    <p className="text-sm text-[#9eb7a8]">Postest</p>
                    <p className="text-xl font-bold">{(latestPost as { total_score: number }).total_score ?? '-'}</p>
                  </div>
                )}
                {deltaScore !== null && (
                  <div>
                    <p className="text-sm text-[#9eb7a8]">Diferencia</p>
                    <p className={`text-xl font-bold ${deltaScore >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {deltaScore >= 0 ? '+' : ''}{deltaScore}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/theory" className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6 hover:border-emerald-500 transition">
              <h3 className="text-lg font-semibold">Módulos de teoría</h3>
              <p className="text-sm text-[#9eb7a8] mt-1">Estudia los conceptos clave antes de practicar.</p>
            </Link>
            <Link to="/exercises" className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6 hover:border-emerald-500 transition">
              <h3 className="text-lg font-semibold">Ejercicios</h3>
              <p className="text-sm text-[#9eb7a8] mt-1">Practica con problemas adaptados a tu nivel.</p>
            </Link>
            {chatbotEnabled && (
              <Link to="/chatbot" className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6 hover:border-emerald-500 transition">
                <h3 className="text-lg font-semibold">Tutor IA</h3>
                <p className="text-sm text-[#9eb7a8] mt-1">Pregunta dudas y recibe explicaciones paso a paso.</p>
              </Link>
            )}
            <Link to="/survey" className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6 hover:border-emerald-500 transition">
              <h3 className="text-lg font-semibold">Encuestas</h3>
              <p className="text-sm text-[#9eb7a8] mt-1">Comparte tu experiencia y motivación.</p>
            </Link>
            {posttestUnlocked && (
              <Link to="/study/exit-test" className="bg-emerald-500/10 border border-emerald-500 rounded-2xl p-6 hover:bg-emerald-500/20 transition">
                <h3 className="text-lg font-semibold text-emerald-400">Realizar postest</h3>
                <p className="text-sm text-emerald-300 mt-1">Has completado los requisitos. Evalúa tu progreso.</p>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
