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

})();
