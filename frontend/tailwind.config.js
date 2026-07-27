/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
        },
        // Named `line` (not `border`) — Tailwind's `border` utility conflicts with a color named `border`.
        line: {
          DEFAULT: 'var(--border)',
          subtle: 'var(--border-subtle)',
        },
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
          faint: 'var(--text-faint)',
        },
        muted: 'var(--text-muted)',
        faint: 'var(--text-faint)',
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          muted: 'var(--primary-muted)',
        },
        'on-primary': 'var(--on-primary)',
        success: {
          DEFAULT: 'var(--success)',
          muted: 'var(--success-muted)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          muted: 'var(--danger-muted)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          muted: 'var(--warning-muted)',
        },
        // Back-compat aliases
        ok: 'var(--success)',
        fail: 'var(--danger)',
        accent: 'var(--primary)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        tooltip: 'var(--shadow-tooltip)',
      },
      maxWidth: {
        content: '72rem', // ~max-w-6xl
      },
      transitionDuration: {
        DEFAULT: '180ms',
      },
      keyframes: {
        flash: {
          '0%': { backgroundColor: 'var(--primary-muted)' },
          '100%': { backgroundColor: 'transparent' },
        },
        pulse: {
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        flash: 'flash 1.6s ease-out',
        'pulse-slow': 'pulse 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
