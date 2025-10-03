import React, { useState } from 'react';
import { updatePassword } from '../../services/api';

const PasswordChange = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las nuevas contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    try {
      await updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setSuccess('Actualizamos tu contraseña.');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      setError('No pudimos actualizarla. Revisa los datos e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-[#203028] bg-[#101a17] p-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.35em] text-[#6aa58e]">Seguridad</p>
        <h3 className="text-lg font-semibold text-white">Actualizar contraseña</h3>
        <p className="text-sm text-[#94b1a3]">Recomendamos una combinación única de letras, números y símbolos.</p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#cbe0d7]" htmlFor="currentPassword">
            Contraseña actual
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={handleChange}
            required
            className="w-full rounded-full border border-[#203028] bg-[#0d1612] px-4 py-3 text-white placeholder:text-[#6aa58e] focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#cbe0d7]" htmlFor="newPassword">
            Nueva contraseña
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleChange}
            required
            className="w-full rounded-full border border-[#203028] bg-[#0d1612] px-4 py-3 text-white placeholder:text-[#6aa58e] focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#cbe0d7]" htmlFor="confirmPassword">
            Confirmar nueva contraseña
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full rounded-full border border-[#203028] bg-[#0d1612] px-4 py-3 text-white placeholder:text-[#6aa58e] focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary-color)] px-6 text-sm font-semibold text-[#0b1210] transition-colors hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Actualizando…' : 'Actualizar contraseña'}
        </button>
      </form>
    </section>
  );
};

export default PasswordChange;
