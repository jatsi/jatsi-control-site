import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../assets/style.css", import.meta.url), "utf8");

function luminance(hex) {
  const values = hex.match(/[a-f\d]{2}/gi).map(channel => {
    const value = parseInt(channel, 16) / 255;
    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  });
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
}

test("el botón principal conserva contraste legible en documentos y al pasar el cursor", () => {
  assert.match(css, /\.prose a:not\(\.button\)\{/);
  assert.match(css, /\.prose a:not\(\.button\):hover\{/);
  assert.doesNotMatch(css, /\.prose a(?::hover)?\{/);
  const normal = css.match(/\.button-primary\{([^}]+)\}/)[1];
  const hover = css.match(/\.button-primary:hover\{([^}]+)\}/)[1];
  const foreground = normal.match(/(?:^|;)color:(#[a-f\d]{6})/i)[1];
  for (const rule of [normal, hover]) {
    const background = rule.match(/(?:^|;)background:(#[a-f\d]{6})/i)[1];
    const light = Math.max(luminance(foreground), luminance(background));
    const dark = Math.min(luminance(foreground), luminance(background));
    assert.ok((light + .05) / (dark + .05) >= 4.5);
  }
});
