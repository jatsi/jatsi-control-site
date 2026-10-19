# JATSI Control · sitio público independiente

Sitio de presentación, guía, ayuda, privacidad y términos de JATSI Control Desktop.
Es HTML/CSS/JavaScript estático: **no necesita Jatsi Control, Python, una API local,
WebSocket ni una sesión de TikTok** para que los visitantes puedan consultarlo.
GitHub Pages lo sirve aunque el equipo del desarrollador esté apagado.

Las seis capturas se obtuvieron de la aplicación de Windows **0.2.7** durante esta
sesión. Las demostraciones interactivas del sitio utilizan datos ilustrativos en
el navegador; no simulan una conexión real al LIVE.

## Publicación en GitHub Pages

Repositorio previsto: `https://github.com/jatsi/jatsi-control-site`.

1. Publicar este directorio como un repositorio independiente. No subir carpetas
   de la aplicación, bases de datos ni credenciales.
2. En el repositorio, abrir **Settings → Pages → Build and deployment → Source**
   y seleccionar **GitHub Actions**. Se hace una vez al habilitar el sitio.
3. El workflow de `.github/workflows/pages.yml` valida enlaces, prepara `dist/` y
   publica la web. Puede ejecutarse desde **Actions → Publicar sitio JATSI Control
   → Run workflow** o con un nuevo commit en `main`.

Dirección pública: `https://jatsi.github.io/jatsi-control-site/`.

## Comprobación local

Node.js 22 o posterior, sin instalar dependencias:

```text
npm test
npm run build
npm run preview
```

La vista previa está en `http://127.0.0.1:4180`. Es un servidor solo para revisar
los archivos estáticos; no inicia ni consulta la app Desktop.

## Estudio interactivo

La sección «Pruébalo» permite enviar likes, follows, regalos y comentarios de
ejemplo, alternar entre Likes flotantes, metas, ranking, Gift vs Gift y alertas,
y probar nueve figuras vectoriales con color y tamaño configurables. Los datos
se comparten entre las vistas y se pueden reiniciar. La secuencia guiada se
inicia manualmente y se pausa al salir de la sección o cambiar de pestaña.

Los SVG de Likes flotantes coinciden con los usados en Jatsi-Control y
Jatsi-Control-Desktop: corazones de contorno y partículas que ascienden de forma
continua, sin una caja, nombres ni contador dentro del overlay. El sitio sólo
demuestra su funcionamiento: no conecta a
TikTok, no recibe eventos reales y no guarda nombres ni comentarios.

## Registro de TikTok Login Kit

Después de confirmar la publicación, las URLs del portal serán:

| Campo | Dirección |
| --- | --- |
| Website URL | `https://jatsi.github.io/jatsi-control-site/` |
| Privacy Policy URL | `https://jatsi.github.io/jatsi-control-site/privacy/` |
| Terms of Service URL | `https://jatsi.github.io/jatsi-control-site/terms/` |

TikTok pide un sitio público con información completa, enlaces visibles de
privacidad y términos, y una demostración de la integración solicitada. Publicar
este sitio no implementa OAuth ni garantiza la aprobación.

Para verificar la propiedad, usa la verificación por **URL prefix** con la URL
completa del sitio. Descarga el archivo de firma exacto que TikTok entregue y
ponlo en la raíz de este repositorio sin cambiar nombre ni contenido. El build
incluye automáticamente archivos de verificación `tiktok*.txt`. Publica el
cambio, comprueba la URL de archivo indicada por TikTok y completa Verify en su
portal. No hay un archivo falso ni un token de verificación prellenado.

Para **Login Kit Desktop**, la dirección de retorno es un callback local de la
aplicación con puerto, `state` y PKCE. Debe implementarse en Desktop y registrarse
exactamente en el portal. **No registres la portada o una página estática como
callback de Desktop.** El código actual de autorización en la aplicación
implementa Twitch/Kick; el conector de eventos TikTok LIVE no es Login Kit.

Fuentes oficiales consultadas:

- [Registro y verificación de URLs](https://developers.tiktok.com/docs/en/getting-started-create-an-app)
- [Requisitos de revisión](https://developers.tiktok.com/docs/en/app-review-guidelines)
- [Login Kit Desktop](https://developers.tiktok.com/docs/en/login-kit-desktop)
- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

## Mantenimiento

Contenido en `index.html`, `guide/`, `support/`, `privacy/` y `terms/`. Estilos e
interacciones en `assets/`. La carpeta `dist/` es salida generada e ignorada por
Git. Los originales PNG de las capturas se conservan localmente fuera del sitio;
la web usa copias WebP optimizadas. Revisa privacidad y términos cuando cambien
las prácticas de datos o se implemente Login Kit.
