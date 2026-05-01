/* Terminal Tutor · drop-in tailwind config extension */
/* @ts-check */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tm: {
          bg: '#1a1714',
          'bg-deep': '#100e0c',
          panel: '#211d19',
          'panel-2': '#2a2520',
          fg: '#e8dfd2',
          dim: '#7d7066',
          rule: '#3a322b',
          amber: '#ffb454',
          'amber-soft': '#cf8a3a',
          cyan: '#7dd3fc',
          green: '#9bd454',
          red: '#ef6f6c',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      borderRadius: {
        none: '0',
      },
      letterSpacing: {
        kbd: '0.15em',
      },
    },
  },
  plugins: [],
};
