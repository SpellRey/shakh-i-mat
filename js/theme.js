// Перемикач світлої / темної теми в шапці
const themeButton = document.getElementById('theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');

const lichess = document.querySelector('iframe[data-lichess]');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const isLight = theme === 'light';
  themeButton.setAttribute('aria-pressed', String(isLight));
  themeButton.setAttribute('aria-label', isLight ? 'Увімкнути темну тему' : 'Увімкнути світлу тему');
  themeButton.title = isLight ? 'Темна тема' : 'Світла тема';
  if (themeMeta) themeMeta.setAttribute('content', isLight ? '#f4f5fb' : '#0b0b1a');
  // віджет Lichess підтримує світлий і темний фон — підлаштовуємо під тему сайту
  if (lichess) {
    const src = lichess.getAttribute('src').replace(/bg=(dark|light)/, `bg=${isLight ? 'light' : 'dark'}`);
    if (src !== lichess.getAttribute('src')) lichess.setAttribute('src', src);
  }
}

themeButton.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  // на мить вмикаємо плавні переходи кольорів (див. .theme-switching у CSS)
  document.documentElement.classList.add('theme-switching');
  applyTheme(next);
  setTimeout(() => document.documentElement.classList.remove('theme-switching'), 400);
  try {
    localStorage.setItem('shm-theme', next); // запам'ятовуємо вибір для всіх сторінок
  } catch (error) {
    /* сховище недоступне — тема діятиме до перезавантаження */
  }
});

applyTheme(document.documentElement.getAttribute('data-theme') || 'dark');
