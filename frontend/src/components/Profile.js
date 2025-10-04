import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile } from '../services/api';
import PasswordChange from './auth/PasswordChange';
import LoadingSpinner from './common/LoadingSpinner';

const fieldLabel = {
  first_name: 'Nombre',
  last_name: 'Apellido',
  email: 'Correo',
  age: 'Edad',
  education_level: 'Nivel educativo',
  goal: 'Objetivo',
  role: 'Rol',
};

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [passwordNotice, setPasswordNotice] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        setUser(response.data);
        setFormData(response.data);
      } catch (err) {
        console.error(err);
        setError('No pudimos cargar tu perfil.');
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          localStorage.removeItem('token');
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    try {
      const response = await updateProfile(formData);
      setUser(response.data);
      setProfileNotice('Guardamos tu información.');
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      setProfileError('No pudimos actualizar tus datos.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Cargando perfil…" fullscreen subdued />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b1210] text-white flex items-center justify-center">
        <p className="text-sm text-red-300">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0b1210] text-white flex items-center justify-center">
        <p className="text-sm text-[#9eb7a8]">No encontramos información del perfil.</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#0b1210] text-white"
      style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}
    >
      <header className="flex items-center justify-between border-b border-[#1f2c26] bg-[#0f1713] px-6 md:px-10 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#6aa58e]">Perfil</p>
          <h1 className="text-xl font-semibold">Configuración de cuenta</h1>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-[#203028] px-5 text-sm font-semibold text-[#cbe0d7] transition hover:border-[var(--primary-color)] hover:text-white"
        >
          Volver al panel
        </button>
      </header>

      <main className="px-6 md:px-10 py-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          {(profileNotice || passwordNotice) && (
            <div className="rounded-3xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {profileNotice || passwordNotice}
            </div>
          )}

          <section className="rounded-3xl border border-[#203028] bg-[#101a17] p-6 md:p-8 shadow-lg">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[#6aa58e]">Información general</p>
                <h2 className="text-2xl font-bold">
                  {user.first_name ? `Hola, ${user.first_name}` : 'Tu perfil'}
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setFormData(user);
                    setProfileError(null);
                    setProfileNotice(null);
                    setShowEditModal(true);
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--primary-color)] px-6 text-sm font-semibold text-[#0b1210] transition hover:bg-opacity-90"
                >
                  Editar datos
                </button>
                <button
                  onClick={() => {
                    setPasswordNotice(null);
                    setShowPasswordModal(true);
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[#203028] px-6 text-sm font-semibold text-[#cbe0d7] transition hover:border-[var(--primary-color)] hover:text-white"
                >
                  Cambiar contraseña
                </button>
              </div>
            </header>

            <dl className="mt-6 grid gap-4 md:grid-cols-2">
              {Object.entries(fieldLabel).map(([key, label]) => (
                <div key={key} className="rounded-2xl border border-[#1f2c26] bg-[#0d1612] px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.25em] text-[#6aa58e]">{label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-white">
                    {user[key] ?? '—'}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </main>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-3xl rounded-3xl border border-[#203028] bg-[#101a17] p-6 md:p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[#6aa58e]">Editar</p>
                <h2 className="text-xl font-semibold text-white">Actualizar información personal</h2>
              </div>
              <button
                type="button"
                className="h-8 w-8 rounded-full border border-[#203028] text-[#cbe0d7] hover:border-[var(--primary-color)] hover:text-white"
                onClick={() => {
                  setShowEditModal(false);
                  setProfileError(null);
                }}
                aria-label="Cerrar edición"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[#cbe0d7]">Nombre</span>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name || ''}
                  onChange={handleChange}
                  className="w-full rounded-full border border-[#203028] bg-[#0d1612] px-4 py-3 text-white placeholder:text-[#6aa58e] focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)]"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-[#cbe0d7]">Apellido</span>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name || ''}
                  onChange={handleChange}
                  className="w-full rounded-full border border-[#203028] bg-[#0d1612] px-4 py-3 text-white placeholder:text-[#6aa58e] focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)]"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-[#cbe0d7]">Edad</span>
                <input
                  type="number"
                  name="age"
                  value={formData.age ?? ''}
                  onChange={handleChange}
                  className="w-full rounded-full border border-[#203028] bg-[#0d1612] px-4 py-3 text-white placeholder:text-[#6aa58e] focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)]"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-[#cbe0d7]">Nivel educativo</span>
                <input
                  type="text"
                  name="education_level"
                  value={formData.education_level || ''}
                  onChange={handleChange}
                  className="w-full rounded-full border border-[#203028] bg-[#0d1612] px-4 py-3 text-white placeholder:text-[#6aa58e] focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)]"
                />
              </label>
              <label className="md:col-span-2 space-y-2">
                <span className="text-sm font-medium text-[#cbe0d7]">Objetivo</span>
                <input
                  type="text"
                  name="goal"
                  value={formData.goal || ''}
                  onChange={handleChange}
                  className="w-full rounded-full border border-[#203028] bg-[#0d1612] px-4 py-3 text-white placeholder:text-[#6aa58e] focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)]"
                />
              </label>
              <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary-color)] px-6 text-sm font-semibold text-[#0b1210] transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingProfile ? 'Guardando…' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setProfileError(null);
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[#203028] px-6 text-sm font-semibold text-[#cbe0d7] transition hover:border-[var(--primary-color)] hover:text-white"
                >
                  Cancelar
                </button>
              </div>
              {profileError && (
                <div className="md:col-span-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {profileError}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-xl rounded-3xl border border-[#203028] bg-[#101a17] p-6 md:p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[#6aa58e]">Seguridad</p>
                <h2 className="text-xl font-semibold text-white">Actualizar contraseña</h2>
              </div>
              <button
                type="button"
                className="h-8 w-8 rounded-full border border-[#203028] text-[#cbe0d7] hover:border-[var(--primary-color)] hover:text-white"
                onClick={() => setShowPasswordModal(false)}
                aria-label="Cerrar actualización de contraseña"
              >
                ×
              </button>
            </div>
            <PasswordChange
              onSuccess={() => {
                setPasswordNotice('Actualizamos tu contraseña.');
                setShowPasswordModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
