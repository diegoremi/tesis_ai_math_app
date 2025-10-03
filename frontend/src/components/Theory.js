import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import TopNav from './layout/TopNav';
import {
  generateTheoryModule,
  recordTheoryProgress,
  submitTheoryCheckpoint,
} from '../services/api';
import { useAuth } from 'context/AuthContext';

const clamp = (value) => {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

const Theory = () => {
  const { refreshStudyStatus } = useAuth();
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [modules, setModules] = useState({});
  const [requirements, setRequirements] = useState({ requiredModules: 3, requiredCheckpoints: 3 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkpointState, setCheckpointState] = useState({ answers: {}, submitting: false, result: null, error: null });
  const [localProgress, setLocalProgress] = useState(0);
  const [syncingProgress, setSyncingProgress] = useState(false);

  const contentRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const lastSyncRef = useRef(Date.now());
  const lastSendRef = useRef(0);
  const serverProgressRef = useRef(0);

  const activeModule = modules[currentModuleIndex] ?? null;
  const moduleContent = activeModule?.module?.content ?? {};
  const progressRecord = activeModule?.progress ?? null;

  const totalModules = useMemo(() => {
    if (requirements.requiredModules) {
      return requirements.requiredModules;
    }
    return Math.max(Object.keys(modules).length, 1);
  }, [requirements.requiredModules, modules]);

  const loadModule = useCallback(
    async (moduleIndex) => {
      setLoading(true);
      setError(null);
      setCheckpointState({ answers: {}, submitting: false, result: null, error: null });
      setSyncingProgress(false);
      try {
        const response = await generateTheoryModule(moduleIndex);
        const data = response.data;
        setModules((prev) => ({
          ...prev,
          [moduleIndex]: data,
        }));
        if (data.requirements) {
          setRequirements(data.requirements);
        }
        const initialProgress = data.progress?.progress ?? 0;
        serverProgressRef.current = initialProgress;
        setLocalProgress(initialProgress);
        startTimeRef.current = Date.now();
        lastSyncRef.current = Date.now();
      } catch (err) {
        console.error('Error generating theory module:', err);
        setError('No pudimos cargar el módulo teórico. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadModule(currentModuleIndex);
  }, [currentModuleIndex, loadModule]);

  useEffect(() => {
    if (!activeModule) {
      return;
    }
    const initialProgress = activeModule.progress?.progress ?? 0;
    serverProgressRef.current = initialProgress;
    setLocalProgress(initialProgress);
    startTimeRef.current = Date.now();
    lastSyncRef.current = Date.now();
  }, [activeModule]);

  const currentModuleId = activeModule?.module?.module_id;

  useEffect(() => {
    if (!currentModuleId) {
      return undefined;
    }
    const handleScroll = () => {
      if (!contentRef.current) return;
      const element = contentRef.current;
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const visibleBottom = viewportHeight - Math.max(rect.top, 0);
      const progressRatio = clamp(visibleBottom / rect.height);
      setLocalProgress((prev) => {
        const next = clamp(progressRatio);
        return next > prev ? next : prev;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentModuleId]);

  useEffect(() => {
    const shouldSync = () => {
      if (!activeModule?.module?.module_id) return false;
      if (localProgress <= serverProgressRef.current) return false;
      if (localProgress - serverProgressRef.current < 0.05 && localProgress < 1) return false;
      const now = Date.now();
      if (now - lastSendRef.current < 2000) return false;
      return true;
    };

    if (!shouldSync()) {
      return;
    }

    const syncProgress = async () => {
      if (!activeModule?.module?.module_id) return;
      setSyncingProgress(true);
      try {
        const elapsedSeconds = (Date.now() - lastSyncRef.current) / 1000;
        const response = await recordTheoryProgress({
          moduleId: activeModule.module.module_id,
          progress: localProgress,
          elapsedSeconds,
        });
        const payload = response.data ?? {};
        serverProgressRef.current = payload.progress ?? localProgress;
        setModules((prev) => ({
          ...prev,
          [currentModuleIndex]: {
            ...prev[currentModuleIndex],
            progress: payload,
          },
        }));
        if ((payload.progress ?? localProgress) >= 1 && !(progressRecord?.completed_at)) {
          await refreshStudyStatus();
        }
      } catch (err) {
        console.error('Error syncing theory progress:', err);
      } finally {
        const now = Date.now();
        lastSyncRef.current = now;
        lastSendRef.current = now;
        setSyncingProgress(false);
      }
    };

    syncProgress();
  }, [activeModule, currentModuleIndex, localProgress, refreshStudyStatus, progressRecord]);

  const handleAnswer = (questionId, value) => {
    setCheckpointState((prev) => ({
      ...prev,
      error: null,
      answers: {
        ...prev.answers,
        [String(questionId)]: value,
      },
    }));
  };

  const checkpointRequired = Boolean(moduleContent?.checkpoint?.questions?.length);
  const checkpointPassed = checkpointRequired
    ? Boolean(checkpointState.result?.passed || progressRecord?.checkpoint_passed)
    : true;

  const canAdvance = localProgress >= 0.99 && checkpointPassed;

  const handleSubmitCheckpoint = async (event) => {
    event.preventDefault();
    if (!activeModule?.module?.module_id) return;
    setCheckpointState((prev) => ({ ...prev, submitting: true, error: null }));
    if (checkpointRequired) {
      const unanswered = (checkpoint.questions ?? []).filter((question, index) => {
        const key = String(question.id ?? index);
        return !checkpointState.answers[key];
      });
      if (unanswered.length > 0) {
        setCheckpointState((prev) => ({ ...prev, submitting: false, error: 'Responde todas las preguntas antes de enviar.' }));
        return;
      }
    }
    try {
      const answers = Object.entries(checkpointState.answers).map(([id, answer]) => ({ id, answer }));
      const response = await submitTheoryCheckpoint({
        moduleId: activeModule.module.module_id,
        answers,
      });
      const payload = response.data ?? {};
      const checkpointPassedFlag = payload.progress?.checkpoint_passed ?? payload.passed ?? false;
      setCheckpointState((prev) => ({
        ...prev,
        submitting: false,
        result: payload,
        error: null,
      }));
      setModules((prev) => ({
        ...prev,
        [currentModuleIndex]: {
          ...prev[currentModuleIndex],
          progress: {
            ...(prev[currentModuleIndex]?.progress ?? {}),
            ...(payload.progress ?? {}),
            checkpoint_passed: checkpointPassedFlag,
          },
        },
      }));
      await refreshStudyStatus();
    } catch (err) {
      console.error('Error submitting checkpoint:', err);
      setCheckpointState((prev) => ({ ...prev, submitting: false, result: { passed: false }, error: 'No pudimos validar tus respuestas. Intenta nuevamente.' }));
    }
  };

  const goToModule = (index) => {
    if (index === currentModuleIndex) return;
    if (index > currentModuleIndex && !canAdvance) {
      return;
    }
    setCurrentModuleIndex(index);
  };

  const handleNextModule = () => {
    if (!canAdvance) return;
    const nextIndex = currentModuleIndex + 1;
    if (nextIndex >= totalModules) {
      return;
    }
    setCurrentModuleIndex(nextIndex);
  };

  const renderBodyBlock = (block, key) => {
    if (typeof block === 'string') {
      return (
        <p key={key} className="text-sm text-[#cbe0d7] leading-relaxed">
          {block}
        </p>
      );
    }
    if (!block || typeof block !== 'object') {
      return null;
    }
    if (block.math) {
      const expression = String(block.math);
      const isInline = expression.length < 25;
      return (
        <div key={key} className="my-2">
          {isInline ? <InlineMath math={expression} /> : <BlockMath math={expression} />}
        </div>
      );
    }
    if (block.callout) {
      return (
        <div key={key} className="rounded-xl border border-[#395045] bg-[#203028] px-4 py-3 text-sm text-[#d1f0e0]">
          {block.callout}
        </div>
      );
    }
    if (block.visualization) {
      const viz = block.visualization;
      if (viz.type === 'plotly' && Array.isArray(viz.data)) {
        return (
          <div key={key} className="bg-white rounded-xl p-4">
            <Plot
              data={viz.data}
              layout={{ autosize: true, ...(viz.layout ?? {}) }}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler
              config={{ displayModeBar: false }}
            />
          </div>
        );
      }
      return (
        <div key={key} className="rounded-xl border border-[#395045] bg-[#203028] px-4 py-3 text-sm text-[#d1f0e0]">
          Visualización no disponible.
        </div>
      );
    }
    return null;
  };

  const sections = Array.isArray(moduleContent.sections) ? moduleContent.sections : [];
  const checkpoint = moduleContent?.checkpoint;

  return (
    <div
      className="relative flex min-h-screen flex-col bg-[#0b1210] text-white"
      style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}
    >
      <TopNav />
      <main className="flex-1 px-6 md:px-10 py-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 md:flex-row">
          <aside className="w-full md:w-64 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9eb7a8]">Módulos</h2>
            <div className="space-y-2">
              {Array.from({ length: totalModules }).map((_, index) => {
                const moduleData = modules[index];
                const isActive = index === currentModuleIndex;
                const isUnlocked = index <= currentModuleIndex || (modules[index]?.progress?.checkpoint_passed ?? false);
                return (
                  <button
                    key={index}
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => goToModule(index)}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                      isActive
                        ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/10 text-white'
                        : isUnlocked
                        ? 'border-[#29382f] bg-[#1c2620] text-[#cbe0d7] hover:border-[var(--primary-color)]/60'
                        : 'border-[#1f2b26] bg-[#111714] text-[#4d6357] cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{moduleData?.module?.title ?? `Módulo ${index + 1}`}</span>
                      {moduleData?.progress?.checkpoint_passed && (
                        <span className="material-symbols-outlined text-base text-[var(--primary-color)]">check_circle</span>
                      )}
                    </div>
                    {moduleData?.module?.description && (
                      <p className="mt-1 text-xs text-[#94b1a3] line-clamp-2">{moduleData.module.description}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>
          <section className="flex-1 space-y-6">
            {loading ? (
              <div className="flex min-h-[40vh] items-center justify-center text-[#9eb7a8]">
                Cargando módulo…
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : activeModule ? (
              <div className="space-y-6">
                <header className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#9eb7a8]">Módulo {currentModuleIndex + 1}</p>
                  <h1 className="text-3xl font-bold tracking-tight">{activeModule.module?.title}</h1>
                  {activeModule.module?.description && (
                    <p className="text-sm text-[#cbe0d7]">{activeModule.module.description}</p>
                  )}
                </header>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-[#1f2b26] overflow-hidden">
                    <div
                      className="h-full bg-[var(--primary-color)]"
                      style={{ width: `${Math.min(localProgress * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-[#9eb7a8]">{Math.round(localProgress * 100)}% leído</span>
                  {syncingProgress && <span className="text-xs text-[#9eb7a8]">Guardando…</span>}
                </div>

                <article ref={contentRef} className="space-y-8">
                  {sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="rounded-2xl border border-[#29382f] bg-[#1c2620] p-6 space-y-4">
                      {section.heading && (
                        <h2 className="text-xl font-semibold text-white">{section.heading}</h2>
                      )}
                      {Array.isArray(section.body) && section.body.map((block, blockIndex) => renderBodyBlock(block, `${sectionIndex}-${blockIndex}`))}
                    </div>
                  ))}
                </article>

                {checkpoint?.questions?.length ? (
                  <form onSubmit={handleSubmitCheckpoint} className="space-y-4">
                    <div className="rounded-2xl border border-[#29382f] bg-[#1c2620] p-6 space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">Ejercicios de verificación</h3>
                        <p className="text-sm text-[#9eb7a8]">
                          Resolvé los ejercicios para desbloquear el siguiente módulo.
                        </p>
                      </div>
                      {checkpoint.questions.map((question, index) => (
                        <div key={question.id ?? index} className="space-y-3 rounded-xl border border-[#1f2b26] bg-[#14201c] p-4">
                          <p className="text-sm font-medium text-white">{question.stem}</p>
                          <div className="grid gap-2">
                            {(question.options ?? []).map((option) => (
                              <label
                                key={option.key}
                                className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ${
                                  checkpointState.answers[String(question.id ?? index)] === option.key
                                    ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/10 text-white'
                                    : 'border-[#29382f] bg-[#111714] text-[#cbe0d7] hover:border-[var(--primary-color)]/40'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`checkpoint-${question.id ?? index}`}
                                  value={option.key}
                                  checked={checkpointState.answers[String(question.id ?? index)] === option.key}
                                  onChange={() => handleAnswer(question.id ?? index, option.key)}
                                  className="hidden"
                                />
                                <span className="font-semibold text-[#9eb7a8]">{option.key}</span>
                                <span>{option.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button
                        type="submit"
                        disabled={checkpointState.submitting}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary-color)] px-6 py-3 text-sm font-semibold text-[#111714] hover:opacity-90 transition disabled:opacity-60"
                      >
                        {checkpointState.submitting ? 'Enviando…' : 'Enviar respuestas'}
                      </button>
                      {checkpointState.error && (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-200">
                          {checkpointState.error}
                        </div>
                      )}
                      {checkpointState.result && (
                        <div
                          className={`rounded-xl border px-4 py-3 text-sm ${
                            checkpointState.result.passed
                              ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                              : 'border-red-500/40 bg-red-500/10 text-red-200'
                          }`}
                        >
                          {checkpointState.result.passed
                            ? '¡Excelente! Podés avanzar al siguiente módulo.'
                            : 'Revisa tus respuestas y vuelve a intentarlo.'}
                        </div>
                      )}
                    </div>
                  </form>
                ) : null}

                <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-[#29382f] bg-[#1c2620] p-6 md:flex-row">
                  <div className="text-sm text-[#9eb7a8]">
                    {checkpointPassed
                      ? 'Módulo completado. Podés continuar al siguiente.'
                      : checkpointRequired
                        ? 'Completá la lectura y los ejercicios para desbloquear el siguiente módulo.'
                        : 'Completá la lectura para desbloquear el siguiente módulo.'}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleNextModule}
                      disabled={!canAdvance}
                      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition ${
                        canAdvance
                          ? 'bg-[var(--primary-color)] text-[#111714] hover:opacity-90'
                          : 'bg-[#29382f] text-[#6d7d74] cursor-not-allowed'
                      }`}
                    >
                      Siguiente módulo
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#29382f] bg-[#1c2620] p-6 text-sm text-[#9eb7a8]">
                Selecciona un módulo para comenzar.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Theory;
