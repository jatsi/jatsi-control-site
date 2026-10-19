/* Independent simulation. All events are synthetic and stay in this page. */
(() => {
  "use strict";
  const root = document.querySelector("[data-overlay-studio]");
  const model = window.JatsiOverlayDemo;
  if (!root || !model || root.dataset.odReady) return;
  root.dataset.odReady = "true";
  const get = (name) => root.querySelector(`[data-od-${name}]`);
  const format = new Intl.NumberFormat("es-MX");
  const stage = get("stage");
  const particles = get("particles");
  const controls = { name: get("name"), gift: get("gift"), team: get("team"), comment: get("comment"), color: get("color"), size: get("size"), shape: get("shape"), overlay: get("overlay"), theme: get("theme"), background: get("background"), format: get("format") };
  const sequenceButton = get("sequence");
  const sequenceStatus = get("sequence-status");
  const motionButton = get("motion");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const descriptions = {
    hearts: "Likes flotantes: cambia la figura, el color y el tamaño; envía likes para verlos ascender.",
    goals: "Tres metas como las del LIVE: los likes, follows y regalos actualizan su propio progreso.",
    ranking: "Las tarjetas ordenan los aportes por monedas. Cambia el nombre y envía regalos para entrar al top.",
    duel: "Dos regalos, dos equipos. El regalo que envíes suma monedas al equipo elegido y cambia la ventaja.",
    alert: "Una barra de actividad inspirada en las alertas de JATSI. Cada evento muestra al participante y su acción.",
  };
  const viewNames = { hearts: "Likes flotantes", goals: "Metas del LIVE", ranking: "Top de donadores", duel: "Gift vs Gift", alert: "Alerta de actividad" };
  // These are the same currentColor silhouettes used by Desktop's floating-likes.js.
  // Only these fixed, authored SVG strings enter innerHTML; participant text never does.
  const vectors = {
    heart: '<path d="M50 88 13 52C-3 34 8 9 29 9c10 0 17 5 21 13C55 14 63 9 73 9c21 0 30 25 14 43Z" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>',
    star: '<path d="m50 6 13 28 31 4-23 22 6 31-27-15-27 15 6-31L6 38l31-4Z"/>',
    sparkle: '<path d="M50 3c5 26 15 36 45 47-30 8-40 19-45 47C43 69 33 58 5 50 33 42 43 31 50 3Z"/><path d="m80 5 3 12 12 3-12 4-3 11-4-11-11-4 11-3Z" opacity=".65"/>',
    bubble: '<circle cx="50" cy="50" r="37" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="6"/><path d="M26 44a26 26 0 0 1 18-19" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><circle cx="70" cy="70" r="4"/>',
    petal: '<path d="M82 10C43 9 8 33 12 62c3 21 25 34 44 24 25-14 30-44 26-76Z"/><path d="M26 75 67 30" fill="none" stroke="currentColor" stroke-width="3" opacity=".5"/>',
    butterfly: '<path d="M48 47C24 11 5 13 8 34c2 13 18 21 37 21-25 3-35 18-25 28 10 8 22-5 30-25 8 20 20 33 30 25 10-10 0-25-25-28 19 0 35-8 37-21 3-21-16-23-40 13Z"/><path d="M50 39v30m0-30-7-12m7 12 7-12" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
    confetti: '<path d="m18 10 29 8-15 54-29-8Zm49 21 27 16-29 47-27-16Z"/><path d="m65 4 10 10-10 10-10-10Z" opacity=".6"/>',
    music: '<path d="M41 12v53c-5-3-12-3-18 0-9 4-13 13-9 20s14 9 23 5c7-3 11-9 11-15V35l30-8v29c-5-2-11-2-17 1-9 4-13 13-9 20s14 9 23 5c7-3 11-9 11-15V2Z"/>',
    moon: '<path d="M66 6C48 34 59 65 91 74 72 99 32 98 15 68-2 38 21 2 51 3c5 0 10 1 15 3Z"/>',
  };
  const sequence = [
    { type: "like", name: "Tu comunidad", view: "hearts" },
    { type: "follow", name: "Luna", view: "alert" },
    { type: "gift", name: "Nova", gift: "star", side: "right", view: "duel" },
    { type: "gift", name: "Michi", gift: "star", side: "right", view: "ranking" },
    { type: "like", name: "Luna", view: "goals" },
    { type: "like", name: "Tu comunidad", view: "goals" },
  ];
  let state = model.initialState();
  let motionPaused = false;
  let inView = true;
  let sequenceRunning = false;
  let sequenceIndex = 0;
  let sequenceTimer = 0;
  let pulseTimer = 0;
  const particleTimers = new Map();

  const node = (tag, className, text) => {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  };
  const shapeSvg = (shape) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = vectors[shape] || vectors.heart;
    return svg;
  };

  const goalNodes = [
    ["likes", "♥", "Meta de likes"], ["follows", "✦", "Meta de follows"], ["coins", "◇", "Meta de monedas"],
  ].map(([key, icon, label]) => {
    const item = node("article", "od-widget od-goal");
    item.dataset.goal = key;
    const symbol = node("span", "od-goal-icon", icon);
    symbol.setAttribute("aria-hidden", "true");
    const copy = node("div", "od-goal-copy");
    const value = node("strong");
    const current = node("span");
    const target = node("small");
    value.append(current, target);
    const meter = node("div", "od-goal-meter");
    meter.setAttribute("role", "progressbar");
    meter.setAttribute("aria-label", label);
    meter.setAttribute("aria-valuemin", "0");
    const fill = node("i");
    meter.append(fill);
    copy.append(node("small", "", label), value, meter);
    const percentage = node("em", "od-goal-percent");
    item.append(symbol, copy, percentage);
    get("goals").append(item);
    return { key, item, current, target, meter, fill, percentage };
  });

  function renderGoals() {
    goalNodes.forEach(({ key, item, current, target, meter, fill, percentage }) => {
      const percent = model.percent(state[key], state.targets[key]);
      current.textContent = format.format(state[key]);
      target.textContent = ` / ${format.format(state.targets[key])}`;
      fill.style.width = `${percent}%`;
      percentage.textContent = percent === 100 ? "✓" : `${percent}%`;
      meter.setAttribute("aria-valuemax", String(state.targets[key]));
      meter.setAttribute("aria-valuenow", String(Math.min(state[key], state.targets[key])));
      meter.setAttribute("aria-valuetext", `${format.format(state[key])} de ${format.format(state.targets[key])}; ${percent === 100 ? "meta completada" : `${percent}%`}`);
      item.classList.toggle("is-complete", percent === 100);
      const eventKey = { like: "likes", follow: "follows", gift: "coins" }[state.lastEvent?.type];
      item.classList.toggle("is-updated", eventKey === key);
    });
  }

  function renderRanking() {
    const list = get("ranking");
    list.replaceChildren();
    state.donors.slice(0, 3).forEach((person, index) => {
      const item = node("article", "od-widget od-ranking-row");
      const updated = state.lastEvent?.type === "gift" && person.name.toLocaleLowerCase("es") === state.lastEvent.name.toLocaleLowerCase("es");
      item.classList.toggle("is-updated", updated);
      const place = node("span", "od-ranking-place", index === 0 ? "♛" : String(index + 1));
      place.setAttribute("aria-label", `Lugar ${index + 1}`);
      const avatar = node("span", "od-ranking-avatar", Array.from(person.name)[0].toLocaleUpperCase("es"));
      avatar.setAttribute("aria-hidden", "true");
      const identity = node("span", "od-ranking-person");
      identity.append(node("strong", "", person.name), node("small", "", "Comunidad de ejemplo"));
      const score = node("span", "od-ranking-score");
      score.append(node("strong", "", format.format(person.coins)), node("small", "", "MONEDAS"));
      item.append(place, avatar, identity, score);
      list.append(item);
    });
  }

  function renderDuel() {
    const { left, right } = state.duel;
    const percent = left + right ? left / (left + right) * 100 : 50;
    get("duel-left").textContent = format.format(left);
    get("duel-right").textContent = format.format(right);
    get("duel-fill").style.width = `${percent}%`;
    get("duel-meter").querySelector("span").style.left = `${percent}%`;
    get("duel-meter").setAttribute("aria-label", `Equipo Rosa: ${format.format(left)} monedas. Equipo Estrella: ${format.format(right)} monedas.`);
    get("lead-left").hidden = left <= right;
    get("lead-right").hidden = right <= left;
    root.querySelectorAll("[data-od-side]").forEach((team) => {
      const side = team.dataset.odSide;
      team.classList.toggle("is-leading", side === "left" ? left > right : right > left);
      team.classList.toggle("is-updated", state.lastEvent?.type === "gift" && state.lastEvent.side === side);
    });
    get("duel-caption").textContent = left === right ? "¡Empate! El próximo regalo puede cambiarlo todo." : `${left > right ? "Rosa" : "Estrella"} va en cabeza · Envía un regalo a tu equipo.`;
  }

  function outputDescription() {
    const event = state.lastEvent;
    if (!event) return viewNames[controls.overlay.value];
    const view = controls.overlay.value;
    if (view === "alert") return "Alerta de actividad actualizada";
    if (view === "hearts") return event.type === "like" ? "Likes flotantes +250" : "Likes sin cambios · prueba +250 likes";
    if (view === "ranking") return event.type === "gift" ? "Top reordenado por monedas" : "El ranking cambia con regalos";
    if (view === "duel") return event.type === "gift" ? "Puntuación y ventaja actualizadas" : "El duelo cambia con regalos";
    return event.type === "comment" ? "El comentario no cambia las metas" : "Progreso de la meta actualizado";
  }

  function render() {
    root.querySelectorAll("[data-od-stat]").forEach((target) => { target.textContent = format.format(state[target.dataset.odStat]); });
    renderGoals();
    renderRanking();
    renderDuel();
    const event = state.lastEvent;
    const alertLabels = { like: "LIKES RECIBIDOS", follow: "NUEVO FOLLOW", gift: "REGALO RECIBIDO", comment: "LA COMUNIDAD DICE" };
    get("alert-kicker").textContent = event ? alertLabels[event.type] : "VISTA PREVIA · NUEVO FOLLOW";
    get("alert-title").textContent = event ? event.name : "Tu comunidad";
    get("alert-copy").textContent = event ? event.copy : "Una nueva estrella se une al canal.";
    get("alert-avatar").textContent = event ? event.icon : "✦";
    get("pipeline-event").textContent = event ? event.title : "Esperando tu primer clic";
    get("pipeline-action").textContent = event ? event.action : "Preparar la reacción";
    get("pipeline-overlay").textContent = outputDescription();
    const log = get("log");
    log.replaceChildren();
    if (!state.log.length) log.append(node("li", "", "Tu primer evento aparecerá aquí."));
    state.log.forEach((item) => {
      const entry = node("li");
      entry.append(node("span", "", `#${item.number}`), document.createTextNode(item.title));
      log.append(entry);
    });
    get("log-count").textContent = `${state.events} ${state.events === 1 ? "evento" : "eventos"}`;
  }

  function clearEffects() {
    window.clearTimeout(pulseTimer);
    pulseTimer = 0;
    particleTimers.forEach((timer) => window.clearTimeout(timer));
    particleTimers.clear();
    stage.classList.remove("is-reacting");
    particles.replaceChildren();
  }

  function removeParticle(particle) {
    const timer = particleTimers.get(particle);
    if (timer !== undefined) window.clearTimeout(timer);
    particleTimers.delete(particle);
    particle.remove();
  }

  function burst() {
    if (motionPaused || reducedMotion.matches || document.hidden || !inView) return;
    const shape = controls.shape.value;
    // New bursts use only free slots; active particles always finish their trip.
    const count = Math.min(12, Math.max(0, 36 - particles.children.length));
    for (let index = 0; index < count; index += 1) {
      const particle = node("span", "od-heart-particle");
      particle.dataset.shape = shape;
      const duration = 4 * (.9 + Math.random() * .22);
      const delay = index * .08;
      particle.style.setProperty("--od-x", `${20 + Math.random() * 60}%`);
      particle.style.setProperty("--od-drift", `${Math.random() * 100 - 50}px`);
      particle.style.setProperty("--od-duration", `${duration}s`);
      particle.style.setProperty("--od-delay", `${delay}s`);
      particle.style.setProperty("--od-rotation", `${Math.random() * 40 - 20}deg`);
      particle.append(shapeSvg(shape));
      particles.append(particle);
      particle.addEventListener("animationend", () => removeParticle(particle), { once: true });
      particleTimers.set(particle, window.setTimeout(() => removeParticle(particle), (duration + delay) * 1000 + 80));
    }
  }

  function sendEvent(input) {
    state = model.applyEvent(state, input);
    render();
    window.clearTimeout(pulseTimer);
    stage.classList.remove("is-reacting");
    if (controls.overlay.value !== "hearts" && !motionPaused && !reducedMotion.matches) {
      void stage.offsetWidth;
      stage.classList.add("is-reacting");
      pulseTimer = window.setTimeout(() => { stage.classList.remove("is-reacting"); pulseTimer = 0; }, 1000);
    }
    if (input.type === "like") burst();
    get("status").textContent = `Evento ${state.events}. ${state.lastEvent.title}. ${outputDescription()}.`;
  }

  function selectView(value) {
    controls.overlay.value = value;
    stage.dataset.view = value;
    get("session-stats").hidden = value === "hearts";
    root.querySelectorAll("[data-od-view]").forEach((view) => { view.hidden = view.dataset.odView !== value; });
    get("view-description").textContent = descriptions[value];
    render();
  }

  function updateParticles() {
    stage.style.setProperty("--od-heart-color", controls.color.value);
    const size = Math.max(14, Math.min(120, Number(controls.size.value) || 38));
    stage.style.setProperty("--od-heart-size", `${size}px`);
    get("size-value").value = `${size} px`;
    // Changing the silhouette also updates particles already visible in the preview.
    particles.querySelectorAll(".od-heart-particle").forEach((particle) => {
      if (particle.dataset.shape === controls.shape.value) return;
      particle.dataset.shape = controls.shape.value;
      particle.replaceChildren(shapeSvg(controls.shape.value));
    });
  }

  function updateMotion() {
    const stopped = motionPaused || reducedMotion.matches;
    root.dataset.motion = stopped ? "off" : "on";
    motionButton.setAttribute("aria-pressed", String(stopped));
    motionButton.textContent = reducedMotion.matches ? "Movimiento reducido del sistema" : motionPaused ? "Reanudar animaciones" : "Pausar animaciones";
    motionButton.disabled = reducedMotion.matches;
    if (stopped) clearEffects();
  }

  function pauseSequence(reason) {
    window.clearTimeout(sequenceTimer);
    sequenceTimer = 0;
    const wasRunning = sequenceRunning;
    sequenceRunning = false;
    sequenceButton.setAttribute("aria-pressed", "false");
    if (sequenceIndex > 0 && sequenceIndex < sequence.length) {
      sequenceButton.textContent = "▷ Continuar LIVE de ejemplo";
      if (wasRunning) sequenceStatus.textContent = `${reason || "Ejemplo pausado"}. Paso ${sequenceIndex} de ${sequence.length}.`;
    } else sequenceButton.textContent = "▷ Ver un LIVE de ejemplo";
  }

  function runSequenceStep() {
    if (!sequenceRunning) return;
    if (document.hidden || !inView) { pauseSequence("Pausado al salir del estudio"); return; }
    if (sequenceIndex >= sequence.length) {
      pauseSequence();
      sequenceIndex = 0;
      sequenceStatus.textContent = "Ejemplo terminado. Prueba tus propios eventos o reinicia.";
      get("status").textContent = "LIVE de ejemplo terminado. Puedes seguir enviando eventos o reiniciar la simulación.";
      return;
    }
    const item = sequence[sequenceIndex];
    selectView(item.view);
    sendEvent(item);
    sequenceIndex += 1;
    sequenceStatus.textContent = `Paso ${sequenceIndex} de ${sequence.length} · ${state.lastEvent.title}`;
    sequenceTimer = window.setTimeout(runSequenceStep, 2500);
  }

  sequenceButton.addEventListener("click", () => {
    if (sequenceRunning) { pauseSequence("Ejemplo pausado"); return; }
    if (document.hidden || !inView) return;
    if (sequenceIndex >= sequence.length) sequenceIndex = 0;
    sequenceRunning = true;
    sequenceButton.textContent = "Ⅱ Pausar LIVE de ejemplo";
    sequenceButton.setAttribute("aria-pressed", "true");
    runSequenceStep();
  });
  root.querySelectorAll("[data-od-event]").forEach((button) => button.addEventListener("click", () => {
    pauseSequence("Pausado para tu interacción");
    sendEvent({ type: button.dataset.odEvent, name: controls.name.value, gift: controls.gift.value, side: controls.team.value, comment: controls.comment.value });
  }));
  controls.overlay.addEventListener("change", () => {
    pauseSequence("Pausado para explorar otro overlay");
    clearEffects();
    selectView(controls.overlay.value);
  });
  controls.theme.addEventListener("change", () => {
    root.dataset.theme = controls.theme.value;
    get("theme-caption").textContent = controls.theme.selectedOptions[0].textContent;
  });
  controls.background.addEventListener("change", () => { stage.dataset.background = controls.background.value; });
  controls.format.addEventListener("change", () => { stage.dataset.format = controls.format.value; });
  [controls.color, controls.size, controls.shape].forEach((input) => input.addEventListener("input", updateParticles));
  motionButton.addEventListener("click", () => {
    motionPaused = !motionPaused;
    if (motionPaused) pauseSequence("Pausado con las animaciones");
    updateMotion();
  });
  get("reset").addEventListener("click", () => {
    pauseSequence();
    clearEffects();
    sequenceIndex = 0;
    state = model.initialState();
    sequenceButton.textContent = "▷ Ver un LIVE de ejemplo";
    sequenceStatus.textContent = "Simulación reiniciada. El LIVE de ejemplo empieza cuando tú quieras.";
    selectView(controls.overlay.value);
    get("status").textContent = "Simulación reiniciada. 1,250 likes, 24 follows, 420 monedas y 0 eventos enviados.";
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { pauseSequence("Pausado al cambiar de pestaña"); clearEffects(); }
  });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView) { pauseSequence("Pausado al salir del estudio"); clearEffects(); }
    }, { threshold: 0 });
    observer.observe(root);
  }
  const motionChange = () => { if (reducedMotion.matches) pauseSequence("Movimiento reducido activado"); updateMotion(); };
  if (typeof reducedMotion.addEventListener === "function") reducedMotion.addEventListener("change", motionChange);
  else reducedMotion.addListener(motionChange);
  window.addEventListener("pagehide", () => { pauseSequence("Ejemplo pausado"); clearEffects(); });
  updateParticles();
  updateMotion();
  selectView("hearts");
})();
