/* L'EXPLICATION CALCULÉE DES BUDGETS (porteur, 27/11/2026 : sans IA). Tranche 1 : UNE règle pour la répartition de
   100 € dépensés, partagée par Finances, l'accueil et le bureau. Mesuré avant ce test : 46 communes d'IDF sur 1 262
   affichaient 1 € d'écart entre l'accueil (montants par habitant arrondis) et Finances (montants totaux) ; le bureau
   arrondissait chaque part à part (total 99 ou 101 possible). Données réelles : celles qu'extrait la CI. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { repartitionDepenses, chiffresComptes, dernierExercice } from "../packages/core/src/index.js";

const IDF = ["75", "77", "78", "91", "92", "93", "94", "95"];
const index = JSON.parse(fs.readFileSync("data/index.json", "utf8"));
const communes = IDF.flatMap(d => Object.entries(JSON.parse(fs.readFileSync(`data/departments/${d}.json`, "utf8")).communes || {}));
const dernier = c => { const e = dernierExercice(c, index.agregats); return e ? e.ex : null; };

test("Barcy : la répartition se calcule sur les montants, et fait 100", () => {
  const c = Object.fromEntries(communes)["77023"];
  assert.ok(c, "Barcy est dans les données");
  assert.deepEqual(repartitionDepenses(dernier(c)), { sal: 7, inv: 81, aut: 12 }, "7 € de salaires, comme Finances (l'accueil disait 6)");
});

test("toutes les communes d'IDF : une seule règle, la même que Finances, toujours 100", () => {
  let n = 0;
  for (const [insee, c] of communes) {
    const ex = dernier(c); if (!ex) continue;
    const r = repartitionDepenses(ex), f = chiffresComptes(ex);
    if (f.partSalaires === null || f.partInvestissement === null || f.partSalaires + f.partInvestissement > 100) { assert.equal(r, null, insee); continue; }
    n++;
    assert.equal(r.sal, f.partSalaires, insee); assert.equal(r.inv, f.partInvestissement, insee);
    assert.equal(r.sal + r.inv + r.aut, 100, insee);
    assert.ok(r.aut >= 0, insee);
  }
  assert.ok(n > 1200, `${n} communes vérifiées`);
});

test("rien d'inventé : sans dépenses, sans salaires ou sans investissement, pas de répartition", () => {
  assert.equal(repartitionDepenses(null), null);
  assert.equal(repartitionDepenses([100, 1000, 10, null, null, 100, 1, 50, 1]), null, "dépenses absentes");
  assert.equal(repartitionDepenses([100, 1000, 10, 0, 0, 100, 1, null, null]), null, "salaires absents");
});

test("les trois écrans lisent la même règle, aucun ne refait le calcul", () => {
  /* 27/11/2026 : « Chez vous » ajouté après coup, trouvé par budget-clair-web (Barcy : 6 € contre 7 €). */
  for (const f of ["apps/mobile/src/app/index.tsx", "apps/mobile/src/ui/bureau/tableau-de-bord.tsx", "apps/mobile/src/ui/ecran-argent.tsx", "apps/mobile/src/app/(onglets)/chez-vous.tsx"]) {
    const s = fs.readFileSync(f, "utf8");
    assert.match(s, /repartitionDepenses/, `${f} utilise repartitionDepenses`);
    assert.doesNotMatch(s, /\/ argent\.depenses \* 100|p\.valeur \/ dep \* 100|100 - ch\.partSalaires - ch\.partInvestissement|\/ hab\.depenses \* 100/, `${f} ne refait pas le calcul`);
  }
});

/* TRANCHE 2 : le texte. Une règle fixe, éprouvée sur toutes les communes ; aucun qualificatif, aucune comparaison,
   un agrégat absent fait disparaître sa phrase (jamais un zéro inventé). */
const { explicationBudget } = await import("../packages/core/src/index.js");
const { JUGEMENT_CHIFFRES, JUGEMENT_RESUME } = await import("../packages/data-utils/src/invariants.js");
const esp = t => t.replace(/[  ]/g, " ");

/* 27/11/2026, soir (porteur) : DEUX PHRASES AU PLUS — le total par habitant, puis ce que ce chiffre n'est pas.
   Le détail des 100 €, les impôts et la dette restent dans les blocs de Finances, sous la carte. */
const { PAS_LE_FOYER } = await import("../packages/core/src/index.js");
const phrases = t => esp(t).split(/(?<=\.) (?=[A-ZÀ-Ý])/);

test("Melun 2025 : les deux phrases exactes", () => {
  const c = Object.fromEntries(communes)["77288"];
  assert.equal(esp(explicationBudget(dernier(c), { nom: "Melun", an: "2025" })),
    "En 2025, Melun a dépensé 109,6 millions d'euros, soit 2 495 € par habitant. "
    + "C'est la dépense de la commune, rapportée à chaque habitant, pas ce que paie votre foyer.");
});

/* 27/11/2026, 20:13 (porteur) : la phrase du foyer n'est plus sous le grand chiffre ; elle ne vit que dans la carte
   dépliée, pour ne pas la lire deux fois de suite. */
test("la phrase du foyer ne vit que dans la carte « Expliquer simplement »", () => {
  assert.equal(PAS_LE_FOYER, "C'est la dépense de la commune, rapportée à chaque habitant, pas ce que paie votre foyer.");
  const ecran = fs.readFileSync(new URL("../apps/mobile/src/ui/ecran-argent.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(ecran, /PAS_LE_FOYER|pas ce que paie votre foyer/, "ni la constante ni une copie sous le grand chiffre");
});

test("sans montant par habitant : une phrase vraie, jamais « 0 € par habitant » ; sans dépenses, pas de texte", () => {
  /* [pop, rec, recH, dep, depH, dette, detteH, inv, invH, sal, salH, imp, impH] */
  const sansHab = [1000, 500000, 500, 400000, null, null, null, 100000, 100, 200000, 200, null, null];
  assert.equal(esp(explicationBudget(sansHab, { nom: "Exemple", an: "2025" })),
    "En 2025, Exemple a dépensé 400 000 €. Ce total couvre toutes les dépenses de la commune, pas ce que paie votre foyer.");
  const avecHab = [1000, 500000, 500, 400000, 400, null, null, 100000, 100, 200000, 200, null, null];
  assert.match(esp(explicationBudget(avecHab, { nom: "Exemple", an: "2025" })), /^En 2025, Exemple a dépensé 400 000 €, soit 400 € par habitant\. C'est la dépense/);
  assert.equal(explicationBudget([1000, 500000, 500, null, null, null, null, null, null, null, null, null, null], { nom: "X", an: "2025" }), null);
  assert.equal(explicationBudget(null, { nom: "X", an: "2025" }), null);
});

test("toutes les communes d'IDF : deux phrases au plus, ni 100 €, ni impôts, ni dette ; aucun mot qui juge", () => {
  let n = 0;
  for (const [insee, c] of communes) {
    const ex = dernier(c); if (!ex) continue;
    const t = explicationBudget(ex, { nom: c.nom, an: "2025" });
    if (!t) continue; n++;
    assert.ok(phrases(t).length <= 2, `${insee} : ${phrases(t).length} phrases`);
    assert.doesNotMatch(esp(t), /Sur 100 €|impôts|dette/, insee);
    assert.doesNotMatch(esp(t), / 0 € par habitant/, insee);
    for (const re of [JUGEMENT_CHIFFRES, JUGEMENT_RESUME]) { re.lastIndex = 0; const m = t.match(re); assert.equal(m, null, `${insee} : « ${m} »`); }
    assert.doesNotMatch(t, /’/, "pas d'apostrophe typographique");
  }
  assert.ok(n > 1200, `${n} textes`);
});

test("la mention du calcul : qui publie, quand, et que Repère a calculé ; jamais « IA »", async () => {
  const { mentionCalcul } = await import("../packages/core/src/index.js");
  assert.equal(mentionCalcul("Observatoire des finances et de la gestion publique locales (OFGL)", "29 juillet 2026"),
    "Calculé par Repère à partir des comptes publiés par l'Observatoire des finances et de la gestion publique locales (OFGL), mis à jour le 29 juillet 2026.");
  assert.equal(mentionCalcul("OFGL", null), "Calculé par Repère à partir des comptes publiés par l'OFGL.");
  assert.doesNotMatch(mentionCalcul("OFGL", null), /IA|relu/i);
});

/* 27/11/2026, vu à l'œil sur la capture à 390 px : un nombre en bout de ligne, son « € » à la ligne suivante.
   Un nombre et son « € » ne se séparent jamais : espace insécable. */
test("un nombre ne se sépare jamais de son « € »", () => {
  const t = explicationBudget(dernier(Object.fromEntries(communes)["77288"]), { nom: "Melun", an: "2025" });
  assert.doesNotMatch(t, /\d €/, "espace ordinaire entre un nombre et €");
  assert.match(esp(t), /2 495 € par habitant/);
});
