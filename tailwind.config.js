// Конфігурація Tailwind CSS 3 для збирання статичного файлу css/tailwind.css (ЛР 12).
// Раніше Tailwind працював через CDN-скрипт, який генерував стилі в браузері під час кожного
// завантаження сторінки (повільно й з попередженням у консолі). Тепер CSS збирається заздалегідь:
//   npm run build:css    — локально (потрібен Node.js)
//   GitHub Actions       — автоматично перед кожним деплоєм (.github/workflows/deploy.yml)
// content — файли, у яких Tailwind шукає класи; у CSS потрапляють лише використані класи.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './js/**/*.js'],
  theme: {
    extend: {
      // Кольори беруться з CSS-змінних (css/custom-styles.css), тому один клас,
      // напр. bg-night або text-ink, автоматично змінюється для світлої та темної теми.
      // <alpha-value> дозволяє писати прозорість: bg-night/80, text-muted/70.
      colors: {
        night: {
          DEFAULT: 'rgb(var(--c-night) / <alpha-value>)',
          deep: 'rgb(var(--c-night-deep) / <alpha-value>)',
          soft: 'rgb(var(--c-night-soft) / <alpha-value>)',
        },
        surface: 'var(--c-surface)',
        line: 'var(--c-line)',
        primary: { DEFAULT: '#ff2e63', strong: '#d6124a' },
        secondary: 'rgb(var(--c-secondary) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        warning: 'rgb(var(--c-warning) / <alpha-value>)',
        // стани полів форми (ЛР 9): помилка — червоний, успіх — зелений, відтінок залежить від теми
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
        success: 'rgb(var(--c-success) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      maxWidth: { container: '1360px' },
      boxShadow: {
        glow: '0 0 20px rgb(255 46 99 / 0.8), inset 0 -5px 15px #ff2e63',
        'glow-lg': '0 0 32px rgb(255 46 99 / 0.95), inset 0 -5px 15px #ff2e63',
        card: 'var(--shadow-card)',
        'neon-cyan': '0 0 28px rgb(var(--c-secondary) / 0.28), inset 0 0 14px rgb(var(--c-secondary) / 0.08)',
        'neon-cyan-sm': '0 0 16px rgb(var(--c-secondary) / 0.75)',
        'neon-pink': '0 0 28px rgb(255 46 99 / 0.32), inset 0 0 14px rgb(255 46 99 / 0.08)',
        'neon-gold': '0 0 28px rgb(var(--c-warning) / 0.3), inset 0 0 14px rgb(var(--c-warning) / 0.08)',
      },
    },
  },
};
