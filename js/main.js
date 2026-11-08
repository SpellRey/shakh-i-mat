// =====================================================================
// Ініціалізація JS-бібліотек головної сторінки (ЛР 10): Swiper.js, Fancybox, Typed.js.
// Бібліотеки підключені через CDN перед </body> (index.html), цей файл — одразу після них.
// Уся ініціалізація — всередині DOMContentLoaded: код запускається, коли HTML уже розібрано
// і потрібні елементи (.reviews-swiper, [data-fancybox], #typed-text) точно існують.
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Користувачі з налаштуванням «менше руху» не отримують автопрокрутки й друкування тексту
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initReviewsSlider(reduceMotion);
  initGallery();
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
  });
}
