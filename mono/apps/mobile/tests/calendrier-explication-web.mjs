/* CALENDRIER : « EXPLIQUER SIMPLEMENT » SUR UNE SÉANCE (27/11/2026, chantier Calendrier). Agenda et explications
 * d'ESSAI injectés (page.route), jamais une donnée réelle. La séance relie son ordre du jour à des dossiers
 * législatifs ; le bouton n'apparaît que si l'un d'eux a une explication VALIDÉE, et c'est celle du dossier, jamais
 * une explication du titre de la séance (invariant 4).
 * Usage : node apps/mobile/tests/calendrier-explication-web.mjs http://localhost:8811 */
import { createRequire } from "node:module";
const { chromium } = createRequire(process.cwd() + "/")("playwright");
const BASE = process.argv[2] || "http://localhost:8811";
let echecs = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "ECHEC ") + m); if (!c) echecs++; };
const jourParis = d => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const J = k => jourParis(new Date(Date.now() + k * 864e5));
const ESSAI = "ESSAI Ce texte crée un fonds pour les communes de montagne.";
const nav = await chromium.launch();
const erreurs = [];

/* Un contexte neuf par jeu de données : le magasin (IndexedDB) garderait sinon la réponse précédente. */
async function ouvrir(valide) {
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: "block" });
  await ctx.route("**/data/agenda-an.json", r => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
    source: { producteur: "Assemblée nationale (ESSAI)", licence: "Licence ouverte", url: "https://www.assemblee-nationale.fr/dyn/agenda", releve_le: J(0) },
    evenements: [
      { debut: `${J(1)}T15:00`, titre: "ESSAI Discussion du projet de loi montagne", categorie: "Séance publique", dossiers: ["DLR5L17N8001", "DLR5L17N8002"] },
      { debut: `${J(1)}T21:30`, titre: "ESSAI Questions au Gouvernement", categorie: "Séance publique", dossiers: [] },
    ] }) }));
  await ctx.route("**/data/calendrier-senat.json", r => r.abort());
  await ctx.route("**/data/resumes-clairs.json", r => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ v: 1, genere_le: "2026-11-27",
    resumes: { DLR5L17N8002: { valide, resume: ESSAI, modele: "ia:mistral-small-latest", valide_le: "2026-11-27",
      source: { producteur: "Assemblée nationale", url: "https://www.assemblee-nationale.fr/dyn/17/dossiers/DLR5L17N8002", releve_le: "2026-11-20" } } } }) }));
  const page = await ctx.newPage();
  page.on("pageerror", e => erreurs.push(String(e.message || e).slice(0, 160)));
  await page.addInitScript(() => {
    localStorage.setItem("repere.profil", JSON.stringify({ prenom: "Test", animationsReduites: true }));
    localStorage.setItem("repere.departement", JSON.stringify({ d: "77", c: "77284" }));
  });
  await page.goto(BASE + "/a-venir", { waitUntil: "networkidle" });
  await page.getByText("ESSAI Discussion du projet de loi montagne", { exact: false }).first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(800);
  return { ctx, page };
}

{ const { ctx, page } = await ouvrir(true);
  const b = page.getByRole("button", { name: "Expliquer simplement" });
  ok(await b.count() === 1, `une explication validée pour un des dossiers : un seul bouton, sous cette séance (${await b.count()})`);
  if (await b.count()) {
    const h = (await b.boundingBox()).height;
    ok(h >= 44, `cible tactile de 44 px au moins (${Math.round(h)} px)`);
    await b.click(); await page.waitForTimeout(400);
    const t = (await page.getByTestId("explication").innerText()).replace(/\s+/g, " ");
    ok(t.includes(ESSAI), "la carte montre l'explication du DOSSIER relié (le second, le premier n'en a pas)");
    ok(t.includes("Généré par IA (Mistral)") && t.includes("Relu et validé par Repère le 27 novembre 2026"), "les mentions IA et relecture");
    ok(await page.getByTestId("explication").getByRole("link", { name: /Lire le texte officiel/ }).count() === 1, "le lien vers le dossier officiel");
  }
  await ctx.close();
}
{ const { ctx, page } = await ouvrir(false);
  ok(await page.getByRole("button", { name: "Expliquer simplement" }).count() === 0, "explication non validée (brouillon) : aucun bouton");
  await ctx.close();
}
ok(!erreurs.length, "aucune erreur JavaScript" + (erreurs.length ? " : " + erreurs[0] : ""));
await nav.close();
console.log(echecs ? `calendrier-explication : ${echecs} échec(s)` : "calendrier-explication : zéro échec");
process.exit(echecs ? 1 : 0);
