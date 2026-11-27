// « Copier le lien » et le bloc « En clair » (12/11/2026). Usage : node apps/mobile/tests/en-clair-web.mjs http://localhost:8811
import { createRequire } from "node:module";
const { chromium } = createRequire(process.cwd() + "/")("playwright");
const BASE = process.argv[2] || "http://localhost:8811";
let echecs = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "ECHEC ") + m); if (!c) echecs++; };
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, permissions: ["clipboard-read", "clipboard-write"],
  /* Le service worker garderait la première réponse (fichier absent) : la donnée d'essai ne serait jamais lue. */
  serviceWorkers: "block" });
let page = await ctx.newPage();
/* 14/11/2026 : sans prénom, la barrière couvre l'application. */
await page.addInitScript(() => localStorage.setItem("repere.profil", JSON.stringify({ prenom: "Test" })));
const erreurs = []; page.on("pageerror", e => erreurs.push(String(e)));

await page.goto(BASE + "/actus#melun", { waitUntil: "networkidle" });
await page.waitForTimeout(1800);
await page.getByRole("button", { name: "Copier le lien de cette page" }).first().click();
await page.getByText("Lien copié").first().waitFor({ timeout: 5000 });
const presse = await page.evaluate(() => navigator.clipboard.readText());
ok(presse === BASE + "/actus#melun", `le lien copié porte la commune après le « # » (${presse})`);

await page.goto(BASE + "/faq", { waitUntil: "networkidle" });
/* 13/11/2026 : la FAQ est en accordéons ; la réponse s'ouvre d'un geste. */
await page.getByRole("button", { name: /Comment seront écrits les résumés/ }).click();
await page.getByText("En clair", { exact: true }).first().waitFor({ timeout: 10000 });
const t = await page.locator("body").innerText();
ok(/503 députés ont voté pour, aucun contre, et 67 se sont abstenus/.test(t), "le résumé d'exemple s'affiche");
ok(t.includes("Résumé généré avec l'aide de l'IA à partir des données officielles de l'Assemblée nationale."), "la mention d'assistance IA est écrite en toutes lettres");
ok(await page.getByRole("link", { name: /Lire le texte officiel/ }).count() === 1, "le lien vers la source est là");
const debut = t.search(/Ce texte est la première partie/);
const bloc = debut < 0 ? "" : t.slice(debut, t.indexOf("Lire le texte officiel", debut));
ok(bloc.length > 20 && !/Sénat|large majorité/.test(bloc), "rien qui ne soit dans la source (ni étape à venir, ni jugement)");
/* « EXPLIQUER SIMPLEMENT » (27/11/2026, décision 10 du porteur). Sans texte validé : AUCUN bouton (avant le 27/11 :
   « Pas encore de résumé »). Avec un texte validé pour ce scrutin (donnée d'essai servie à la place du fichier) :
   le bouton, replié ; un appui déplie la carte, avec les mentions « Généré par IA (Mistral) » et « Relu et validé ». */
const lireTexte = async () => (await page.locator("body").innerText()).replace(/\s+/g, " ");
const bouton = () => page.getByRole("button", { name: "Expliquer simplement" });
await page.goto(BASE + "/vote#melun", { waitUntil: "networkidle" }); await page.waitForTimeout(2500);
ok(await bouton().count() === 0, "sans explication validée : pas de bouton « Expliquer simplement »");
ok(!/Pas encore de résumé pour ce texte/.test(await lireTexte()), "ni phrase « pas encore » (le lien officiel est déjà sur l'écran)");
{
  /* L'écran n'écrit pas le numéro du scrutin : la donnée d'essai couvre tous ceux du catalogue publié. */
  const numeros = [...new Set([...(await (await fetch(BASE + "/data/scrutins.json")).text()).matchAll(/"n":\s*"?(\d+)/g)].map(m => m[1]))];
  ok(numeros.length > 0, `le catalogue des scrutins est lisible (${numeros.length} numéros)`);
  const essai = "DONNÉE D'ESSAI : ce texte crée une aide pour les communes.";
  const fiche = valide => ({ resume: valide ? essai : "BROUILLON À NE JAMAIS VOIR", valide, valide_le: "2026-11-27", modele: "ia:mistral-small-latest",
    source: { producteur: "Assemblée nationale", url: "https://www.assemblee-nationale.fr/dyn/17/dossiers/essai", releve_le: "2026-11-12" } });
  /* Un contexte neuf par donnée d'essai : le magasin de l'application (IndexedDB) garderait sinon la réponse
     précédente (« fichier absent »), et la donnée d'essai ne serait jamais lue. */
  const servir = async valide => {
    const c = await nav.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
    await c.addInitScript(() => localStorage.setItem("repere.profil", JSON.stringify({ prenom: "Test" })));
    await c.route("**/data/resumes-clairs.json", r => r.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ v: 1, genere_le: "2026-11-27", resumes: Object.fromEntries(numeros.map(n => ["scrutin:" + n, fiche(valide)])) }) }));
    page = await c.newPage(); page.on("pageerror", e => erreurs.push(String(e)));
  };
  await servir(true);
  /* Le détail d'un scrutin du Parlement (/scrutins) montre le même composant, mais son relevé détaillé vient de la
     collecte quotidienne : absent du build de la CI comme du conteneur, il n'est pas éprouvé ici. */
  for (const ecran of ["/vote#melun"]) {
    await page.goto(BASE + ecran, { waitUntil: "networkidle" }); await page.waitForTimeout(2500);
    const b = bouton().first();
    ok(await b.count() > 0, `${ecran} : avec une explication validée, le bouton « Expliquer simplement » apparaît`);
    if (!(await b.count())) continue;
    ok(!(await lireTexte()).includes(essai), `${ecran} : replié d'abord (le texte n'est pas encore affiché)`);
    ok(await b.getAttribute("aria-expanded") === "false", `${ecran} : état replié annoncé aux lecteurs d'écran`);
    const h = (await b.boundingBox()).height;
    ok(h >= 44, `${ecran} : cible tactile de 44 px au moins (${Math.round(h)} px)`);
    await b.click(); await page.waitForTimeout(400);
    const t = await lireTexte();
    ok(t.includes(essai), `${ecran} : un appui déplie la carte et montre l'explication`);
    ok(t.includes("Généré par IA (Mistral) à partir des données officielles de l'Assemblée nationale."), `${ecran} : mention « Généré par IA (Mistral) »`);
    ok(t.includes("Relu et validé par Repère le 27 novembre 2026."), `${ecran} : mention « Relu et validé par Repère », avec la date`);
    ok(await page.getByTestId("explication").getByRole("link", { name: /Lire le texte officiel/ }).count() === 1, `${ecran} : lien vers la source dans la carte`);
    ok(await b.getAttribute("aria-expanded") === "true", `${ecran} : état déplié annoncé`);
    await b.click(); await page.waitForTimeout(300);
    ok(!(await lireTexte()).includes(essai), `${ecran} : un second appui replie la carte`);
  }
  /* Un fichier qui ne porterait qu'un brouillon (valide: false) n'affiche rien : ni texte, ni bouton. */
  await servir(false);
  await page.goto(BASE + "/vote#melun", { waitUntil: "networkidle" }); await page.waitForTimeout(2500);
  ok(!(await lireTexte()).includes("BROUILLON") && await bouton().count() === 0, "un brouillon (valide: false) ne donne ni texte ni bouton");
}
ok(!erreurs.length, "aucune erreur JavaScript" + (erreurs.length ? " : " + erreurs[0] : ""));
await nav.close();
console.log(echecs ? `en clair : ${echecs} échec(s)` : "en clair : zéro échec");
process.exit(echecs ? 1 : 0);
