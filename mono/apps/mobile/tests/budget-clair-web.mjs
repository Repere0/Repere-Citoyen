// Le budget en clair, calculé (27/11/2026). Usage : node apps/mobile/tests/budget-clair-web.mjs http://localhost:8811
import { createRequire } from "node:module";
const { chromium } = createRequire(process.cwd() + "/")("playwright");
const BASE = process.argv[2] || "http://localhost:8811";
/* La mention vient de core (une phrase partagée ne s'écrit qu'à un endroit : invariants.test, « même vérité »). */
const { mentionCalcul } = await import(new URL("../../../packages/core/src/source.js", import.meta.url));
let echecs = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "ECHEC ") + m); if (!c) echecs++; };
const nav = await chromium.launch();
const erreurs = [];
const esp = t => t.replace(/[  \s]+/g, " ");
async function page(largeur = 390) {
  const c = await nav.newContext({ viewport: { width: largeur, height: 900 }, serviceWorkers: "block" });
  await c.addInitScript(() => { localStorage.setItem("repere.profil", JSON.stringify({ prenom: "Test" })); window.open = () => null; });
  const p = await c.newPage(); p.on("pageerror", e => erreurs.push(String(e))); return p;
}

{ const p = await page();
  await p.goto(BASE + "/finances#melun", { waitUntil: "networkidle" }); await p.waitForTimeout(2500);
  const b = p.getByRole("button", { name: "Expliquer simplement" });
  ok(await b.count() === 1, "Finances de Melun : un bouton « Expliquer simplement »");
  if (await b.count()) {
    ok(await b.getAttribute("aria-expanded") === "false", "replié d'abord, état annoncé");
    ok((await b.boundingBox()).height >= 44, `cible de 44 px au moins (${Math.round((await b.boundingBox()).height)} px)`);
    await b.click(); await p.waitForTimeout(300);
    const carte = esp(await p.getByTestId("explication").innerText());
    ok(carte.includes("Sur 100 € dépensés, 45 € ont payé les salaires des agents, 31 € ont servi à investir (travaux, bâtiments, équipements) et 24 € sont allés aux autres dépenses."), "la répartition calculée de Melun");
    ok(carte.includes(esp(mentionCalcul("Observatoire des finances et de la gestion publique locales (OFGL)", "29 juillet 2026"))), "la mention « Calculé par Repère », la source et sa date");
    ok(!/IA|Relu/.test(carte), "ni « IA » ni « Relu » : le texte est calculé, pas rédigé");
    ok(await p.getByTestId("explication").getByRole("link", { name: /Lire les comptes officiels/ }).count() === 1, "le lien vers les comptes officiels");
    ok(await b.getAttribute("aria-expanded") === "true", "déplié, état annoncé");
  }
  /* Les blocs détaillés et leurs mises en garde restent (décision 2 du porteur). */
  ok(esp(await p.locator("body").innerText()).includes("Une part élevée n'est pas un gaspillage") || await p.getByText(/Où vont 100 € dépensés/).count() > 0, "les blocs détaillés de Finances restent sous la carte");
  await p.context().close();
}
{ /* Une seule règle : l'accueil et Finances disent la même chose pour Barcy (avant : 6 € et 7 € de salaires). */
  const p = await page();
  await p.goto(BASE + "/chez-vous#barcy", { waitUntil: "networkidle" }); await p.waitForTimeout(2500);
  const accueil = esp(await p.locator("body").innerText());
  /* Relevé sur l'ancien build : « Salaires 6 € Investir 81 € Autres 13 € » ; Finances : 7, 81, 12. */
  ok(accueil.includes("Salaires 7 € Investir 81 € Autres 12 €"), "Barcy, « Chez vous » : 7 € de salaires, 81 € investis, 12 € d'autres, comme Finances");
  await p.context().close();
}
ok(!erreurs.length, "aucune erreur JavaScript" + (erreurs.length ? " : " + erreurs[0] : ""));
await nav.close();
console.log(echecs ? `budget-clair : ${echecs} échec(s)` : "budget-clair : zéro échec");
process.exit(echecs ? 1 : 0);
