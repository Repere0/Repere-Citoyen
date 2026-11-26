/* FONDU ENTRE ÉCRANS ET RETOUR D'APPUI (porteur, 26/11/2026 : « transitions douces sur les boutons, les cartes et les
 * changements d'écran »). Sur le web, entrer dans un écran de la pile fond le contenu en 200 ms ; passer d'un onglet à
 * l'autre ne double pas le fondu des onglets ; « Réduire les animations » coupe tout ; et les boutons ont une
 * transition CSS de 200 ms.
 * Usage : node apps/mobile/tests/fondu-web.mjs http://localhost:8811 */
import { createRequire } from "node:module";
const { chromium } = createRequire(process.cwd() + "/")("playwright");
const BASE = process.argv[2] || "http://localhost:8811";
let echecs = 0;
const verifier = (ok, texte) => { console.log((ok ? "ok    " : "ECHEC ") + texte); if (!ok) echecs++; };
const nav = await chromium.launch();
async function ouvrir(reduit) {
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(r => {
    localStorage.setItem("repere.profil", JSON.stringify({ prenom: "Test", mode: "clair", alertes: [], animationsReduites: r }));
    localStorage.setItem("repere.departement", JSON.stringify({ d: "77", c: "77284" }));
    window.__fondus = 0;
    const animer = Element.prototype.animate;
    Element.prototype.animate = function (...a) { if (this.getAttribute && this.getAttribute("data-testid") === "pile") window.__fondus++; return animer.apply(this, a); };
  }, reduit);
  const page = await ctx.newPage();
  await page.goto(BASE + "/chez-vous", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  return { ctx, page };
}
{
  const { ctx, page } = await ouvrir(false);
  const avant = await page.evaluate(() => window.__fondus);
  await page.getByRole("tab", { name: /Qui décide/ }).first().click();
  await page.waitForTimeout(400);
  verifier(await page.evaluate(() => window.__fondus) === avant, "changer d'onglet : pas de second fondu (les onglets ont le leur)");
  await page.getByRole("link", { name: "Réglages", exact: true }).first().click();
  await page.waitForTimeout(400);
  verifier(await page.evaluate(() => window.__fondus) === avant + 1, "entrer dans Réglages : le contenu fond une fois");
  const transition = await page.getByRole("switch").first().evaluate(e => getComputedStyle(e).transitionDuration);
  verifier(/0\.2s|200ms/.test(transition), `un interrupteur a sa transition de 200 ms (${transition})`);
  await ctx.close();
}
{
  const { ctx, page } = await ouvrir(true);
  await page.getByRole("link", { name: "Réglages", exact: true }).first().click();
  await page.waitForTimeout(400);
  verifier(await page.evaluate(() => window.__fondus) === 0, "Réduire les animations : aucun fondu");
  await ctx.close();
}
await nav.close();
if (echecs) { console.log(`${echecs} échec(s)`); process.exit(1); }
console.log("fondu-web : tout est vert");
