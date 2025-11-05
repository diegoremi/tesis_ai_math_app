import React, { Fragment, useEffect, useState } from "react";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { getExercise, submitAnswer, getHint } from "../services/api";
import { useAuth } from "context/AuthContext";
import TopNav from "./layout/TopNav";
import LoadingSpinner from "./common/LoadingSpinner";

const Exercises = () => {
  const { featureFlags } = useAuth();
  const chatbotEnabled = Boolean(featureFlags?.chatbot);
  const adaptativeEnabled = Boolean(featureFlags?.adaptativo);

  const [exercise, setExercise] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [freeResponse, setFreeResponse] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hint, setHint] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const MATH_REGEX = /(\$\$[^$]+\$\$|\$[^$]+\$|\\\[[^\]]+\\\]|\\\([^\)]+\\\))/g;

  const splitMathSegments = (text) => {
    return String(text ?? "")
      .split(MATH_REGEX)
      .filter(Boolean)
      .map((segment) => {
        const trimmed = segment.trim();
        if (trimmed.startsWith("$$") && trimmed.endsWith("$$")) {
          return { type: "block", math: trimmed.slice(2, -2).trim() };
        }
        if (trimmed.startsWith("\\[") && trimmed.endsWith("\\]")) {
          return { type: "block", math: trimmed.slice(2, -2).trim() };
        }
        if (trimmed.startsWith("$") && trimmed.endsWith("$")) {
          return { type: "inline", math: trimmed.slice(1, -1).trim() };
        }
        if (trimmed.startsWith("\\(") && trimmed.endsWith("\\)")) {
          return { type: "inline", math: trimmed.slice(2, -2).trim() };
        }
        return { type: "text", text: segment };
      });
  };

  const renderRichText = (value, keyPrefix) => {
    const segments = splitMathSegments(value);
    const nodes = [];
    let inlineBuffer = [];

    const flushBuffer = () => {
      if (!inlineBuffer.length) return;
      nodes.push(
        <p key={`${keyPrefix}-p-${nodes.length}`} className="text-base leading-relaxed">
          {inlineBuffer.map((segment, index) =>
            segment.type === "inline" ? (
              <InlineMath key={`${keyPrefix}-inline-${index}`} math={segment.math} />
            ) : (
              <Fragment key={`${keyPrefix}-text-${index}`}>{segment.text}</Fragment>
            ),
          )}
        </p>,
      );
      inlineBuffer = [];
    };

    segments.forEach((segment, index) => {
      if (segment.type === "block") {
        flushBuffer();
        nodes.push(
          <div key={`${keyPrefix}-block-${index}`} className="my-2">
            <BlockMath math={segment.math} />
          </div>,
        );
      } else {
        inlineBuffer.push(segment);
      }
    });

    flushBuffer();

    if (!nodes.length) {
      return [
        <p key={`${keyPrefix}-p-0`} className="text-base leading-relaxed">
          {value}
        </p>,
      ];
    }
    return nodes;
  };

  const renderInlineText = (value, keyPrefix) => {
    return splitMathSegments(value).map((segment, index) => {
      if (segment.type === "block") {
        return (
          <span key={`${keyPrefix}-block-${index}`} className="block my-2">
            <BlockMath math={segment.math} />
          </span>
        );
      }
      if (segment.type === "inline") {
        return <InlineMath key={`${keyPrefix}-inline-${index}`} math={segment.math} />;
      }
      return <Fragment key={`${keyPrefix}-text-${index}`}>{segment.text}</Fragment>;
    });
  };

  useEffect(() => {
    fetchExercise();
  }, []);

  const fetchExercise = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    if (!silent) {
      setResult(null);
      setHint(null);
    }
    setError(null);
    try {
      const response = await getExercise();
      setExercise(response.data);
      setSelectedOption(null);
      setFreeResponse("");
      setHint(null);
      if (silent) {
        setResult(null);
      }
    } catch (err) {
      setError("No pudimos cargar un ejercicio nuevo. Intenta nuevamente más tarde.");
      console.error(err);
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleHint = async () => {
    if (!chatbotEnabled || !exercise) return;
    try {
      const response = await getHint(exercise.id);
      setHint(response.data.hint);
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 403) {
        setHint('Las pistas con IA no están habilitadas para tu cohorte.');
      } else {
        setHint('No pudimos obtener una pista en este momento.');
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!exercise) return;
    const payload = selectedOption ?? freeResponse.trim();
    if (!payload) {
      setError("Selecciona o escribe una respuesta antes de enviar.");
      return;
    }
    try {
      const response = await submitAnswer({
        exerciseId: exercise.id,
        userAnswer: payload,
      });
      const isCorrect = Boolean(response.data?.correct);
      setResult(isCorrect ? "¡Correcto!" : "Revisa tus pasos e inténtalo de nuevo.");
      if (isCorrect) {
        setTimeout(() => {
          fetchExercise({ silent: true });
        }, 1800);
      }
    } catch (err) {
      setError("Ocurrió un error al enviar tu respuesta.");
      console.error(err);
    }
  };

  const hasOptions = Array.isArray(exercise?.options) && exercise.options.length > 0;

  if (loading) {
    return <LoadingSpinner label="Cargando práctica…" fullscreen />;
  }

  if (error) {
    return <div className="min-h-screen bg-[#0b1210] text-red-400 text-center pt-20">{error}</div>;
  }

  if (!exercise) {
    return <div className="min-h-screen bg-[#0b1210] text-white text-center pt-20">Sin ejercicios disponibles.</div>;
  }

  return (
    <div
      className="relative flex min-h-screen flex-col bg-[#0b1210] text-white"
      style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}
    >
      <TopNav />
      <main className="flex-1 px-6 md:px-10 py-10">
        <div className="mx-auto max-w-3xl space-y-8">
          {featureFlags && !adaptativeEnabled && (
            <div className="rounded-2xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Estamos desplegando la práctica adaptativa de forma gradual. Mientras tanto, continúa con la secuencia base para consolidar tus habilidades.
            </div>
          )}

          <div className="relative space-y-4 rounded-2xl bg-[#1c2620] p-6 shadow-lg">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-[#9eb7a8]">Ejercicio</p>
              <div className="space-y-2 text-2xl font-bold">
                {renderRichText(exercise.stem, "stem")}
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {hasOptions ? (
                <div className="grid gap-3">
                  {exercise.options.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setSelectedOption(option.key)}
                      className={`text-left rounded-xl border px-4 py-3 transition ${
                        selectedOption === option.key
                          ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/10 text-white'
                          : 'border-[#3d5245] bg-[#111714] text-[#d2e4da] hover:border-[var(--primary-color)]/60'
                      }`}
                    >
                      <span className="text-base leading-relaxed">
                        {renderInlineText(option.label ?? option.text ?? '', `option-${option.key}`)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  className="w-full rounded-full border border-[#3d5245] bg-[#111714] px-4 py-3 text-white placeholder:text-[#9eb7a8] focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                  placeholder="Escribe tu respuesta"
                  value={freeResponse}
                  onChange={(event) => setFreeResponse(event.target.value)}
                />
              )}
              <button
                className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-full bg-[var(--primary-color)] px-6 py-3 text-sm font-bold text-[#111714] transition-colors hover:bg-opacity-80"
                type="submit"
                disabled={refreshing}
              >
                Enviar respuesta
              </button>
            </form>
            {result && (
              <div className="rounded-xl border border-[#3d5245] bg-[#111714] px-4 py-3 text-sm text-white">
                {result}
              </div>
            )}
            {chatbotEnabled && (
              <button
                className="inline-flex items-center gap-2 rounded-full bg-[#29382f] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#3d5245]"
                onClick={handleHint}
                type="button"
              >
                Pedir pista
                <span className="material-symbols-outlined text-base">lightbulb</span>
              </button>
            )}
            {hint && (
              <div className="mt-4 p-4 bg-[#29382f] rounded-lg text-sm text-white">
                {hint}
              </div>
            )}
            {refreshing && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#0b1210]/70">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1f2b26]">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-transparent border-t-[var(--primary-color)]" />
                  </div>
                  <span className="text-sm text-[#9eb7a8]">Cargando nuevo ejercicio…</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Exercises;
