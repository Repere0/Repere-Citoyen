/* Installer Repère sur l'écran d'accueil (27/11/2026) : qui voit l'invitation, et laquelle. */
import { test } from "node:test";
import assert from "node:assert/strict";
const { installationPossible, estIos } = await import("../src/lib/installation.ts");

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
const IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36";
const base = { autonome: false, invite: false, large: false };

test("iPhone et iPad (qui se dit Mac, mais tactile) : le geste à montrer", () => {
  assert.equal(installationPossible({ ...base, ua: IPHONE }), "ios");
  assert.equal(installationPossible({ ...base, ua: IPAD, plateforme: "MacIntel", pointsTactiles: 5 }), "ios");
  assert.equal(estIos(IPAD, "MacIntel", 0), false, "un vrai Mac n'est pas un iPad");
});

test("Android : seulement si le navigateur a proposé l'installation", () => {
  assert.equal(installationPossible({ ...base, ua: ANDROID, invite: true }), "android");
  assert.equal(installationPossible({ ...base, ua: ANDROID }), null, "sans invitation du navigateur, rien à proposer");
});

test("jamais une fois installée, jamais sur ordinateur", () => {
  assert.equal(installationPossible({ ...base, ua: IPHONE, autonome: true }), null);
  assert.equal(installationPossible({ ...base, ua: ANDROID, invite: true, autonome: true }), null);
  assert.equal(installationPossible({ ...base, ua: IPHONE, large: true }), null);
  assert.equal(installationPossible({ ...base, ua: "Mozilla/5.0 (X11; Linux x86_64) Chrome/131.0" }), null);
});
