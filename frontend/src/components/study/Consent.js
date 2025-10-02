import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitConsent } from '../../services/api';

const Consent = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const handleConsent = async (accepted) => {
    setSubmitting(true);
    setStatus(null);
    try {
      await submitConsent({ documentVersion: 'v1', accepted });
      setStatus({ type: 'success', accepted, message: accepted ? 'Consent recorded. Thank you for participating.' : 'You have declined participation.' });
    } catch (error) {
      console.error('Error recording consent:', error);
      setStatus({ type: 'error', accepted: false, message: 'Unable to record your consent. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1210] text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <header className="flex items-center justify-between border-b border-[#1f2c26] pb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#123427] text-[#38ef7d] font-bold">AI</div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#6aa58e]">Tesis UNLP</p>
              <h1 className="text-2xl font-semibold tracking-tight">Programa de Aprendizaje Autónomo en Matemática</h1>
            </div>
          </div>
          <span className="text-sm text-[#6aa58e]">Fase piloto 2025</span>
        </header>

        <main className="mt-10 space-y-10">
          <section className="bg-[#101a17] rounded-3xl border border-[#1f2c26] p-8 shadow-lg">
            <p className="text-sm font-semibold text-[#38ef7d] uppercase tracking-wide">Consentimiento informado</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">Participación en estudio cuasi-experimental GE vs GC</h2>
            <p className="mt-6 text-base leading-relaxed text-[#cbe0d7]">
              Este estudio evalúa el impacto de un tutor inteligente en la motivación y aprendizaje autónomo de adultos jóvenes. El grupo experimental accederá a herramientas adaptativas y chatbot; el grupo control utilizará recursos equivalentes sin IA.
            </p>
            <div className="mt-6 grid gap-4 text-sm text-[#b6cec4]">
              <p>• Tu participación es voluntaria y puedes retirarte en cualquier momento sin consecuencias.</p>
              <p>• Registraremos tus respuestas en las evaluaciones diagnósticas, métricas de uso y encuestas de percepción.</p>
              <p>• Los datos se anonimizan mediante un código de participante y se almacenan conforme a la normativa de ética e investigación.</p>
              <p>• Resultados agregados se utilizarán en la tesis y publicaciones asociadas.</p>
            </div>
          </section>

          <section className="bg-[#101a17] rounded-3xl border border-[#1f2c26] p-8 shadow-lg">
            <h3 className="text-xl font-semibold tracking-tight">¿Aceptás participar?</h3>
            <p className="mt-3 text-sm text-[#b6cec4]">
              Seleccioná una opción. Podés descargar el documento completo para tu registro personal.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => handleConsent(true)}
                disabled={submitting}
                className="flex-1 rounded-full bg-[#38ef7d] text-[#0b1210] font-semibold py-3 px-6 hover:bg-[#2dd970] transition disabled:opacity-70"
              >
                Acepto participar
              </button>
              <button
                type="button"
                onClick={() => handleConsent(false)}
                disabled={submitting}
                className="flex-1 rounded-full border border-[#2a3a33] text-[#cbe0d7] font-semibold py-3 px-6 hover:bg-[#14201c] transition disabled:opacity-70"
              >
                Prefiero no participar
              </button>
            </div>
            <a
              href="/docs/consentimiento.pdf"
              className="mt-4 inline-flex items-center gap-2 text-sm text-[#6aa58e] hover:text-[#38ef7d]"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Descargar consentimiento completo
            </a>
            {status && (
              <div
                className={`mt-6 rounded-2xl border px-5 py-4 text-sm ${
                  status.type === 'success'
                    ? 'border-[#38ef7d]/40 bg-[#183224] text-[#d6f5e5]'
                    : 'border-red-500/40 bg-[#331919] text-red-200'
                }`}
              >
                {status.message}
                {status.type === 'success' && status.accepted && (
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#38ef7d] px-5 py-2 text-sm font-semibold text-[#0b1210] hover:bg-[#2dd970] transition"
                    onClick={() => navigate('/study/pretest')}
                  >
                    Continue to pretest
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default Consent;
