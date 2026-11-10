// Логіка сторінок «Шах і Мат».
// Кожна сторінка має атрибут <body data-page="...">, за яким запускається свій модуль.
// Дані (ігри, гравці, турніри) — у js/data.js. Значення з адреси (?id=...) вставляються
// лише через textContent, щоб не можна було підкинути HTML-код.

(function () {
  const DATA = window.SHM_DATA;
  const params = new URLSearchParams(window.location.search);
  const page = document.body.dataset.page;

  // ---------- допоміжні функції ----------
  const byId = (list, id, fallback) => list.find((item) => item.id === id) || fallback;
  const game = (id) => byId(DATA.games, id, DATA.games[0]);
  const tournament = (id) => byId(DATA.tournaments, id, DATA.tournaments[0]);
  const player = (id) => byId(DATA.players, id, DATA.players[0]);
  const owner = (id) => byId(DATA.owners, id, DATA.owners[0]);
  const money = (n) => `${n.toLocaleString('uk-UA')} ₴`;
  const freeSeats = (t) => t.seats - t.taken;

  // заповнює всі елементи з data-field="назва" текстом
  function fill(fields) {
    Object.entries(fields).forEach(([name, value]) => {
      document.querySelectorAll(`[data-field="${name}"]`).forEach((node) => {
        node.textContent = value;
      });
    });
  }

  // підставляє параметри в посилання з data-href="шаблон", напр. "booking.html?id={game}"
  function links(values) {
    document.querySelectorAll('[data-href]').forEach((link) => {
      const url = link.dataset.href.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(values[key] ?? ''));
      link.setAttribute('href', url);
    });
  }

  // коротке повідомлення в зоні aria-live (для демо-дій без бекенду)
  function notice(target, text) {
    const box = document.getElementById(target);
    if (!box) return;
    box.textContent = text;
    box.hidden = false;
  }

  function formatDate(iso) {
    if (!iso) return 'Сьогодні';
    const today = new Date();
    const todayIso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    if (iso === todayIso) return 'Сьогодні';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }

  function daysText(n) {
    if (n === 1) return '1 день';
    if (n >= 2 && n <= 4) return `${n} дні`;
    return `${n} днів`;
  }

  // кнопки «демо-дій» на сторінках станів: показують повідомлення замість запиту на сервер
  document.querySelectorAll('[data-notice]').forEach((button) => {
    button.addEventListener('click', () => notice(button.dataset.target || 'action-notice', button.dataset.notice));
  });

  const modules = {
    // ================= ГОЛОВНА: відео з конем у hero =================
    // Відео запускається з JS, а не атрибутом autoplay: якщо в системі ввімкнено «менше руху»,
    // лишається лише заставка (poster). Коли hero прокручено за межі екрана, відео стає на паузу.
    home() {
      const video = document.querySelector('[data-hero-video]');
      if (!video) return;
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
      let visible = true;

      const update = () => {
        if (visible && !calm.matches) {
          video.play().catch(() => {}); // браузер може заборонити автозапуск — тоді видно заставку
        } else {
          video.pause();
        }
      };

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          update();
        }).observe(video);
      }
      calm.addEventListener('change', update);
      // ЛР 12: відео стартує після повного завантаження сторінки — спершу вантажаться текст, стилі й постер,
      // а 0,3 МБ відео не конкурують з ними за мережу (краще LCP); до того видно постер
      if (document.readyState === 'complete') update();
      else window.addEventListener('load', update, { once: true });
    },

    // ================= КАТАЛОГ: фільтри, пошук і сортування =================
    catalog() {
      const form = document.getElementById('filters');
      const grid = document.getElementById('games-grid');
      const cards = Array.from(grid.children);
      const count = document.getElementById('games-count');
      const empty = document.getElementById('games-empty');
      const search = document.getElementById('game-search');
      const sort = document.getElementById('game-sort');

      // жанр з адреси (catalog.html?genre=Партійна) — попередньо відмічаємо
      const genreParam = params.get('genre');
      if (genreParam) {
        form.querySelectorAll('input[name="genre"]').forEach((box) => {
          box.checked = box.value === genreParam;
        });
      }

      const checked = (name) => Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((box) => box.value);

      const playersMatch = (card, ranges) => ranges.length === 0 || ranges.some((range) => {
        const [from, to] = range.split('-').map(Number);
        const min = Number(card.dataset.pmin);
        const max = Number(card.dataset.pmax);
        return max >= from && min <= (to || 99); // діапазони перетинаються
      });

      const priceMatch = (card, ranges) => ranges.length === 0 || ranges.some((range) => {
        const [from, to] = range.split('-').map(Number);
        const price = Number(card.dataset.price);
        return price > from && price <= (to || Infinity);
      });

      function apply() {
        const genres = checked('genre');
        const players = checked('players');
        const prices = checked('price');
        const query = search.value.trim().toLowerCase();
        let shown = 0;

        cards.forEach((card) => {
          const visible = (genres.length === 0 || genres.includes(card.dataset.genre))
            && playersMatch(card, players)
            && priceMatch(card, prices)
            && card.dataset.name.toLowerCase().includes(query);
          card.hidden = !visible;
          if (visible) shown += 1;
        });

        // сортування: переставляємо вузли в сітці
        const order = sort.value;
        cards.slice().sort((a, b) => {
          if (order === 'cheap') return a.dataset.price - b.dataset.price;
          if (order === 'expensive') return b.dataset.price - a.dataset.price;
          return b.dataset.rating - a.dataset.rating;
        }).forEach((card) => grid.appendChild(card));

        count.textContent = `Показано ${shown} з ${cards.length} ігор`;
        empty.hidden = shown !== 0;
      }

      form.addEventListener('change', apply);
      search.addEventListener('input', apply);
      sort.addEventListener('change', apply);
      form.addEventListener('reset', () => {
        search.value = ''; // поле пошуку стоїть поза формою, тому очищаємо його окремо
        setTimeout(apply, 0); // чекаємо, доки браузер скине чекбокси
      });
      document.getElementById('reset-filters').addEventListener('click', () => {
        form.reset();
        search.value = '';
      });
      apply();
    },

    // ================= СТОРІНКА ГРИ =================
    game() {
      const g = game(params.get('id'));
      document.title = `${g.name} — оренда гри | Шах і Мат`;
      fill({
        name: g.name, genre: g.genre, players: `${g.players} гравців`, playersShort: g.players, time: g.time,
        price: `${g.price} ₴/день*`, priceShort: `${g.price} ₴/день`, rating: `${g.rating} / 5`, copies: String(g.copies),
        desc: g.desc, author: g.author, license: g.license,
      });
      const img = document.getElementById('game-photo');
      img.src = g.img;
      img.alt = g.alt;
      img.width = g.w;
      img.height = g.h;
      img.title = `Фото: ${g.author}, ${g.license}, Wikimedia Commons`;
      document.getElementById('photo-source').href = g.src;
      links({ game: g.id, genre: g.genre });

      // схожі ігри того самого жанру (до трьох)
      const similar = document.getElementById('similar');
      DATA.games.filter((item) => item.genre === g.genre && item.id !== g.id).slice(0, 3).forEach((item) => {
        const link = document.createElement('a');
        link.href = `game.html?id=${item.id}`;
        link.className = 'group flex items-center gap-4 rounded-2xl border border-line bg-surface p-3 transition duration-300 hover:-translate-y-1 hover:border-secondary/60 hover:shadow-neon-cyan';
        const photo = document.createElement('img');
        photo.src = item.img;
        photo.alt = '';
        photo.loading = 'lazy';
        photo.className = 'h-16 w-20 shrink-0 rounded-lg object-cover';
        const text = document.createElement('span');
        text.className = 'flex flex-col';
        const name = document.createElement('strong');
        name.className = 'text-lg transition group-hover:text-secondary';
        name.textContent = item.name;
        const price = document.createElement('span');
        price.className = 'text-sm text-muted';
        price.textContent = `${item.price} ₴/день · ${item.players} гравців`;
        text.append(name, price);
        link.append(photo, text);
        similar.appendChild(link);
      });
      document.getElementById('similar-block').hidden = similar.children.length === 0;
    },

    // ================= БРОНЮВАННЯ + КАЛЬКУЛЯТОР ВАРТОСТІ =================
    booking() {
      const g = game(params.get('id'));
      const o = owner(params.get('owner'));
      const form = document.getElementById('booking-form');
      const date = document.getElementById('book-date');
      const days = document.getElementById('book-days');
      const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      date.min = today;
      date.value = today;

      fill({ name: g.name, owner: o.name });
      links({ game: g.id, owner: o.id });

      function recalc() {
        const n = Number(days.value);
        fill({ period: daysText(n), formula: `Разом (${g.price} ₴ × ${daysText(n)})`, total: `${money(g.price * n)}*` });
      }
      days.addEventListener('change', recalc);
      recalc();

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const query = new URLSearchParams({
          id: g.id, owner: o.id, date: date.value, time: form.time.value, days: days.value, place: form.place.value,
        });
        window.location.href = `rent-confirmed.html?${query}`;
      });
    },

    // ================= ОРЕНДУ ПІДТВЕРДЖЕНО =================
    'rent-confirmed'() {
      const g = game(params.get('id'));
      const o = owner(params.get('owner'));
      const n = Math.min(Math.max(Number(params.get('days')) || 1, 1), 30);
      fill({
        name: g.name, owner: o.name,
        when: `${formatDate(params.get('date'))}, ${params.get('time') || '18:30'}`,
        place: params.get('place') || 'Гуртожиток №4, вестибюль',
        period: daysText(n), total: `${money(g.price * n)}*`,
      });
    },

    // ================= ГРА НЕДОСТУПНА =================
    'rent-unavailable'() {
      const g = game(params.get('id'));
      fill({ name: g.name });
      links({ game: g.id, genre: g.genre, owner: DATA.owners[0].id });
    },

    // ================= ТУРНІРИ: вкладки «Майбутні / Минулі» =================
    tournaments() {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      function select(tab) {
        tabs.forEach((item) => {
          const active = item === tab;
          item.setAttribute('aria-selected', String(active));
          item.tabIndex = active ? 0 : -1;
          document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
        });
      }
      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => select(tab));
        // стрілки ← → перемикають вкладки (патерн WAI-ARIA Tabs)
        tab.addEventListener('keydown', (event) => {
          if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
          const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
          select(next);
          next.focus();
        });
      });
    },

    // ================= ДЕТАЛІ ТУРНІРУ =================
    tournament() {
      const t = tournament(params.get('id'));
      document.title = `${t.title} | Шах і Мат`;
      const free = freeSeats(t);
      fill({
        title: t.title, desc: t.desc, date: t.dateText, time: t.timeText, prize: `${money(t.prize)}*`, place: t.place,
        seats: `${free} / ${t.seats}`, more: `+ ще ${Math.max(t.taken - 5, 0)} учасників`,
      });
      const register = document.getElementById('register-link');
      register.href = free === 0 ? `tournament-full.html?id=${t.id}` : `tournament-register.html?id=${t.id}`;
      register.textContent = free === 0 ? 'Місць немає — що далі?' : 'Зареєструватися';
    },

    // ================= РЕЄСТРАЦІЯ НА ТУРНІР =================
    'tournament-register'() {
      const t = tournament(params.get('id'));
      if (freeSeats(t) === 0) {
        window.location.replace(`tournament-full.html?id=${t.id}`);
        return;
      }
      fill({ subtitle: `${t.title} · ${t.dateText} · ${t.place}`, seats: `Є вільні місця: ${freeSeats(t)} з ${t.seats}` });
      links({ id: t.id });
      const form = document.getElementById('register-form');
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        window.location.href = `tournament-confirmed.html?id=${t.id}`;
      });
    },

    'tournament-confirmed'() {
      const t = tournament(params.get('id'));
      fill({ title: t.title, when: `${t.dateText}, ${t.timeText}`, place: t.place });
    },

    'tournament-full'() {
      const t = tournament(params.get('id'));
      fill({ title: t.title, seats: `Усі ${t.seats} місць на цей турнір уже зайняті.` });
    },

    // ================= МАТЧИНГ: фільтри суперників =================
    matching() {
      const form = document.getElementById('match-filters');
      const items = Array.from(document.querySelectorAll('#players > li'));
      const count = document.getElementById('players-count');
      const empty = document.getElementById('players-empty');

      // попередні значення з адреси (напр. після сторінки «Немає гравців»)
      ['game', 'level', 'time', 'dorm'].forEach((name) => {
        if (params.has(name)) form.elements[name].value = params.get(name);
      });

      function apply() {
        const f = Object.fromEntries(new FormData(form));
        let shown = 0;
        items.forEach((item) => {
          const visible = (f.game === 'any' || item.dataset.games.split(' ').includes(f.game))
            && (f.level === 'any' || item.dataset.level === f.level)
            && (f.time === 'any' || item.dataset.time === f.time)
            && (f.dorm === 'any' || item.dataset.dorm === f.dorm);
          item.hidden = !visible;
          if (visible) shown += 1;
          // у посилання «Запросити» передаємо вибрану гру
          const invite = item.querySelector('a');
          const chosen = f.game === 'any' ? item.dataset.games.split(' ')[0] : f.game;
          invite.href = `match-invite.html?player=${item.dataset.id}&game=${chosen}`;
        });
        count.textContent = String(shown);
        empty.hidden = shown !== 0;
        return shown;
      }

      form.addEventListener('change', apply);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (apply() === 0) {
          window.location.href = `match-no-players.html?${new URLSearchParams(new FormData(form))}`;
        } else {
          document.getElementById('players-title').scrollIntoView({ behavior: 'smooth' });
        }
      });
      apply();
    },

    // ================= ЗАПРОШЕННЯ НА ГРУ =================
    'match-invite'() {
      const p = player(params.get('player'));
      const form = document.getElementById('invite-form');
      fill({
        initials: p.initials, playerName: p.name, rating: `${p.rating} / 5`, level: p.level,
        favs: p.games.map((id) => game(id).name).join(', '), place: p.place, time: p.timeText,
      });
      const gameId = params.get('game');
      if (gameId && form.elements.game.querySelector(`option[value="${CSS.escape(gameId)}"]`)) {
        form.elements.game.value = gameId;
      } else {
        form.elements.game.value = p.games[0];
      }
      form.elements.level.value = p.level;
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const query = new URLSearchParams({
          player: p.id, game: form.elements.game.value, when: form.elements.when.value, where: form.elements.where.value,
        });
        window.location.href = `match-confirmed.html?${query}`;
      });
    },

    'match-confirmed'() {
      const p = player(params.get('player'));
      fill({
        playerName: p.name, gameName: game(params.get('game') || p.games[0]).name,
        when: params.get('when') || 'Сьогодні, 19:00', where: params.get('where') || p.place,
        status: `${p.name} — підтверджено`,
      });
    },

    'match-no-players'() {
      const query = new URLSearchParams(params);
      const make = (changes) => {
        const next = new URLSearchParams(query);
        Object.entries(changes).forEach(([key, value]) => next.set(key, value));
        return `matching.html?${next}`;
      };
      document.getElementById('wider-place').href = make({ dorm: 'any' });
      document.getElementById('other-time').href = make({ time: 'any' });
      document.getElementById('any-level').href = make({ level: 'any' });
    },

    // ================= ВХІД І РЕЄСТРАЦІЯ (демо без сервера) =================
    login() { authForm('auth-form', 'Вхід виконано (демо): акаунти ще не підключені до сервера.'); },
    register() { authForm('auth-form', 'Акаунт створено (демо): дані нікуди не надсилаються.'); },
  };

  function authForm(id, message) {
    const form = document.getElementById(id);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      notice('auth-notice', message);
      form.reset();
    });
  }

  if (modules[page]) modules[page]();
})();
