// =====================================================================
// Клієнтська валідація форми зворотного зв'язку (contact.html), ЛР 9.
// Без сторонніх бібліотек. Перевірка запускається на трьох подіях:
//   input  — оновлює стан поля, коли користувач уже з ним взаємодіяв;
//   blur   — фінальна перевірка поля при виході з нього;
//   submit — перевірка всіх полів; форма «надсилається» лише якщо всі валідні.
// Помилки не показуються одразу після відкриття сторінки — лише після взаємодії з полем.
// Увага: клієнтська перевірка — це зручність (UX), а не захист: справжній сервер
// мав би перевіряти дані ще раз, бо JavaScript у браузері можна вимкнути або обійти.
// =====================================================================
(() => {
  'use strict';

  const form = document.getElementById('contact-form');
  if (!form) return;

  // ---------- Регулярні вирази ----------
  // Ім'я: починається й закінчується літерою будь-якої абетки (\p{L} + прапорець u — кирилиця, латиниця);
  // усередині дозволені літери, пробіл, апостроф (' або ’) і дефіс: «Ірина», «Анна-Марія», «Дар’я».
  const NAME_RE = /^\p{L}(?:[\p{L}'’ -]*\p{L})?$/u;
  // Email: локальна частина (літери, цифри, . _ % + -) @ домен (літери, цифри, . -) . зона з 2+ латинських літер.
  // ^ і $ — початок і кінець рядка: без них збігом вважався б і «abc user@gmail.com xyz».
  const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  // Телефон: «+380» (плюс екрановано, бо + у RegEx — квантифікатор) і рівно 9 цифр; без пробілів, дужок, дефісів.
  const PHONE_RE = /^\+380\d{9}$/;

  const MESSAGE_MIN = 10;
  const MESSAGE_MAX = 1000;

  // ---------- Елементи форми ----------
  const fields = {
    name: document.getElementById('cf-name'),
    email: document.getElementById('cf-email'),
    phone: document.getElementById('cf-phone'),
    message: document.getElementById('cf-message'),
    agree: document.getElementById('cf-agree'),
  };
  const labels = { name: 'Ім’я', email: 'Email', phone: 'Телефон', message: 'Повідомлення', agree: 'Згода на обробку даних' };
  const summary = document.getElementById('cf-summary');
  const counter = document.getElementById('cf-message-count');
  const submitBtn = document.getElementById('cf-submit');
  const phoneHint = document.getElementById('cf-phone-hint');
  const PHONE_HINT_DEFAULT = phoneHint.textContent;

  const touched = new Set(); // поля, які вже перевірялись (користувач вийшов з них або натиснув «Надіслати»)
  const dirty = new Set();   // поля, у які користувач щось вводив
  let isSubmitting = false;  // захист від повторного натискання «Надіслати»

  // ---------- UI: стани поля ----------
  // Error: червона рамка, текст помилки під полем, aria-invalid="true".
  function showError(field, message) {
    field.classList.remove('border-line', 'border-success');
    field.classList.add('border-danger');
    field.setAttribute('aria-invalid', 'true');
    const error = document.getElementById(field.id + '-error');
    error.textContent = message;
    error.classList.remove('hidden');
    toggleOkIcon(field, false);
    return false;
  }

  // Success: зелена рамка й позначка ✓, помилку приховано, aria-invalid="false".
  function showSuccess(field) {
    field.classList.remove('border-line', 'border-danger');
    field.classList.add('border-success');
    field.setAttribute('aria-invalid', 'false');
    const error = document.getElementById(field.id + '-error');
    error.textContent = '';
    error.classList.add('hidden');
    toggleOkIcon(field, true);
    return true;
  }

  // Normal: повертає поле до початкового вигляду (після reset форми).
  function clearError(field) {
    field.classList.remove('border-danger', 'border-success');
    field.classList.add('border-line');
    field.setAttribute('aria-invalid', 'false');
    const error = document.getElementById(field.id + '-error');
    error.textContent = '';
    error.classList.add('hidden');
    toggleOkIcon(field, false);
  }

  function toggleOkIcon(field, visible) {
    const icon = field.parentElement.querySelector('.field-ok');
    if (icon) icon.classList.toggle('hidden', !visible);
  }

  // ---------- Валідація окремих полів ----------
  // Кожна функція повертає true/false і сама показує відповідний стан.
  function validateName() {
    const value = fields.name.value.trim();
    if (!value) return showError(fields.name, 'Вкажіть ім’я.');
    if (value.length < 2) return showError(fields.name, 'Ім’я має містити щонайменше 2 символи.');
    if (value.length > 50) return showError(fields.name, 'Ім’я задовге — до 50 символів.');
    if (!NAME_RE.test(value)) {
      return showError(fields.name, 'Лише літери, пробіл, апостроф або дефіс; без цифр і символів.');
    }
    return showSuccess(fields.name);
  }

  function validateEmail() {
    const value = fields.email.value.trim();
    if (!value) return showError(fields.email, 'Вкажіть email.');
    if (!value.includes('@')) return showError(fields.email, 'В адресі бракує символу «@», наприклад user@gmail.com.');
    if (!EMAIL_RE.test(value) || value.includes('..')) {
      return showError(fields.email, 'Перевірте формат адреси, наприклад user@gmail.com.');
    }
    return showSuccess(fields.email);
  }

  function validatePhone() {
    const value = fields.phone.value.trim();
    if (!value) return showError(fields.phone, 'Вкажіть номер телефону.');
    if (PHONE_RE.test(value)) return showSuccess(fields.phone);

    // конкретна підказка, що саме не так (замість загального «неправильний формат»)
    const compact = value.replace(/[\s()-]/g, '');
    if (/[^\d+]/.test(compact)) return showError(fields.phone, 'Номер може містити лише цифри після «+380».');
    if (PHONE_RE.test(compact) || normalizePhone(value) !== value) {
      return showError(fields.phone, 'Запишіть номер як +380XXXXXXXXX — або перейдіть до наступного поля, і формат виправиться автоматично.');
    }
    if (!compact.startsWith('+380')) return showError(fields.phone, 'Номер має починатися з +380.');
    const digits = compact.length - 4;
    return showError(fields.phone, `Після +380 має бути рівно 9 цифр (зараз ${digits}).`);
  }

  function validateMessage() {
    const length = fields.message.value.trim().length;
    if (!length) return showError(fields.message, 'Напишіть повідомлення.');
    if (length < MESSAGE_MIN) {
      return showError(fields.message, `Ще ${MESSAGE_MIN - length} симв. — мінімум ${MESSAGE_MIN} символів.`);
    }
    if (length > MESSAGE_MAX) return showError(fields.message, `Повідомлення задовге — до ${MESSAGE_MAX} символів.`);
    return showSuccess(fields.message);
  }

  function validateAgreement() {
    if (!fields.agree.checked) return showError(fields.agree, 'Потрібна згода на обробку даних, щоб ми могли відповісти.');
    return showSuccess(fields.agree);
  }

  const validators = {
    name: validateName,
    email: validateEmail,
    phone: validatePhone,
    message: validateMessage,
    agree: validateAgreement,
  };

  // ---------- Телефон: UX-нормалізація (окрема функція, не частина RegEx) ----------
  // Приводить поширені записи до +380XXXXXXXXX: «050 123 45 67», «(050) 123-45-67», «380501234567».
  // Повертає вихідне значення, якщо номер не вдається впевнено розпізнати — тоді нічого не змінюємо.
  function normalizePhone(raw) {
    const compact = raw.trim().replace(/[\s()-]/g, '');
    if (/^\+380\d{9}$/.test(compact)) return compact;
    if (/^380\d{9}$/.test(compact)) return '+' + compact;
    if (/^0\d{9}$/.test(compact)) return '+38' + compact;
    return raw;
  }

  // Викликається на blur: якщо номер змінено — пояснюємо користувачу, що саме зроблено.
  function applyPhoneNormalization() {
    const before = fields.phone.value;
    const after = normalizePhone(before);
    if (after !== before && PHONE_RE.test(after)) {
      fields.phone.value = after;
      phoneHint.textContent = `Номер приведено до формату +380: «${before.trim()}» → «${after}».`;
    } else {
      phoneHint.textContent = PHONE_HINT_DEFAULT;
    }
  }

  // ---------- Лічильник символів повідомлення ----------
  function updateCounter() {
    const length = fields.message.value.length;
    counter.textContent = `${length} / ${MESSAGE_MAX}`;
    counter.classList.toggle('text-danger', length > 0 && fields.message.value.trim().length < MESSAGE_MIN);
  }

  // ---------- Динамічна валідація: input / blur / change ----------
  Object.entries(fields).forEach(([key, field]) => {
    if (field.type === 'checkbox') {
      field.addEventListener('change', () => {
        touched.add(key);
        validators[key]();
        refreshSummary();
      });
      return;
    }
    field.addEventListener('input', () => {
      dirty.add(key);
      if (key === 'message') updateCounter();
      // поки користувач не вийшов з поля вперше — не «кричимо» помилками під час набору
      if (touched.has(key)) {
        validators[key]();
        refreshSummary();
      }
    });
    field.addEventListener('blur', () => {
      // поле, у яке нічого не вводили (просто пройшли Tab), не перевіряємо
      if (!touched.has(key) && !dirty.has(key)) return;
      touched.add(key);
      if (key === 'phone') applyPhoneNormalization();
      validators[key]();
      refreshSummary();
    });
  });

  // ---------- Submit ----------
  form.addEventListener('submit', (event) => {
    event.preventDefault(); // без цього браузер перезавантажив би сторінку й відправив форму
    if (isSubmitting) return;

    applyPhoneNormalization();
    const invalid = [];
    Object.keys(validators).forEach((key) => {
      touched.add(key);
      if (!validators[key]()) invalid.push(key);
    });

    if (invalid.length) {
      showSummary(invalid);
      fields[invalid[0]].focus(); // фокус на першому полі з помилкою
      return;
    }

    hideSummary();
    simulateSend();
  });

  function showSummary(invalid) {
    summary.textContent = '';
    const title = document.createElement('p');
    title.className = 'font-semibold';
    title.textContent = invalid.length === 1 ? 'Перевірте одне поле:' : `Перевірте поля (${invalid.length}):`;
    const list = document.createElement('p');
    list.className = 'mt-1 text-muted';
    list.textContent = invalid.map((key) => labels[key]).join(', ');
    summary.append(title, list);
    summary.classList.remove('hidden');
  }

  // Після виправлень оновлюємо зведення: поля з aria-invalid="true" лишаються в списку, решта зникає
  function refreshSummary() {
    if (summary.classList.contains('hidden')) return;
    const invalid = Object.keys(fields).filter((key) => fields[key].getAttribute('aria-invalid') === 'true');
    if (invalid.length) showSummary(invalid);
    else hideSummary();
  }

  function hideSummary() {
    summary.classList.add('hidden');
    summary.textContent = '';
  }

  // Імітація надсилання: бекенду немає, тому коротка пауза → модальне вікно → очищення форми.
  function simulateSend() {
    isSubmitting = true;
    submitBtn.disabled = true;
    const icon = submitBtn.querySelector('[data-submit-icon]');
    const text = submitBtn.querySelector('[data-submit-text]');
    icon.className = 'fa-solid fa-spinner fa-spin';
    text.textContent = 'Надсилаємо…';

    const name = fields.name.value.trim();
    const email = fields.email.value.trim();
    window.setTimeout(() => {
      form.reset();         // очищаємо поля до показу вікна, щоб після закриття форма була готова
      resetStates();
      openModal(name, email);
      isSubmitting = false;
      submitBtn.disabled = false;
      icon.className = 'fa-solid fa-paper-plane';
      text.textContent = 'Надіслати';
    }, 700);
  }

  function resetStates() {
    Object.values(fields).forEach(clearError);
    touched.clear();
    dirty.clear();
    phoneHint.textContent = PHONE_HINT_DEFAULT;
    updateCounter();
  }

  // ---------- Модальне вікно ----------
  const modal = document.getElementById('success-modal');
  const card = modal.querySelector('[data-modal-card]');

  function openModal(name, email) {
    // textContent, а не innerHTML: введене ім'я не може вставити HTML/скрипт на сторінку
    modal.querySelector('[data-success-name]').textContent = name;
    modal.querySelector('[data-success-email]').textContent = email;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('overflow-hidden'); // сторінка під вікном не прокручується
    modal.querySelector('[data-modal-close]').focus();
    document.addEventListener('keydown', onModalKeydown);
  }

  function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
    document.removeEventListener('keydown', onModalKeydown);
    submitBtn.focus(); // фокус повертається на кнопку, з якої відкрили вікно, — не губиться
  }

  // Esc закриває вікно; Tab / Shift+Tab не виходять за межі вікна (focus trap)
  function onModalKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = card.querySelectorAll('a[href], button:not([disabled])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  modal.querySelector('[data-modal-close]').addEventListener('click', closeModal);
  // клік по затемненню закриває; клік усередині картки — ні (event.target тоді — елемент картки)
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  updateCounter();
})();
