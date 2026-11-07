// Мобільне меню («бургер»): відкриття та закриття на екранах < 1024px
const toggle = document.getElementById('menu-toggle');
const menu = document.getElementById('site-menu');
const icon = toggle.querySelector('i');
const desktop = window.matchMedia('(min-width: 1024px)');

function setMenuOpen(isOpen) {
  menu.classList.toggle('hidden', !isOpen);
  toggle.setAttribute('aria-expanded', String(isOpen));
  toggle.setAttribute('aria-label', isOpen ? 'Закрити меню' : 'Відкрити меню');
  icon.classList.toggle('fa-bars', !isOpen);
  icon.classList.toggle('fa-xmark', isOpen);
}

// клік по кнопці — перемикаємо стан
toggle.addEventListener('click', () => {
  setMenuOpen(menu.classList.contains('hidden'));
});

// після переходу за пунктом меню закриваємо його (лише на мобільному)
menu.addEventListener('click', (event) => {
  if (event.target.closest('a') && !desktop.matches) {
    setMenuOpen(false);
  }
});

// Escape закриває меню й повертає фокус на кнопку
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    setMenuOpen(false);
    toggle.focus();
  }
});

// при переході на десктопну ширину скидаємо стан
desktop.addEventListener('change', () => setMenuOpen(false));
