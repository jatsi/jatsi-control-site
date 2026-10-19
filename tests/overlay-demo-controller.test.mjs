import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const modelSource = readFileSync(new URL("../assets/overlay-demo-model.js", import.meta.url), "utf8");
const controllerSource = readFileSync(new URL("../assets/overlay-demo.js", import.meta.url), "utf8");

// This small DOM double checks controller behavior and lifecycle, not layout or
// browser rendering. Native inputs/buttons remain responsible for keyboard UX.
function studio() {
  const elements = [];
  const markupWrites = [];
  class Element {
    constructor(tag) {
      this.tagName = tag.toLowerCase();
      this.children = [];
      this.attributes = new Map();
      this.dataset = {};
      this.style = { values: {}, setProperty: (name, value) => { this.style.values[name] = value; } };
      this.events = new Map();
      this.className = "";
      this._text = "";
      this._html = "";
      this.hidden = false;
      this.value = "";
      this.disabled = false;
      elements.push(this);
      this.classList = {
        add: (...names) => { this.className = [...new Set([...this.className.split(" ").filter(Boolean), ...names])].join(" "); },
        remove: (...names) => { this.className = this.className.split(" ").filter((name) => !names.includes(name)).join(" "); },
        toggle: (name, enabled) => {
          const wanted = enabled === undefined ? !this.className.split(" ").includes(name) : enabled;
          this.classList[wanted ? "add" : "remove"](name);
        },
      };
    }
    get textContent() { return this._text + this.children.map((child) => child.textContent).join(""); }
    set textContent(value) { this._text = String(value); this.children = []; }
    set innerHTML(value) { this._html = value; markupWrites.push(value); }
    get innerHTML() { return this._html; }
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
      if (name === "class") this.className = value;
      if (name === "value") this.value = value;
      if (name === "hidden") this.hidden = true;
      if (name.startsWith("data-")) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
    }
    getAttribute(name) { return this.attributes.get(name); }
    append(...items) { for (const child of items) { child.parent = this; this.children.push(child); } }
    replaceChildren(...items) { this._text = ""; this.children = []; this.append(...items); }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this); }
    get firstElementChild() { return this.children[0]; }
    get selectedOptions() { return this.children.filter((child) => child.tagName === "option" && child.value === this.value); }
    get offsetWidth() { return 700; }
    addEventListener(name, callback) {
      const handlers = this.events.get(name) || [];
      handlers.push(callback);
      this.events.set(name, handlers);
    }
    dispatch(name) { (this.events.get(name) || []).forEach((callback) => callback({ target: this })); }
    matches(selector) {
      if (selector.startsWith(".")) return this.className.split(" ").includes(selector.slice(1));
      if (selector.startsWith("[")) return this.attributes.has(selector.slice(1, -1));
      return this.tagName === selector;
    }
    querySelectorAll(selector) {
      return this.children.flatMap((child) => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  }
  const document = new Element("document");
  document.hidden = false;
  const stack = [document];
  const voidTags = new Set(["meta", "link", "img", "input", "br", "hr"]);
  for (const match of html.matchAll(/<\/?[a-z][^>]*>|[^<]+/gi)) {
    const token = match[0];
    if (token.startsWith("</")) {
      const tag = token.match(/^<\/([\w-]+)/)[1];
      let index = stack.length - 1;
      while (index > 0 && stack[index].tagName !== tag) index -= 1;
      if (index > 0) stack.length = index;
    } else if (token.startsWith("<")) {
      const tag = token.match(/^<([\w-]+)/)[1];
      const item = new Element(tag);
      for (const attribute of token.slice(tag.length + 1, -1).matchAll(/([^\s=/>]+)(?:="([^"]*)")?/g)) item.setAttribute(attribute[1], attribute[2] || "");
      stack.at(-1).append(item);
      if (!voidTags.has(tag) && !token.endsWith("/>")) stack.push(item);
    } else stack.at(-1)._text += token;
  }
  for (const select of elements.filter((item) => item.tagName === "select")) {
    const options = select.children.filter((item) => item.tagName === "option");
    select.value = (options.find((item) => item.attributes.has("selected")) || options[0])?.value;
  }
  document.createElement = (tag) => new Element(tag);
  document.createElementNS = (_, tag) => new Element(tag);
  document.createTextNode = (text) => { const item = new Element("text"); item.textContent = text; return item; };
  let now = 0;
  let timerId = 0;
  const timers = new Map();
  const motion = { matches: false, addEventListener(_, callback) { this.listener = callback; } };
  let intersectionCallback;
  const window = {
    matchMedia: () => motion,
    setTimeout(callback, delay) { timers.set(++timerId, { callback, at: now + delay }); return timerId; },
    clearTimeout: (id) => timers.delete(id),
    addEventListener() {},
    IntersectionObserver: class { constructor(callback) { intersectionCallback = callback; } observe() {} },
  };
  const context = vm.createContext({ window, document, IntersectionObserver: window.IntersectionObserver, Intl });
  vm.runInContext(modelSource, context);
  window.JatsiOverlayDemo = context.JatsiOverlayDemo;
  vm.runInContext(controllerSource, context);
  const root = document.querySelector("[data-overlay-studio]");
  const get = (name) => root.querySelector(`[data-od-${name}]`);
  return {
    root, get, document, timers, motion, markupWrites,
    click: (type) => root.querySelectorAll("[data-od-event]").find((item) => item.dataset.odEvent === type).dispatch("click"),
    stat: (name) => root.querySelectorAll("[data-od-stat]").find((item) => item.dataset.odStat === name).textContent,
    intersect: (visible) => intersectionCallback([{ isIntersecting: visible }]),
    advance(milliseconds) {
      const target = now + milliseconds;
      let iterations = 0;
      while (true) {
        const entry = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (!entry || entry[1].at > target) break;
        assert.ok(++iterations < 100, "el controlador no debe crear un bucle de timers");
        now = entry[1].at;
        timers.delete(entry[0]);
        entry[1].callback();
      }
      now = target;
    },
  };
}

test("el estudio limita las partículas y aplica SVG, color y tamaño sin interpretar datos del usuario", () => {
  const app = studio();
  assert.equal(app.stat("likes"), "1,250");
  assert.equal(app.root.querySelectorAll("[data-od-view]").filter((view) => !view.hidden).length, 1);
  app.get("name").value = "<img src=x onerror=MALICIOUS>";
  app.click("like");
  assert.equal(app.stat("likes"), "1,500");
  assert.match(app.get("pipeline-event").textContent, /MALICIOUS/);
  assert.ok(app.markupWrites.every((markup) => !markup.includes("MALICIOUS")));
  assert.equal(app.get("particles").children.length, 12);
  for (let index = 0; index < 15; index += 1) app.click("like");
  assert.equal(app.get("particles").children.length, 36);
  assert.ok(app.timers.size <= 2, "ráfagas repetidas comparten los timers de limpieza");
  for (const [control, value] of [["color", "#00ff00"], ["size", "120"], ["shape", "butterfly"]]) {
    app.get(control).value = value;
    app.get(control).dispatch("input");
  }
  assert.equal(app.get("stage").style.values["--od-heart-color"], "#00ff00");
  assert.equal(app.get("stage").style.values["--od-heart-size"], "120px");
  assert.equal(app.get("size-value").value, "120 px");
  assert.match(app.get("particles").children[0].children[0].innerHTML, /M48 47/);
  app.get("reset").dispatch("click");
  assert.equal(app.stat("events"), "0");
  assert.equal(app.stat("likes"), "1,250");
  assert.equal(app.get("particles").children.length, 0);
  assert.equal(app.timers.size, 0);
});

test("el LIVE requiere play, pausa al salir y al cambiar de pestaña, y reset cancela la secuencia", () => {
  const app = studio();
  app.advance(30000);
  assert.equal(app.stat("events"), "0", "no hay autoplay");
  app.get("sequence").dispatch("click");
  assert.equal(app.stat("events"), "1");
  app.advance(2500);
  assert.equal(app.stat("events"), "2");
  app.document.hidden = true;
  app.document.dispatch("visibilitychange");
  app.advance(30000);
  assert.equal(app.stat("events"), "2");
  assert.equal(app.timers.size, 0);
  app.document.hidden = false;
  app.document.dispatch("visibilitychange");
  app.advance(10000);
  assert.equal(app.stat("events"), "2", "volver a la pestaña no reanuda el LIVE");
  app.get("sequence").dispatch("click");
  app.advance(10000);
  assert.equal(app.stat("events"), "6");
  assert.equal(app.stat("likes"), "2,000");
  assert.equal(app.get("sequence").getAttribute("aria-pressed"), "false");
  app.advance(5000); // Allow the final bounded particle animation to finish.
  assert.equal(app.timers.size, 0);
  app.get("sequence").dispatch("click");
  app.intersect(false);
  assert.equal(app.timers.size, 0);
  app.intersect(true);
  app.advance(10000);
  assert.equal(app.stat("events"), "7");
  app.get("sequence").dispatch("click");
  app.get("reset").dispatch("click");
  app.advance(30000);
  assert.equal(app.stat("events"), "0");
  assert.equal(app.timers.size, 0);
});

test("las vistas y preferencias cambian localmente y reducir movimiento conserva los eventos", () => {
  const app = studio();
  for (const [control, value] of [["overlay", "ranking"], ["theme", "garden"], ["background", "transparent"], ["format", "portrait"]]) {
    app.get(control).value = value;
    app.get(control).dispatch("change");
  }
  assert.equal(app.root.dataset.theme, "garden");
  assert.equal(app.get("stage").dataset.background, "transparent");
  assert.equal(app.get("stage").dataset.format, "portrait");
  assert.equal(app.root.querySelectorAll("[data-od-view]").filter((view) => !view.hidden).length, 1);
  app.get("motion").dispatch("click");
  app.click("like");
  assert.equal(app.root.dataset.motion, "off");
  assert.equal(app.get("particles").children.length, 0);
  assert.equal(app.stat("likes"), "1,500");
  app.get("motion").dispatch("click");
  app.motion.matches = true;
  app.motion.listener();
  app.click("like");
  assert.equal(app.get("particles").children.length, 0);
  assert.equal(app.get("motion").disabled, true);
  assert.equal(app.stat("likes"), "1,750");
});
