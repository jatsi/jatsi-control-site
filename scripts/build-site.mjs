import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import "./check-site.mjs";

if (process.exitCode) process.exit(process.exitCode);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist");
if (dirname(output) !== root || basename(output) !== "dist") throw new Error("Directorio de salida inválido");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const path of ["index.html", "assets", "privacy", "terms", "guide", "support", ".nojekyll", "robots.txt", "sitemap.xml"]) {
  await cp(resolve(root, path), resolve(output, path), { recursive: true });
}
// Preserve the exact URL-verification file supplied by TikTok, when present.
for (const path of await readdir(root)) {
  if (/^tiktok[a-z\d_-]*\.txt$/i.test(path)) await cp(resolve(root, path), resolve(output, path));
}
console.log("Sitio estático listo en dist/. No contiene la aplicación ni requiere sus servicios.");
