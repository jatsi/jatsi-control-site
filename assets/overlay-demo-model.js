/* Browser-local example data. Pure state transitions, shared by the demo and Node checks. */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.JatsiOverlayDemo = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const gifts = Object.freeze({
    rose: Object.freeze({ label: "Rosa", icon: "🌹", value: 1 }),
    heart: Object.freeze({ label: "Corazón", icon: "💜", value: 10 }),
    star: Object.freeze({ label: "Estrella", icon: "⭐", value: 100 }),
  });
  const clean = (value, limit, fallback) => String(value == null ? "" : value).trim().slice(0, limit) || fallback;
  function initialState() {
    return {
      likes: 1250, follows: 24, coins: 420, events: 0,
      targets: { likes: 2000, follows: 30, coins: 1000 },
      duel: { left: 260, right: 160 },
      donors: [{ name: "Luna", coins: 180 }, { name: "Nova", coins: 150 }, { name: "Michi", coins: 90 }],
      lastEvent: null, lastComment: null, log: [],
    };
  }
  function applyEvent(state, input) {
    if (!input || !["like", "follow", "gift", "comment"].includes(input.type)) return state;
    const next = { ...state, duel: { ...state.duel }, donors: state.donors.map((person) => ({ ...person })), log: state.log.slice() };
    const name = clean(input.name, 32, "Tu comunidad");
    const event = { type: input.type, name, number: state.events + 1 };
    if (input.type === "like") {
      next.likes += 250;
      event.title = `${name} envió 250 likes`;
      event.action = "Sumar likes + lanzar corazones";
      event.copy = "+250 likes para esta comunidad";
      event.icon = "♥";
    } else if (input.type === "follow") {
      next.follows += 1;
      event.title = `${name} empezó a seguirte`;
      event.action = "Sumar follow + mostrar bienvenida";
      event.copy = "Una nueva estrella se une al canal";
      event.icon = "✦";
    } else if (input.type === "gift") {
      const gift = gifts[input.gift] || gifts.star;
      const side = input.side === "right" ? "right" : "left";
      next.coins += gift.value;
      next.duel[side] += gift.value;
      const donor = next.donors.find((person) => person.name.toLocaleLowerCase("es") === name.toLocaleLowerCase("es"));
      if (donor) donor.coins += gift.value;
      else next.donors.push({ name, coins: gift.value });
      next.donors.sort((a, b) => b.coins - a.coins || a.name.localeCompare(b.name, "es"));
      // A short-lived public demo needs only a bounded example leaderboard.
      next.donors = next.donors.slice(0, 30);
      event.title = `${name} envió ${gift.label} · ${gift.value} ${gift.value === 1 ? "moneda" : "monedas"}`;
      event.action = `Actualizar ranking + Equipo ${side === "left" ? "Rosa" : "Estrella"}`;
      event.copy = `${gift.label} para el Equipo ${side === "left" ? "Rosa" : "Estrella"}`;
      event.icon = gift.icon;
      event.value = gift.value;
      event.side = side;
    } else {
      const text = clean(input.comment, 100, "¡Vamos por esa meta!");
      next.lastComment = { name, text };
      event.title = `${name}: ${text}`;
      event.action = "Mostrar el comentario en la escena";
      event.copy = text;
      event.icon = "◌";
    }
    next.events = event.number;
    next.lastEvent = event;
    next.log.unshift(event);
    next.log = next.log.slice(0, 5);
    return next;
  }
  const percent = (current, target) => Math.min(100, Math.max(0, Math.round(current / Math.max(1, target) * 100)));
  return Object.freeze({ initialState, applyEvent, percent, gifts });
});
