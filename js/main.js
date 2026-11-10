// =====================================================================
// Ініціалізація JS-бібліотек головної сторінки (ЛР 10): Swiper.js, Fancybox, Typed.js.
// Typed.js підключено в index.html перед </body>; Swiper і Fancybox (≈ 300 КБ разом) з ЛР 12
// довантажуються «ліниво» — коли секція відгуків чи галереї наближається до екрана. Це зменшує обсяг
// JavaScript, який браузер розбирає під час першого завантаження (метрика TBT у Lighthouse).
// Уся ініціалізація — всередині DOMContentLoaded: код запускається, коли HTML уже розібрано.
// =====================================================================
const CDN_LIBS = {
  swiper: {
    src: 'https://cdn.jsdelivr.net/npm/swiper@11.1.14/swiper-bundle.min.js',
    integrity: 'sha384-JiF4eFN9V3I2Fry7TzFM3XKdq0P3abiVxpOeHjGz4cwvas+uNg6pFWVmuD6MKXqG',
  },
  fancybox: {
    src: 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0.36/dist/fancybox/fancybox.umd.js',
    integrity: 'sha384-BodKYo5iRmFaqEaP1o8AAu9hCHqLvNhSWEg12QF1IjPnl1SgsrwQMSMKUB4POJ18',
  },
};

// Підключає скрипт бібліотеки з тим самим SRI-хешем, що й раніше в HTML; повторний виклик не дублює тег
function loadLibrary({ src, integrity }) {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) return existing.loaded;
  const script = document.createElement('script');
  script.src = src;
  script.integrity = integrity;
  script.crossOrigin = 'anonymous';
  script.loaded = new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Не вдалося завантажити ${src}`));
  });
  document.body.appendChild(script);
  return script.loaded;
}

// Викликає callback один раз, коли елемент за 600 px від екрана (або одразу, якщо IntersectionObserver немає)
function whenNearViewport(el, callback) {
  if (!el) return;
  if (!('IntersectionObserver' in window)) {
    callback();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      callback();
    }
  }, { rootMargin: '600px 0px' });
  observer.observe(el);
}

document.addEventListener('DOMContentLoaded', () => {
  // Користувачі з налаштуванням «менше руху» не отримують автопрокрутки й друкування тексту
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  whenNearViewport(document.querySelector('.reviews-swiper'), () => {
    loadLibrary(CDN_LIBS.swiper)
      .then(() => initReviewsSlider(reduceMotion))
      .catch((error) => console.warn('[Swiper]', error.message, '— відгуки показано без каруселі.'));
  });
  whenNearViewport(document.getElementById('gallery'), () => {
    loadLibrary(CDN_LIBS.fancybox)
      .then(initGallery)
      .catch((error) => console.warn('[Fancybox]', error.message, '— фото відкриваються як звичайні посилання.'));
  });
  initTypedHero(reduceMotion);
});

// ---------- Swiper.js: карусель відгуків ----------
function initReviewsSlider(reduceMotion) {
  const el = document.querySelector('.reviews-swiper');
  // якщо CDN недоступний, бібліотеки немає — блок лишається звичайним списком відгуків, без помилок у консолі
  if (!el || typeof Swiper === 'undefined') return;

  // Об'єкт конфігурації: усі налаштування плагіна передаються другим аргументом
  new Swiper(el, {
    loop: true,                 // після останнього слайда — знову перший (нескінченна карусель)
    speed: 600,                 // тривалість анімації переходу, мс
    spaceBetween: 24,           // відступ між слайдами, px
    slidesPerView: 1,           // mobile-first: на телефоні — 1 відгук
    grabCursor: true,           // курсор-«рука»: видно, що слайди можна тягнути
    autoplay: reduceMotion ? false : {
      delay: 3500,              // затримка між автоматичними перемиканнями, мс
      pauseOnMouseEnter: true,  // пауза, поки курсор над каруселлю
      disableOnInteraction: false, // після ручного гортання автопрокрутка продовжується
    },
    pagination: {
      el: '.reviews-pagination',
      clickable: true,          // крапки клікабельні
    },
    navigation: {
      prevEl: '.reviews-prev',
      nextEl: '.reviews-next',
    },
    keyboard: { enabled: true, onlyInViewport: true }, // стрілки клавіатури, коли карусель на екрані
    a11y: {
      prevSlideMessage: 'Попередній відгук',
      nextSlideMessage: 'Наступний відгук',
      paginationBulletMessage: 'Перейти до відгуку {{index}}',
      slideLabelMessage: 'Відгук {{index}} з {{slidesLength}}',
    },
    breakpoints: {             // адаптивність: ключ — мінімальна ширина вікна в px
      768: { slidesPerView: 2 },  // планшет — 2 відгуки
      1024: { slidesPerView: 3 }, // комп'ютер — 3 відгуки
    },
  });
}

// ---------- Fancybox 5: галерея колекції ----------
function initGallery() {
  if (typeof Fancybox === 'undefined') return; // без бібліотеки посилання просто відкриють фото

  // bind знаходить усі елементи за селектором; однакове значення data-fancybox об'єднує їх в один альбом
  Fancybox.bind('[data-fancybox="games-gallery"]', {
    Hash: false,                       // не змінювати адресу сторінки (#games-gallery-1) при відкритті фото
    Carousel: {
      transition: 'fade',              // плавна зміна фото замість зсуву
      infinite: true,                  // після останнього фото — перше
    },
    Images: {
      Panzoom: { maxScale: 3 },        // зум до 3× (колесо миші, подвійний клік, два пальці)
    },
    Thumbs: { type: 'classic' },       // мініатюри внизу
  });
}

// ---------- Typed.js: друкування слогана в Hero ----------
function initTypedHero(reduceMotion) {
  // у режимі «менше руху» лишається статичний запасний текст з HTML
  if (reduceMotion || typeof Typed === 'undefined' || !document.getElementById('typed-text')) return;

  // ЛР 12: власний курсор Typed.js вимкнено (showCursor: false) — його замінює CSS-рамка #typed-text.is-typing,
  // яка не створює зсувів макета (CLS) під час переносу фрази на новий рядок
  document.getElementById('typed-text').classList.add('is-typing');
  new Typed('#typed-text', {
    strings: [
      'знаходь компанію на вечір',
      'знаходь суперника за хвилину',
      'орендуй настілку в сусіда',
      'збирай власний турнір',
    ],
    typeSpeed: 50,     // мс на символ під час друкування
    backSpeed: 30,     // мс на символ під час стирання
    backDelay: 1800,   // пауза перед стиранням готової фрази
    startDelay: 400,
    smartBackspace: true, // стирає лише відмінну частину («знаходь …» не передруковується)
    loop: true,
    showCursor: false,
  });
}
