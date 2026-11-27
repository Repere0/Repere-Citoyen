/* Le Hub des outils citoyens (27/11/2026) : la liste, la détection du téléphone, la recherche, l'ordre. */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const { systemeMobile, lienApp, filtrerOutils, parCategorie, aUneApp } = await import("../src/lib/outils.ts");
const { estIos } = await import("../src/lib/installation.ts");
const LISTE = JSON.parse(fs.readFileSync(new URL("../src/lib/outils-citoyens.json", import.meta.url), "utf8"));

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36";
const PC = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
const impots = LISTE.outils.find(o => o.id === "impots");

test("la liste : les dix services demandés, chacun complet, adresses officielles en https", () => {
  assert.deepEqual(LISTE.outils.map(o => o.id).sort(), ["ameli", "ants", "caf", "france-travail", "franceconnect", "impots", "legifrance", "mes-droits-sociaux", "mon-compte-formation", "service-public"]);
  for (const o of LISTE.outils) {
    assert.ok(o.nom && o.categorie && LISTE.categories.includes(o.categorie), o.id + " : catégorie connue");
    assert.ok(/^https:\/\/(www\.)?[a-z.-]+\.(gouv\.fr|fr)$/.test(o.url_web), o.id + " : site officiel " + o.url_web);
    assert.ok(o.description_simple.split(/[.!?](\s|$)/).filter(x => x && x.trim()).length === 1, o.id + " : une phrase");
    assert.ok(o.app_store_url === null || /^https:\/\/apps\.apple\.com\/fr\/app\/id\d+$/.test(o.app_store_url), o.id + " : App Store");
    assert.ok(o.play_store_url === null || /^https:\/\/play\.google\.com\/store\/apps\/details\?id=[\w.]+$/.test(o.play_store_url), o.id + " : Play Store");
    assert.ok(!/mieux|meilleur|top|incontournable|note|score/i.test(o.description_simple), o.id + " : aucun mot de classement (invariant 3)");
  }
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(LISTE.verifie_le), "date de vérification");
});

test("Télécharger l'app : App Store sur iPhone, Play Store sur Android, site officiel ailleurs", () => {
  const sys = ua => systemeMobile(ua, estIos(ua));
  assert.equal(sys(IPHONE), "ios");
  assert.equal(sys(ANDROID), "android");
  assert.equal(sys(PC), null);
  assert.equal(lienApp(impots, "ios").url, impots.app_store_url);
  assert.equal(lienApp(impots, "android").url, impots.play_store_url);
  assert.equal(lienApp(impots, null).url, impots.url_web);
  assert.equal(lienApp({ ...impots, play_store_url: null }, "android").url, impots.url_web, "pas d'app sur ce magasin : le site");
  assert.equal(aUneApp(LISTE.outils.find(o => o.id === "franceconnect")), false, "sans app : bouton masqué");
});

test("recherche sans accents ni majuscules, sur le nom, la description et la catégorie", () => {
  assert.deepEqual(filtrerOutils(LISTE.outils, "IMPOT").map(o => o.id), ["impots"]);
  assert.ok(filtrerOutils(LISTE.outils, "santé").some(o => o.id === "ameli"));
  assert.ok(filtrerOutils(LISTE.outils, "passeport").some(o => o.id === "ants"));
  assert.equal(filtrerOutils(LISTE.outils, "zzz").length, 0);
  assert.equal(filtrerOutils(LISTE.outils, "  ").length, LISTE.outils.length);
});

test("ordre fixe des catégories, alphabétique dans chacune : pas un classement", () => {
  const g = parCategorie(LISTE.outils, LISTE.categories);
  assert.deepEqual(g.map(x => x.categorie), LISTE.categories);
  for (const x of g) assert.deepEqual(x.outils.map(o => o.nom), [...x.outils.map(o => o.nom)].sort((a, b) => a.localeCompare(b, "fr")));
  assert.deepEqual(parCategorie(filtrerOutils(LISTE.outils, "impot"), LISTE.categories).map(x => x.categorie), ["Impôts"], "catégorie vide cachée");
});
