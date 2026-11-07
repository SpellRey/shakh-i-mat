// Застосовує тему ДО рендерингу сторінки (скрипт підключено в <head> без defer).
// Пріоритет: вибір користувача з localStorage → системне налаштування → темна тема.
(function () {
  var saved = null;
  try {
    saved = localStorage.getItem('shm-theme');
  } catch (error) {
    saved = null; // приватний режим або заблоковане сховище
  }
  var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  document.documentElement.setAttribute('data-theme', saved || (prefersLight ? 'light' : 'dark'));
})();
