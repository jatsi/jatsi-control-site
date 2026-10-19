import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["index.html", "privacy/index.html", "terms/index.html", "guide/index.html", "support/index.html"];
const documents = new Map(await Promise.all(pages.map(async path => [path, await readFile(resolve(root, path), "utf8")])));
const errors = [];
let checked = 0;
for (const [page, html] of documents) {
  if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) errors.push(`${page}: se espera un único h1`);
  for (const match of html.matchAll(/\b(?:href|src)="([^"\s]+)"/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|data:)/.test(href)) continue;
    if (href.startsWith("/")) { errors.push(`${page}: URL absoluta incompatible con Pages: ${href}`); continue; }
    const [localPath, fragment] = href.split("#");
    let target = resolve(root, dirname(page), decodeURIComponent(localPath.split("?")[0] || "index.html"));
    if (!localPath) target = resolve(root, page);
    if (target !== root && !target.startsWith(root + sep)) { errors.push(`${page}: enlace fuera del sitio: ${href}`); continue; }
    try {
      if ((await stat(target)).isDirectory()) target = resolve(target, "index.html");
      await stat(target);
      if (fragment && target.endsWith(".html")) {
        const text = await readFile(target, "utf8");
        if (!text.includes(`id="${decodeURIComponent(fragment)}"`)) errors.push(`${page}: destino inexistente: ${href}`);
      }
      checked++;
    } catch { errors.push(`${page}: recurso inexistente: ${href}`); }
  }
  if (!/href="[^\"]*privacy\//.test(html) || !/href="[^\"]*terms\//.test(html)) errors.push(`${page}: faltan enlaces de privacidad y términos`);
}
for (const asset of await readdir(resolve(root, "assets"))) {
  if (!asset.endsWith(".js")) continue;
  const script = await readFile(resolve(root, "assets", asset), "utf8");
  if (/\b(?:fetch|WebSocket|EventSource)\s*\(|localhost|127\.0\.0\.1/.test(script)) errors.push(`${asset}: la interacción del sitio debe funcionar sin consultas a servicios`);
}
const screenshots = (await readdir(resolve(root, "assets/screenshots"))).filter(path => path.endsWith(".webp"));
if (screenshots.length < 6) errors.push("Faltan capturas nuevas de Desktop");
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log(`Sitio independiente verificado: ${pages.length} páginas, ${screenshots.length} capturas actuales y ${checked} enlaces/recursos locales.`);
