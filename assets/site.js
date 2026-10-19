/* Everything on this page runs locally. No account, service or network request is used. */
(() => {
  "use strict";

  const dialog = document.querySelector(".image-dialog");
  let lastGalleryLink = null;
  if (dialog && typeof dialog.showModal === "function") {
    const image = dialog.querySelector("img");
    const caption = dialog.querySelector("figcaption");
    const close = dialog.querySelector(".dialog-close");
    document.querySelectorAll("[data-gallery]").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        lastGalleryLink = link;
        image.src = link.href;
        image.alt = link.querySelector("img")?.alt || "Captura de JATSI Control Desktop";
        caption.textContent = link.dataset.caption || image.alt;
        dialog.showModal();
        document.body.classList.add("dialog-open");
        close.focus();
      });
    });
    close.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      const box = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("dialog-open");
      lastGalleryLink?.focus({ preventScroll: true });
    });
  }

  const scene = document.querySelector("[data-live-scene]");
  if (!scene) return;
  const buttons = document.querySelectorAll("[data-demo-event]");
  const likes = document.querySelector("[data-demo-likes]");
  const follows = document.querySelector("[data-demo-follows]");
  const gifts = document.querySelector("[data-demo-gifts]");
  const goal = document.querySelector("[data-goal-fill]");
  const eventTitle = document.querySelector("[data-event-title]");
  const announcer = document.querySelector("[data-demo-status]");
  const particles = document.querySelector("[data-particles]");
  const motionToggle = document.querySelector(".motion-toggle");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const count = { likes: 1250, follows: 24, gifts: 8 };
  const format = new Intl.NumberFormat("es-MX");
  let clearFlash;
  let motionPaused = false;
  let announcementCount = 0;

  function celebrate(symbol, color) {
    if (reducedMotion.matches || motionPaused) return;
    // Bound the decorative nodes even if somebody clicks very quickly.
    while (particles.children.length > 24) particles.firstElementChild.remove();
    for (let index = 0; index < 7; index += 1) {
      const particle = document.createElement("span");
      particle.className = "demo-particle";
      particle.textContent = symbol;
      particle.style.setProperty("--left", `${18 + Math.random() * 65}%`);
      particle.style.setProperty("--drift", `${Math.random() * 100 - 50}px`);
      particle.style.setProperty("--delay", `${index * 0.06}s`);
      particle.style.color = color;
      particles.append(particle);
      particle.addEventListener("animationend", () => particle.remove(), { once: true });
      // Cleanup also works if effects get paused while a particle is active.
      window.setTimeout(() => particle.remove(), 2600);
    }
  }

  buttons.forEach((button) => button.addEventListener("click", () => {
    const kind = button.dataset.demoEvent;
    let message;
    if (kind === "like") {
      count.likes = Math.min(5000, count.likes + 250);
      message = count.likes === 5000 ? "¡Meta de ejemplo completada!" : "¡250 likes para este universo!";
      celebrate("♡", "#f0a3df");
    } else if (kind === "follow") {
      count.follows += 1;
      message = "Una nueva estrella se une al canal.";
      celebrate("＋", "#bba4ff");
    } else if (kind === "gift") {
      count.gifts += 1;
      message = "¡Un regalo ilumina la escena!";
      celebrate("✦", "#9be4d3");
    } else return;
    likes.textContent = format.format(count.likes);
    follows.textContent = format.format(count.follows);
    gifts.textContent = format.format(count.gifts);
    goal.style.width = `${Math.min(100, count.likes / 50)}%`;
    eventTitle.textContent = message;
    scene.classList.remove("event-like", "event-follow", "event-gift", "is-flaring");
    scene.classList.add(`event-${kind}`);
    // Restart only the brief reaction; background motion never drives live events.
    void scene.offsetWidth;
    scene.classList.add("is-flaring");
    window.clearTimeout(clearFlash);
    clearFlash = window.setTimeout(() => scene.classList.remove("is-flaring"), 750);
    announcementCount += 1;
    announcer.textContent = `Demostración ${announcementCount}. ${message} Likes: ${format.format(count.likes)} de 5,000. Seguidores de ejemplo: ${count.follows}. Regalos de ejemplo: ${count.gifts}.`;
  }));

  if (motionToggle) {
    motionToggle.hidden = false;
    motionToggle.addEventListener("click", () => {
      motionPaused = !motionPaused;
      document.body.classList.toggle("motion-paused", motionPaused);
      motionToggle.setAttribute("aria-pressed", String(motionPaused));
      motionToggle.innerHTML = motionPaused ? 'Reanudar animaciones <span aria-hidden="true">▷</span>' : 'Pausar animaciones <span aria-hidden="true">Ⅱ</span>';
      if (motionPaused) particles.replaceChildren();
    });
  }
})();
