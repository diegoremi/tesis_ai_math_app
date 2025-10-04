import React from 'react';

const LoadingSpinner = ({ label = 'Cargando…', fullscreen = false, subdued = false }) => {
  const containerClasses = fullscreen
    ? 'flex min-h-screen w-full items-center justify-center bg-[#0b1210] text-white'
    : 'flex flex-col items-center justify-center gap-3 text-center';

  const textClasses = subdued ? 'text-sm text-[#9eb7a8]' : 'text-sm text-white';

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#1f2b26]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-[var(--primary-color)]" />
      </div>
      {label ? <p className={textClasses}>{label}</p> : null}
    </div>
  );
};

export default LoadingSpinner;
