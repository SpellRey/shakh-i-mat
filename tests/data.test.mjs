// Автотести даних сайту (самостійна робота): npm test
// Запускаються в GitHub Actions перед деплоєм — зіпсований data.json не потрапить на сайт.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../data/data.json', import.meta.url), 'utf8'));
const gameIds = new Set(data.games.map((g) => g.id));

test('data.json має всі розділи й вони не порожні', () => {
  for (const key of ['games', 'owners', 'players', 'tournaments']) {
    assert.ok(Array.isArray(data[key]) && data[key].length > 0, `розділ «${key}»`);
  }
});

test('id в кожному розділі унікальні', () => {
  for (const key of ['games', 'owners', 'players', 'tournaments']) {
    const ids = data[key].map((item) => item.id);
    assert.equal(new Set(ids).size, ids.length, `дублікати id у «${key}»`);
  }
});

test('ігри: обов’язкові поля, ціна 1–1000 грн, коректна кількість гравців', () => {
  for (const g of data.games) {
    for (const field of ['id', 'name', 'genre', 'img', 'alt', 'desc']) {
      assert.ok(typeof g[field] === 'string' && g[field].trim() !== '', `${g.id}: поле ${field}`);
    }
    assert.ok(Number.isFinite(g.price) && g.price > 0 && g.price <= 1000, `${g.id}: ціна ${g.price}`);
    assert.ok(g.pmin >= 1 && g.pmin <= g.pmax, `${g.id}: гравців ${g.pmin}–${g.pmax}`);
    assert.ok(g.rating >= 0 && g.rating <= 5, `${g.id}: рейтинг ${g.rating}`);
  }
});

test('турніри посилаються на наявні ігри, зайнятих місць не більше, ніж є', () => {
  for (const t of data.tournaments) {
    assert.ok(gameIds.has(t.game), `${t.id}: гра «${t.game}» відсутня в каталозі`);
    assert.ok(t.taken >= 0 && t.taken <= t.seats, `${t.id}: ${t.taken} з ${t.seats}`);
    assert.match(t.date, /^\d{4}-\d{2}-\d{2}$/, `${t.id}: дата ${t.date}`);
  }
});

test('улюблені ігри гравців є в каталозі', () => {
  for (const p of data.players) {
    for (const id of p.games) assert.ok(gameIds.has(id), `${p.id}: гра «${id}»`);
  }
});
