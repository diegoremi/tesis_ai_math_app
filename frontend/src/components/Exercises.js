import React, { useEffect, useState } from "react";
import { getExercise, submitAnswer, getHint, logEvent } from "../services/api";
import { useAuth } from "context/AuthContext";

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
  const [problemsSolved, setProblemsSolved] = useState(0);
  const totalProblems = 10;

  useEffect(() => {
    fetchExercise();
    return () => {
      logEvent({ event_type: "session_end", metadata: { source: "practice" } }).catch(() => {});
    };
  }, []);

  const fetchExercise = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedOption(null);
    setFreeResponse("");
    setHint(null);
    try {
      const response = await getExercise();
      setExercise(response.data);
    } catch (err) {
      setError("Failed to fetch exercise");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHint = async () => {
    if (!chatbotEnabled || !exercise) return;
    try {
      const response = await getHint(exercise.id);
      setHint(response.data.hint);
    } catch (err) {
      setError("Failed to get hint");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!exercise) {
      return;
    }
    const payload = selectedOption ?? freeResponse.trim();
    if (!payload) {
      setError("Select or enter an answer before submitting.");
      return;
    }
    try {
      const response = await submitAnswer({
        exerciseId: exercise.id,
        userAnswer: payload,
      });
      const isCorrect = Boolean(response.data?.correct);
      setResult(isCorrect ? "¡Correcto!" : "Incorrecto. ¡Inténtalo de nuevo!");
      if (isCorrect) {
        setProblemsSolved((prev) => prev + 1);
      }
      setSelectedOption(null);
      setFreeResponse("");
      setTimeout(() => {
        fetchExercise();
      }, 600);
    } catch (err) {
      setError("Error al enviar respuesta");
      console.error(err);
    }
  };

  if (loading) {
    return <div>Loading exercise...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!exercise) {
    return <div>No practice items available. Please contact the facilitator.</div>;
  }

  const hasOptions = Array.isArray(exercise.options) && exercise.options.length > 0;

  return (
    <div
      className="relative flex size-full min-h-screen flex-col dark group/design-root overflow-x-hidden"
      style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#29382f] px-10 py-3">
          <div className="flex items-center gap-4 text-white">
            <div className="size-8">
              <svg
                fill="none"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clipRule="evenodd"
                  d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            <h1 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">
              Math AI
            </h1>
          </div>
          <div className="flex flex-1 justify-end gap-4">
            <button
              className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#29382f] text-white transition-colors hover:bg-[#3d5245]"
              aria-label="Abrir menú de navegación"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <button>
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDzwqLre8NBwpSwWzEzNrd--HoNFug8acGIiKIVyMtJFI501kmDXZ0cI9yrTO64-GpKU0qxyEvvqfWiIj0wJ8VSYdAVNxk1-wfMeOZZcBeEmnllWifNdZZeY3IAYWR06RL2uGULQm7t55cBYtcF0v82Qq0yveuhrBrOGqnOhmQ6WChCnNlHAiuC209fA3hwoHEb4fKw7XY-oGrvbtRBFxckR9uIkCXJST9X6OcfJoV4UkfLf2Lbk5fthTq7-XWYsJObBLC1PTJ6U")',
                }}
              ></div>
            </button>
          </div>
        </header>
        <main className="flex flex-1 justify-center py-10 px-4">
          <div className="layout-content-container flex w-full max-w-2xl flex-col gap-8">
            {!adaptativeEnabled && (
              <div className="rounded-2xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Adaptive recommendations are disabled for your cohort. Complete the study to unlock full tutor access.
              </div>
            )}
            <div className="space-y-4 rounded-2xl bg-[#1c2620] p-6 shadow-lg">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Solve the following problem</h2>
                <p className="text-lg text-gray-300">{exercise.stem}</p>
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
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    className="w-full rounded-full border border-[#3d5245] bg-[#111714] px-4 py-3 text-white placeholder:text-[#9eb7a8] focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                    placeholder="Enter your answer"
                    value={freeResponse}
                    onChange={(event) => setFreeResponse(event.target.value)}
                  />
                )}
                <button
                  className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-full bg-[var(--primary-color)] px-6 py-3 text-sm font-bold text-[#111714] transition-colors hover:bg-opacity-80"
                  type="submit"
                >
                  <span className="truncate">Submit</span>
                </button>
              </form>
              {result && (
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <p className="text-sm font-medium text-yellow-400" role="alert">
                    Retroalimentación: {result}
                  </p>
                  {chatbotEnabled && (
                    <button
                      className="flex cursor-pointer items-center justify-center rounded-full bg-[#29382f] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#3d5245]"
                      onClick={handleHint}
                      aria-label="Obtener pista"
                    >
                      <span className="truncate">Obtener Pista</span>
                    </button>
                  )}
                </div>
              )}
              {hint && (
                <div className="mt-4 p-4 bg-[#29382f] rounded-lg">
                  <p className="text-sm text-white">{hint}</p>
                </div>
              )}
            </div>
            <div className="space-y-4 rounded-2xl bg-[#1c2620] p-6 shadow-lg">
              <h3 className="text-lg font-bold text-white">Progreso de Hoy</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-base font-medium text-white">Problemas Resueltos</p>
                  <p className="text-sm font-normal text-gray-300">
                    {problemsSolved}/{totalProblems}
                  </p>
                </div>
                <div className="h-2 w-full rounded-full bg-[#3d5245]">
                  <div
                    className="h-2 rounded-full bg-[var(--primary-color)]"
                    style={{ width: `${(problemsSolved / totalProblems) * 100}%` }}
                    role="progressbar"
                    aria-valuenow={problemsSolved}
                    aria-valuemin="0"
                    aria-valuemax={totalProblems}
                  ></div>
                </div>
                <p className="text-right text-sm font-medium text-white">
                  {Math.round((problemsSolved / totalProblems) * 100)}%
                </p>
              </div>
            </div>
          </div>
        </main>
        {chatbotEnabled && (
          <div className="fixed bottom-8 right-8">
            <button
              aria-label="Open AI Chat"
              className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-[var(--primary-color)] text-[#111714] shadow-lg transition-transform hover:scale-105"
            >
              <span className="material-symbols-outlined text-3xl"> chat </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Exercises;
