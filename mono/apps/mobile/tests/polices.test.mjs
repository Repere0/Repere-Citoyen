/* POLICES DU WEB ALLÉGÉES (23/11/2026, audit pré-bêta M1) : la réduction ne doit jamais perdre un pictogramme.
   Un pictogramme absent du sous-ensemble s'affiche en carré vide, sans erreur : seule cette garde le voit. */
import test from "node:test";
import assert from "node:assert/strict";
import { caracteresTexte, nomsIonicons, sourcesApp, tableIonicons } from "../scripts/polices-web.mjs";

const table = tableIonicons();
const sources = sourcesApp();
const gardes = new Set(nomsIonicons(sources, table));

test("chaque pictogramme nommé en dur dans src/ est gardé", () => {
  const cites = new Set();
  for (const s of sources) for (const m of s.matchAll(/(?:name=|icone=|icone\()\s*\{?\s*["']([a-z0-9-]+)["']/g)) cites.add(m[1]);
  assert.ok(cites.size > 20, `trop peu de pictogrammes trouvés (${cites.size}) : la recherche est cassée`);
  const perdus = [...cites].filter(n => n in table && !gardes.has(n));
  assert.deepEqual(perdus, []);
});

test("les variantes construites (`${nom}-outline`, barre des onglets) sont gardées", () => {
  /* La barre écrit icone("rocket") puis `${nom}-outline` : seul « rocket » est écrit en toutes lettres. */
  assert.ok(nomsIonicons(['const i = icone("rocket");'], table).includes("rocket-outline"));
  for (const n of ["newspaper-outline", "business-outline", "calendar-outline", "wallet-outline"]) assert.ok(gardes.has(n), n);
});

test("la garde voit un pictogramme oublié", () => {
  assert.ok(!nomsIonicons(["const x = \"newspaper\";"], table).includes("rocket"), "un nom absent du code n'est pas gardé");
  assert.ok(nomsIonicons(["<Ionicons name=\"rocket-outline\" />"], table).includes("rocket-outline"));
});

test("les polices de texte gardent le français, l'euro et les espaces fines", () => {
  const t = caracteresTexte();
  for (const c of "àâçéèêëîïôœùûüÿÀÉÈÇŒ€«»\u00a0\u202f\u2019\u2026\u2013\u2014") assert.ok(t.includes(c), `caractère perdu : ${c} (U+${c.codePointAt(0).toString(16)})`);
});
