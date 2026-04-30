import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { generateTheoryModule, recordTheoryProgress, submitTheoryCheckpoint } from '../services/api.ts';

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
      setError('No pudimos generar el módulo.');
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
      setError('Error al validar el checkpoint.');
    }
  };

  void handleCheckpoint;

  return (
    <div className="min-h-screen bg-[#0b1210] text-white">
      <nav className="flex items-center justify-between border-b border-[#29382f] px-6 md:px-10 py-3">
        <span className="text-lg font-bold">Teoría</span>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-sm hover:text-emerald-400">Dashboard</button>
          <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">Salir</button>
        </div>
      </nav>
      <main className="px-6 md:px-10 py-10 max-w-3xl mx-auto">
        {error && <p className="text-red-400 mb-4">{error}</p>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {Array.from({ length: 6 }).map((_, i) => {
            const isCompleted = i < (studyStatus?.modulesCompleted ?? 0);
            return (
              <button
                key={i}
                onClick={() => generateModule(i)}
                disabled={loading}
                className={`rounded-xl p-4 text-center transition ${
                  isCompleted
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : 'bg-[#101a17] border border-[#29382f] hover:border-emerald-500'
                }`}
              >
                <p className="text-sm font-medium">Módulo {i + 1}</p>
                {isCompleted && <p className="text-xs text-emerald-400 mt-1">Completado</p>}
              </button>
            );
          })}
        </div>

        {activeModule && (
          <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4">{String((activeModule as { title?: string }).title ?? 'Módulo')}</h2>
            <p className="text-[#9eb7a8] mb-6">{String((activeModule as { description?: string }).description ?? '')}</p>
            <button
              onClick={() => handleProgress((activeModule as { module_id: number }).module_id, 1)}
              className="rounded-full px-6 py-2 bg-emerald-500 text-black font-bold hover:opacity-90 transition"
            >
              Marcar como completado
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Theory;
