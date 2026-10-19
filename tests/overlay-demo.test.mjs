import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const sandbox = {};
runInNewContext(await readFile(new URL("../assets/overlay-demo-model.js", import.meta.url), "utf8"), sandbox);
const model = sandbox.JatsiOverlayDemo;

test("una secuencia comparte datos entre metas, ranking y duelo sin alterar el estado anterior", () => {
  const original = model.initialState();
  const originalJSON = JSON.stringify(original);
  let state = model.applyEvent(original, { type: "like", name: "Luna" });
  state = model.applyEvent(state, { type: "follow", name: "Nova" });
  state = model.applyEvent(state, { type: "gift", name: " luna ", gift: "star", side: "right" });
  assert.equal(state.likes, original.likes + 250);
  assert.equal(state.follows, original.follows + 1);
  assert.equal(state.coins, original.coins + 100);
  assert.equal(state.duel.left, original.duel.left);
  assert.equal(state.duel.right, original.duel.right + 100);
  assert.equal(state.donors[0].name, "Luna");
  assert.equal(state.donors[0].coins, 280);
  assert.equal(state.events, 3);
  assert.equal(state.lastEvent.side, "right");
  assert.equal(JSON.stringify(original), originalJSON);
});

test("sesiones largas mantienen el historial acotado y el ranking ordenado", () => {
  let state = model.initialState();
  for (let index = 0; index < 70; index++) {
    state = model.applyEvent(state, { type: "gift", name: `Invitado ${index}`, gift: "heart", side: "left" });
  }
  assert.equal(state.log.length, 5);
  assert.equal(state.log[0].number, 70);
  assert.equal(state.log[4].number, 66);
  assert.ok(state.donors.length <= 30);
  assert.ok(state.donors.every((person, index) => !index || state.donors[index - 1].coins >= person.coins));
  const comment = model.applyEvent(state, { type: "comment", name: " ", comment: "x".repeat(150) });
  assert.equal(comment.lastComment.name, "Tu comunidad");
  assert.equal(comment.lastComment.text.length, 100);
  assert.equal(model.applyEvent(state, { type: "desconocido" }), state);
});

test("reiniciar recupera una sesión limpia y las barras nunca exceden sus límites", () => {
  const first = model.initialState();
  first.donors[0].coins = 99999;
  first.log.push({ type: "gift" });
  const reset = model.initialState();
  assert.equal(reset.donors[0].coins, 180);
  assert.equal(reset.log.length, 0);
  assert.equal(reset.events, 0);
  assert.equal(reset.lastEvent, null);
  assert.equal(model.percent(5000, 2000), 100);
  assert.equal(model.percent(-1, 2000), 0);
  assert.ok(Number.isFinite(model.percent(10, 0)));
});
