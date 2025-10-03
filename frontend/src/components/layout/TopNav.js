import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';

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
      <div className="flex items-center gap-3 text-white">
        <div className="size-8 text-[var(--primary-color, #38ef7d)]">
          <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path
              clipRule="evenodd"
              d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </svg>
        </div>
        <h1 className="text-lg font-bold leading-tight tracking-tight">Matemática AI</h1>
      </div>

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
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-white/20"
          style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDzwqLre8NBwpSwWzEzNrd--HoNFug8acGIiKIVyMtJFI501kmDXZ0cI9yrTO64-GpKU0qxyEvvqfWiIj0wJ8VSYdAVNxk1-wfMeOZZcBeEmnllWifNdZZeY3IAYWR06RL2uGULQm7t55cBYtcF0v82Qq0yveuhrBrOGqnOhmQ6WChCnNlHAiuC209fA3hwoHEb4fKw7XY-oGrvbtRBFxckR9uIkCXJST9X6OcfJoV4UkfLf2Lbk5fthTq7-XWYsJObBLC1PTJ6U")' }}
        ></div>
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
