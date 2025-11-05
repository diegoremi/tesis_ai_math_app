import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { registerUser } from "../../services/api";
import AppBrand from "../layout/AppBrand";

const Register = () => {
  const navigate = useNavigate();
  const recaptchaRef = useRef();
  const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    age: "",
    education_level: "high_school",
    math_goals: "",
    agree_terms: false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    

    const recaptchaToken = recaptchaRef.current?.getValue?.();
    if (recaptchaSiteKey && !recaptchaToken) {
      setError("Completa el reCAPTCHA antes de continuar.");
      setLoading(false);
      return;
    }

    try {
      // Split full_name into first_name and last_name for backend
      const nameParts = formData.full_name.split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      const registrationPayload = {
        ...formData,
        first_name,
        last_name,
        goal: formData.math_goals, // Map math_goals to goal for backend
      };

      if (recaptchaSiteKey && recaptchaToken) {
        registrationPayload.recaptchaToken = recaptchaToken;
      }

      await registerUser(registrationPayload);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setShowSuccessModal(true);
    } catch (err) {
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setError("No pudimos crear tu cuenta. Revisa los datos e inténtalo nuevamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-[#111714] dark group/design-root overflow-x-hidden">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#29382f] px-10 py-3">
        <AppBrand />
        <div className="flex items-center gap-2">
          <button
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-6 bg-white/10 text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-white/20 transition-colors"
            onClick={() => navigate('/')}
            type="button"
          >
            <span className="truncate">Iniciar sesión</span>
          </button>
        </div>
      </header>
      <main className="flex flex-1 justify-center py-5">
        <div className="layout-content-container flex flex-col w-[512px] max-w-[512px] py-10 px-8">
          
          <h1 className="text-white tracking-tighter text-4xl font-bold leading-tight text-center pb-8">Crea tu cuenta</h1>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2">
              <p className="text-white text-base font-medium leading-normal">Nombre completo</p>
              <input className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-[#29382f] text-white" placeholder="Ej. Ana Pérez" name="full_name" value={formData.full_name} onChange={handleChange} required />
            </label>
            <label className="flex flex-col gap-2">
              <p className="text-white text-base font-medium leading-normal">Correo electrónico</p>
              <input className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-[#29382f] text-white" placeholder="ejemplo@correo.com" type="email" name="email" value={formData.email} onChange={handleChange} required />
            </label>
            <label className="flex flex-col gap-2">
              <p className="text-white text-base font-medium leading-normal">Contraseña</p>
              <input className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-[#29382f] text-white" placeholder="Crea una contraseña segura" type="password" name="password" value={formData.password} onChange={handleChange} required />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <p className="text-white text-base font-medium leading-normal">Edad</p>
                <input className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-[#29382f] text-white" placeholder="Ingresa tu edad" type="number" name="age" value={formData.age} onChange={handleChange} required />
              </label>
              <label className="flex flex-col gap-2">
                <p className="text-white text-base font-medium leading-normal">Nivel educativo</p>
                <select className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-[#29382f] text-white appearance-none bg-[image:--select-button-svg] bg-no-repeat bg-[center_right_1rem]" name="education_level" value={formData.education_level} onChange={handleChange}>
                  <option value="high_school">Secundario</option>
                  <option value="university">Universitario</option>
                  <option value="other">Otro</option>
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-2">
              <p className="text-white text-base font-medium leading-normal">Objetivos con matemática</p>
              <textarea className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-[#29382f] text-white min-h-28" placeholder="Ej. Aprobar análisis, fortalecer álgebra" name="math_goals" value={formData.math_goals} onChange={handleChange}></textarea>
            </label>
            {recaptchaSiteKey ? (
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={recaptchaSiteKey}
              />
            ) : (
              <p className="text-red-400 text-sm">
                Falta configurar la clave de sitio de reCAPTCHA en el entorno.
              </p>
            )}
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 mt-4 bg-[var(--primary-color)] text-[#111714] text-base font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity" type="submit" disabled={loading}>
              <span className="truncate">{loading ? "Creando cuenta..." : "Crear cuenta"}</span>
            </button>
            {error && <p style={{ color: "red", textAlign: "center", marginTop: "10px" }}>{error}</p>}
            <p className="text-[#9eb7a8] text-xs font-normal leading-normal pt-2 px-4 text-center">
              Sitio protegido por reCAPTCHA. Aplican la <a className="underline hover:text-white" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Política de Privacidad</a> y los <a className="underline hover:text-white" href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Términos de servicio</a> de Google.
            </p>
          </form>
        </div>
      </main>
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-md rounded-3xl border border-[#2a3a33] bg-[#0f1713] p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary-color)]/15 text-[var(--primary-color)]">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-white">Cuenta creada</h2>
            <p className="mt-3 text-sm text-[#9eb7a8]">
              Guardamos tus datos de acceso. Inicia sesión para continuar con el estudio.
            </p>
            <button
              type="button"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary-color)] px-8 text-sm font-semibold text-[#0b1210] transition hover:bg-opacity-90"
              onClick={() => navigate('/')}
            >
              Ir al inicio de sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
