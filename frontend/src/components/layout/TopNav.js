import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import AppBrand from './AppBrand';

const navLinks = [
  { label: 'Inicio', path: '/dashboard' },
  { label: 'Práctica', path: '/exercises' },
  { label: 'Encuestas', path: '/survey' },
  { label: 'Perfil', path: '/profile' },
];

const TopNav = ({ showAdminShortcut = false }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linksToRender = showAdminShortcut || user?.role === 'admin'
    ? [...navLinks, { label: 'Administración', path: '/admin' }]
    : navLinks;

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#29382f] px-6 md:px-10 py-3 bg-[#111714] text-white">
      <AppBrand />

      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-200">
        {linksToRender.map((link) => (
          <Link key={link.path} className="hover:text-white transition-colors" to={link.path}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="hidden md:flex items-center gap-4">
        <button
          onClick={handleLogout}
          className="rounded-full h-10 px-4 bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition"
        >
          Cerrar sesión
        </button>
      </div>

      <button
        className="md:hidden flex h-10 w-10 items-center justify-center rounded-full bg-[#29382f] text-white"
        aria-label="Abrir menú" onClick={() => setMenuOpen((prev) => !prev)}
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 mx-4 rounded-2xl bg-[#1a221d] border border-[#29382f] shadow-lg p-4 md:hidden">
          <nav className="flex flex-col gap-3 mb-4">
            {linksToRender.map((link) => (
              <Link
                key={link.path}
                className="text-sm font-medium text-gray-200 hover:text-white"
                to={link.path}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => {
              setMenuOpen(false);
              handleLogout();
            }}
            className="w-full rounded-full bg-white/10 text-white py-2 text-sm font-semibold hover:bg-white/20 transition"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  );
};

export default TopNav;
