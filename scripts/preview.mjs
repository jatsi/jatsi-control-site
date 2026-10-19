import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".webp": "image/webp", ".png": "image/png", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8" };
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    let target = resolve(root, "." + pathname);
    if (target !== root && !target.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    if ((await stat(target)).isDirectory()) target = resolve(target, "index.html");
    response.writeHead(200, { "Content-Type": mime[extname(target)] || "application/octet-stream" });
    response.end(await readFile(target));
  } catch { response.writeHead(404).end("Página no encontrada"); }
}).listen(4180, "127.0.0.1", () => console.log("Vista previa estática: http://127.0.0.1:4180"));
