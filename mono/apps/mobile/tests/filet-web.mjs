/* LE FILET D'ERREURS ET LES DONNÉES MALFORMÉES (audit V1, 27/11/2026).
 *   1. index.json malformé (sans liste de départements) : avant, PAGE BLANCHE ; maintenant l'application s'affiche.
 *   2. Un écran qui plante au rendu (ici : un navigateur dont la comparaison de textes échoue, cas de vieux moteurs ;
 *      le dictionnaire trie ses mots au rendu) :
 *      le filet s'affiche (phrase vraie, Réessayer, Revenir à l'accueil, Signaler), jamais une page blanche ;
 *      « Réessayer », une fois la cause partie, rend l'écran ; « Signaler » ouvre la messagerie sans la commune.
 * Usage : node apps/mobile/tests/filet-web.mjs http://localhost:8811 */
import { createRequire } from "node:module";
import path from "node:path";
let chromium;
for (const racine of ["../package.json", "../../../package.json"]) {
  try { ({ chromium } = createRequire(path.resolve(import.meta.dirname, racine))("playwright")); break; } catch { /* suivant */ }
}
const BASE = process.argv[2] || "http://localhost:8811";
let echecs = 0;
const verifier = (ok, texte) => { console.log((ok ? "ok    " : "ECHEC ") + texte); if (!ok) echecs++; };
const nav = await chromium.launch();
async function contexte(script) {
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => {
    localStorage.setItem("repere.profil", JSON.stringify({ prenom: "Test", mode: "clair", alertes: [], animationsReduites: true }));
    localStorage.setItem("repere.departement", JSON.stringify({ d: "77", c: "77288" }));
  });
  if (script) await ctx.addInitScript(script);
  return ctx;
}

/* 1. Index malformé */
for (const route of ["/", "/chez-vous", "/recherche"]) {
  const ctx = await contexte();
  const page = await ctx.newPage();
  await page.route("**/data/index.json*", r => r.fulfill({ status: 200, contentType: "application/json", body: '{"v":1,"genere_le":5,"fichiers":"x"}' }));
  await page.goto(BASE + route, { waitUntil: "networkidle" }); await page.waitForTimeout(2000);
  const n = (await page.locator("body").innerText()).trim().length;
  verifier(n > 40, `index.json malformé, ${route} : l'application s'affiche (${n} caractères, avant : page blanche)`);
  await ctx.close();
}

/* 1 bis. Les fichiers arrivent mais leur lecture lève une erreur (ici : formatage des nombres en panne) : l'écran
   ne dit plus « n'a pas réussi à joindre le serveur », faux, mais que la lecture a échoué, et propose de réessayer. */
{
  const ctx = await contexte(() => { const vrai = Number.prototype.toLocaleString; Number.prototype.toLocaleString = function (...a) { if (!window.__repare) throw new Error("Intl indisponible (test)"); return vrai.apply(this, a); }; });
  const page = await ctx.newPage();
  await page.goto(BASE + "/finances#melun", { waitUntil: "networkidle" }); await page.waitForTimeout(2500);
  const t = await page.locator("body").innerText();
  verifier(!/joindre le serveur/.test(t) && /sont arrivées, mais Repère n'a pas pu les lire/.test(t), "lecture en échec : la phrase dit que le réseau a répondu (pas « joindre le serveur »)");
  verifier(await page.getByRole("button", { name: "Réessayer" }).first().isVisible(), "lecture en échec : Réessayer est proposé");
  await ctx.close();
}

/* 2. Un rendu qui plante */
const ctx = await contexte(() => {
  window.__panne = true;
  const vrai = String.prototype.localeCompare;
  String.prototype.localeCompare = function (...a) { if (window.__panne) throw new Error("Intl indisponible (test)"); return vrai.apply(this, a); };
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page); await cdp.send("Page.enable");
const navigations = []; cdp.on("Page.frameRequestedNavigation", e => navigations.push(String(e.url)));
await page.goto(BASE + "/dictionnaire", { waitUntil: "networkidle" });
const filet = page.getByTestId("filet-erreur");
await filet.waitFor({ timeout: 15000 }).catch(() => {});
verifier(await filet.isVisible(), "un écran qui plante : le filet s'affiche, pas une page blanche");
verifier(/Cet écran n'a pas pu s'afficher/.test(await filet.innerText()) && /rien n'est perdu/.test(await filet.innerText()), "le filet dit une phrase vraie et rassure sur ce qui est gardé");
for (const id of ["filet-reessayer", "filet-accueil"]) verifier(await page.getByTestId(id).isVisible(), `geste présent : ${id}`);
const h = await page.getByTestId("filet-reessayer").boundingBox();
verifier(h && h.height >= 44, `bouton Réessayer : cible de ${h && Math.round(h.height)} px`);
if (await page.getByTestId("filet-signaler").count()) {
  await page.getByTestId("filet-signaler").click(); await page.waitForTimeout(500);
  const mail = navigations.find(u => u.startsWith("mailto:")) || "";
  verifier(!!mail && /Intl%20indisponible/.test(mail) && !/melun/i.test(mail), "Signaler : la messagerie s'ouvre avec l'erreur, sans la commune");
} else verifier(true, "Signaler : absent (aucune adresse de contact au build), comme prévu");
await page.evaluate(() => { window.__panne = false; });
await page.getByTestId("filet-reessayer").click();
await page.waitForTimeout(1500);
verifier(!(await filet.isVisible().catch(() => false)) && /Dictionnaire/.test(await page.locator("body").innerText()), "Réessayer, la cause partie : l'écran revient (le dictionnaire)");
await ctx.close();

await nav.close();
if (echecs) { console.log(`filet : ${echecs} échec(s)`); process.exit(1); }
console.log("filet : zéro échec");
