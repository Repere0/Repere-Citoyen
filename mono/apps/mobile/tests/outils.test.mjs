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

/* 27/11/2026, soir (porteur, ADR 0014) : une teinte pastel par catégorie, variante daltonienne, clair et sombre.
   La couleur ne dit jamais seule la catégorie : son nom reste écrit sur la carte (vérifié dans outils-web.mjs). */
const { TEINTES_OUTILS, NEUTRES_PAR_MODE, rapportContraste, COULEURS_VOTE, COULEURS_VOTE_DALTONIEN, COULEURS_GROUPES } = await import("../src/lib/palette.ts");

test("teintes du Hub : six catégories, dans chaque mode et chaque variante, toutes distinctes", () => {
  for (const mode of ["clair", "sombre"]) for (const v of ["normal", "daltonien"]) {
    const t = TEINTES_OUTILS[mode][v];
    assert.deepEqual(Object.keys(t), LISTE.categories, `${mode}/${v} : les six catégories, dans l'ordre fixe`);
    assert.equal(new Set(Object.values(t).map(h => h.toLowerCase())).size, 6, `${mode}/${v} : six teintes distinctes`);
  }
});

test("teintes du Hub : le pictogramme (encre) reste lisible sur sa teinte, 3:1 au moins (élément graphique, WCAG 1.4.11)", () => {
  for (const mode of ["clair", "sombre"]) for (const v of ["normal", "daltonien"]) for (const [c, h] of Object.entries(TEINTES_OUTILS[mode][v])) {
    const r = rapportContraste(NEUTRES_PAR_MODE[mode].encre, h);
    assert.ok(r >= 3, `${mode}/${v}/${c} : ${r.toFixed(2)}:1`);
  }
});

test("teintes du Hub : jamais une couleur de vote ni de groupe politique (invariant 7)", () => {
  const interdites = new Set([...Object.values(COULEURS_VOTE), ...Object.values(COULEURS_VOTE_DALTONIEN), ...Object.values(COULEURS_GROUPES)].map(h => String(h).toLowerCase()));
  for (const mode of ["clair", "sombre"]) for (const v of ["normal", "daltonien"]) for (const [c, h] of Object.entries(TEINTES_OUTILS[mode][v]))
    assert.ok(!interdites.has(h.toLowerCase()), `${mode}/${v}/${c} : ${h} sert déjà à un vote ou un groupe`);
});

test("la carte : plus de bouton « Site web », un seul lien pour toute la carte, l'application à part", () => {
  const ecran = fs.readFileSync(new URL("../src/app/(onglets)/outils.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(ecran, /texte="Site web"/, "le bouton « Site web » a disparu");
  assert.match(ecran, /testID=\{`lien-\$\{o\.id\}`\}/, "la carte entière est un lien (testID lien-<id>)");
  assert.match(ecran, /useTeinteOutil/, "la teinte suit le mode et le réglage daltonien");
});
