// =====================================================================
// Віджет «Калькулятор оренди» (ЛР 11) — Vanilla JS, без jQuery.
//
// Захист від Edge Cases на трьох рівнях:
//   1) HTML5: type="number", min="1", max="14", step="1", required (index.html);
//   2) JS: нормалізація рядка в число, перевірка NaN / Infinity / діапазону, перевірка ціни й наявності елементів;
//   3) безпечний вивід: лише textContent — жодного innerHTML.
// Fail-safe: якщо в розмітці бракує обов'язкового елемента, віджет не ініціалізується (попередження в консолі),
// а решта сторінки працює далі. Ізоляція: увесь код у замиканні (IIFE), глобальних змінних немає;
// поля шукаються лише всередині кореня [data-rent-calc], тож на сторінці може бути кілька незалежних віджетів.
// =====================================================================
(() => {
  'use strict';

  // ---------- Бізнес-правила (єдине місце, де задаються числа) ----------
  const RULES = Object.freeze({
    DAYS_MIN: 1,
    DAYS_MAX: 14,
    PRICE_MAX: 1000,          // ціна за день більша за це вважається зіпсованими даними
    DELIVERY_PRICE: 30,       // грн, доставка до кімнати
    INSURANCE_RATE: 0.10,     // 10 % від суми оренди після знижки
    DISCOUNTS: [              // від більшої тривалості до меншої
      { from: 7, rate: 0.20 },
      { from: 3, rate: 0.10 },
    ],
  });

  const money = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 });
  const formatUAH = (value) => `${money.format(value)} грн`;

  // ---------- Чиста функція розрахунку: лише числа на вході й на виході, без DOM ----------
  function calculateRent({ price, days, delivery, insurance }) {
    const rent = price * days;
    const discountRule = RULES.DISCOUNTS.find((rule) => days >= rule.from);
    const discountRate = discountRule ? discountRule.rate : 0;
    const discount = rent * discountRate;
    const subtotal = rent - discount;
    const insuranceCost = insurance ? subtotal * RULES.INSURANCE_RATE : 0;
    const deliveryCost = delivery ? RULES.DELIVERY_PRICE : 0;
    // гроші округлюємо один раз — у фінальній сумі (без накопичення похибок)
    const total = Math.round(subtotal + insuranceCost + deliveryCost);
    return { rent, discountRate, discount, insuranceCost, deliveryCost, total };
  }

  // ---------- Нормалізація та валідація кількості днів ----------
  // Number(), а не parseInt(): parseInt('1e3') = 1 і parseInt('2.5') = 2 — тихо спотворюють введене.
  function parseDays(input) {
    if (input.validity && input.validity.badInput) {
      return { ok: false, message: 'Введіть число — лише цифри, наприклад 3.' };
    }
    const raw = input.value.trim();
    if (raw === '') {
      return { ok: false, message: `Вкажіть кількість днів від ${RULES.DAYS_MIN} до ${RULES.DAYS_MAX}.` };
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      return { ok: false, message: 'Введіть число — лише цифри, наприклад 3.' };
    }
    if (value < RULES.DAYS_MIN) {
      return { ok: false, message: `Мінімальна оренда — ${RULES.DAYS_MIN} день.` };
    }
    const days = Math.ceil(value); // оренда рахується повними днями: 2.5 → 3
    if (days > RULES.DAYS_MAX) {
      return { ok: false, message: `Максимум ${RULES.DAYS_MAX} днів — довшу оренду узгоджуйте з власником.` };
    }
    return { ok: true, days, rounded: days !== value, original: raw };
  }

  // ---------- Ціна обраної гри (захист від порожнього select і зіпсованого data-price) ----------
  function readPrice(select) {
    const option = select.selectedOptions && select.selectedOptions[0];
    if (!option) return { ok: false, message: 'Оберіть гру зі списку.' };
    const price = Number(option.dataset.price);
    if (!Number.isFinite(price) || price <= 0 || price > RULES.PRICE_MAX) {
      return { ok: false, message: 'Не вдалося визначити ціну цієї гри — оберіть іншу або оновіть сторінку.' };
    }
    return { ok: true, price, id: option.value, name: option.textContent.split('—')[0].trim() };
  }

  // ---------- Ініціалізація одного екземпляра ----------
  function initRentCalculator(root) {
    const q = (name) => root.querySelector(`[data-calc="${name}"]`);
    const el = {
      game: q('game'),
      days: q('days'),
      daysError: q('days-error'),
      total: q('total'),
    };
    // обов'язкові елементи: без них віджет не має сенсу — тихо вимикаємось замість TypeError
    const missing = Object.keys(el).filter((key) => !el[key]);
    if (missing.length) {
      console.warn(`[rent-calc] Віджет не ініціалізовано: у розмітці бракує елементів ${missing.join(', ')}.`);
      return null;
    }
    // необов'язкові елементи: якщо їх немає, відповідний рядок просто не оновлюється
    Object.assign(el, {
      gameError: q('game-error'),
      daysHint: q('days-hint'),
      insurance: q('insurance'),
      totalError: q('total-error'),
      cta: q('cta'),
      rentLabel: q('rent-label'),
      rentValue: q('rent-value'),
      discountLabel: q('discount-label'),
      discountValue: q('discount-value'),
      insuranceValue: q('insurance-value'),
      deliveryValue: q('delivery-value'),
    });
    const deliveryRadios = root.querySelectorAll('[data-calc="delivery"]');
    const hintDefault = el.daysHint ? el.daysHint.textContent : '';

    const setText = (node, text) => { if (node) node.textContent = text; };

    function setFieldError(field, errorNode, message) {
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      field.classList.toggle('border-danger', Boolean(message));
      field.classList.toggle('border-line', !message);
      if (errorNode) {
        errorNode.textContent = message || '';
        errorNode.classList.toggle('hidden', !message);
      }
    }

    function deliverySelected() {
      const checked = Array.from(deliveryRadios).find((radio) => radio.checked);
      return Boolean(checked && checked.value === 'delivery');
    }

    function showInvalid() {
      setText(el.total, '—');
      ['rentValue', 'discountValue', 'insuranceValue', 'deliveryValue'].forEach((key) => setText(el[key], '—'));
      if (el.totalError) el.totalError.classList.remove('hidden');
      if (el.cta) {
        el.cta.setAttribute('aria-disabled', 'true');
        el.cta.setAttribute('tabindex', '-1');
      }
    }

    function update() {
      const price = readPrice(el.game);
      const days = parseDays(el.days);
      setFieldError(el.game, el.gameError, price.ok ? '' : price.message);
      setFieldError(el.days, el.daysError, days.ok ? '' : days.message);
      setText(el.daysHint, days.ok && days.rounded
        ? `Оренда рахується повними днями: ${days.original} → ${days.days}.`
        : hintDefault);

      if (!price.ok || !days.ok) {
        showInvalid();
        return;
      }

      const result = calculateRent({
        price: price.price,
        days: days.days,
        delivery: deliverySelected(),
        insurance: Boolean(el.insurance && el.insurance.checked),
      });

      setText(el.rentLabel, `Оренда: ${formatUAH(price.price)} × ${days.days} дн.`);
      setText(el.rentValue, formatUAH(result.rent));
      setText(el.discountLabel, result.discountRate ? `Знижка ${Math.round(result.discountRate * 100)} %` : 'Знижка');
      setText(el.discountValue, result.discount ? `−${formatUAH(result.discount)}` : '—');
      setText(el.insuranceValue, result.insuranceCost ? `+${formatUAH(result.insuranceCost)}` : '—');
      setText(el.deliveryValue, result.deliveryCost ? `+${formatUAH(result.deliveryCost)}` : '—');
      setText(el.total, formatUAH(result.total));
      if (el.totalError) el.totalError.classList.add('hidden');
      if (el.cta) {
        el.cta.href = `game.html?id=${encodeURIComponent(price.id)}`;
        el.cta.removeAttribute('aria-disabled');
        el.cta.removeAttribute('tabindex');
      }
    }

    // після виходу з поля (change) записуємо нормалізоване значення: 2.5 → 3
    function normalizeDaysField() {
      const days = parseDays(el.days);
      if (days.ok && days.rounded) el.days.value = String(days.days);
      update();
      if (days.ok && days.rounded) {
        setText(el.daysHint, `Оренда рахується повними днями: ${days.original} → ${days.days}.`);
      }
    }

    // input — миттєвий перерахунок під час введення; change — для select, radio, checkbox і завершення введення
    el.days.addEventListener('input', update);
    el.days.addEventListener('change', normalizeDaysField);
    el.game.addEventListener('change', update);
    if (el.insurance) el.insurance.addEventListener('change', update);
    deliveryRadios.forEach((radio) => radio.addEventListener('change', update));
    // посилання-кнопку не можна «натиснути», поки параметри невалідні
    if (el.cta) {
      el.cta.addEventListener('click', (event) => {
        if (el.cta.getAttribute('aria-disabled') === 'true') event.preventDefault();
      });
    }

    update();
    return { update };
  }

  function initAll() {
    document.querySelectorAll('[data-rent-calc]').forEach(initRentCalculator);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
