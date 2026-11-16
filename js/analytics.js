// =====================================================================
// Вебаналітика Vercel Web Analytics (самостійна робота).
// Рахує перегляди сторінок без cookie і без збору персональних даних; статистика — у кабінеті Vercel → Analytics.
// Скрипт /_vercel/insights/script.js віддає сам хостинг Vercel, тому підключаємо його лише на домені *.vercel.app:
// на Netlify, GitHub Pages і в Live Server такого файлу немає — запит дав би помилку 404 у консолі.
// =====================================================================
(function () {
  if (!window.location.hostname.endsWith('.vercel.app')) return;

  // черга подій: виклики window.va(...) до завантаження скрипта не губляться
  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };

  const script = document.createElement('script');
  script.src = '/_vercel/insights/script.js';
  script.defer = true;
  document.head.appendChild(script);
})();
