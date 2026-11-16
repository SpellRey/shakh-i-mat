// Автотести логіки калькулятора оренди (js/widget.js, ЛР 11): npm test
// Перевіряються чисті функції без браузера — Happy Path і Edge Cases з тест-плану.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { RULES, calculateRent, parseDays } = require('../js/widget.js');
const field = (value) => ({ value, validity: { badInput: false } });

test('Happy Path: Каркассон 100 грн × 5 днів, доставка й страхування = 525 грн', () => {
  // 500 − 10 % = 450; страхування 10 % від 450 = 45; доставка 30 → 450 + 45 + 30 = 525
  assert.equal(calculateRent({ price: 100, days: 5, delivery: true, insurance: true }).total, 525);
});

test('знижки: 1–2 дні без знижки, від 3 днів −10 %, від 7 днів −20 %', () => {
  assert.equal(calculateRent({ price: 100, days: 2 }).discountRate, 0);
  assert.equal(calculateRent({ price: 100, days: 3 }).discountRate, 0.1);
  assert.equal(calculateRent({ price: 100, days: 7 }).discountRate, 0.2);
  assert.equal(calculateRent({ price: 50, days: 7 }).total, 280);
});

test('межі: 1 і 14 днів допустимі, 0 і 15 — помилка', () => {
  assert.equal(parseDays(field('1')).ok, true);
  assert.equal(parseDays(field(String(RULES.DAYS_MAX))).ok, true);
  assert.equal(parseDays(field('0')).ok, false);
  assert.equal(parseDays(field('15')).ok, false);
});

test('Edge Cases: порожнє поле, від’ємне, 1e3, дуже велике число, некоректне введення', () => {
  for (const value of ['', '   ', '-5', '1e3', '99999999']) {
    assert.equal(parseDays(field(value)).ok, false, `«${value}»`);
  }
  assert.equal(parseDays({ value: '', validity: { badInput: true } }).ok, false);
});

test('дріб округлюється вгору до повного дня: 2.5 → 3', () => {
  const r = parseDays(field('2.5'));
  assert.equal(r.ok, true);
  assert.equal(r.days, 3);
  assert.equal(r.rounded, true);
});

test('результат завжди скінченне ціле число (без NaN)', () => {
  for (let days = 1; days <= 14; days += 1) {
    const { total } = calculateRent({ price: 75, days, delivery: days % 2 === 0, insurance: days % 3 === 0 });
    assert.ok(Number.isInteger(total) && total > 0, `${days} днів → ${total}`);
  }
});
