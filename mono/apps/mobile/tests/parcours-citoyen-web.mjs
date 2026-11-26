/* LE PARCOURS CITOYEN, DE BOUT EN BOUT (porteur, 26/11/2026 : « un utilisateur arrive sur l'app, cherche une ville,
 * va sur les finances, puis lance le quiz » ; « le test ultime pour éviter les régressions »).
 * Un téléphone de 390 px, sans rien sur l'appareil :
 *   1. bienvenue, puis l'accueil ; 2. recherche de « Melun », choix de la commune ;
 *   3. Finances : un montant en euros et sa source datée ; le titre de l'onglet nomme la commune ;
 *   4. Dictionnaire : « navette », puis « Me tester sur ce mot » : la première question porte sur ce mot ; on répond
 *      juste, le quiz le dit ;
 *   5. Soutenir : les trois gestes sans paiement ;
 *   6. tout du long : aucune erreur JavaScript, aucune adresse demandée ne porte un code de commune (invariant 2).
 * Usage : node apps/mobile/tests/parcours-citoyen-web.mjs http://localhost:8811 */
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
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const erreurs = [], demandees = [];
page.on("pageerror", e => erreurs.push(e.message));
page.on("request", r => demandees.push(r.url()));

/* 1. Arrivée */
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const bienvenue = page.getByTestId("barriere-bienvenue");
if (await bienvenue.isVisible().catch(() => false)) {
  await page.getByTestId("continuer-0").click();
  await page.getByLabel(/Votre prénom/).fill("Sam");
  await page.getByTestId("continuer-1").click();
  await page.getByTestId("continuer-2").click();
}
await page.getByTestId("bonjour").waitFor({ timeout: 15000 });
verifier(true, "arrivée : bienvenue passée, l'accueil dit bonjour");

/* 2. Recherche d'une ville */
if (!(await page.getByLabel(/Où habitez-vous/).isVisible())) await page.getByRole("button", { name: "Chercher une commune" }).first().click();
await page.getByLabel(/Où habitez-vous/).fill("melun");
const melun = page.getByRole("button", { name: /^Melun,/ }).first();
await melun.waitFor({ timeout: 10000 });
await melun.click();
await page.getByText("Aller plus loin").first().waitFor({ timeout: 15000 });
verifier(true, "recherche : « melun » trouve Melun, l'écran de la commune s'ouvre");

/* 3. Finances */
await page.getByRole("tab", { name: /Finances/ }).first().click();
await page.getByText(/Où va l'argent/).first().waitFor({ timeout: 15000 });
await page.waitForTimeout(1200);
const texteFinances = await page.locator("body").innerText();
verifier(/\d[\d   ]*\s?€/.test(texteFinances), "finances : un montant en euros est affiché");
verifier(/OFGL|Observatoire des finances/.test(texteFinances), "finances : la source (OFGL) est nommée");
verifier(/Melun/.test(await page.title()), `finances : le titre de l'onglet nomme la commune (« ${await page.title()} »)`);

/* 4. Du dictionnaire au quiz */
await page.goto(BASE + "/dictionnaire", { waitUntil: "networkidle" });
await page.getByLabel("Rechercher un mot du dictionnaire").fill("navette");
const carte = page.getByTestId("dico-entree").filter({ hasText: "Navette parlementaire" }).first();
await carte.waitFor({ timeout: 10000 });
await carte.getByTestId("dico-quiz").click();
await page.getByTestId("quiz-enonce").waitFor({ timeout: 10000 });
const enonce = await page.getByTestId("quiz-enonce").innerText();
verifier(/Assemblée nationale et le Sénat/.test(enonce), "quiz : la première question porte sur le mot venu du dictionnaire");
await page.getByRole("radio", { name: /^Navette parlementaire/ }).first().click();
await page.waitForTimeout(400);
verifier(await page.getByTestId("quiz-carte-juste").count() >= 1 && /Juste|juste/.test(await page.getByRole("radio", { name: /^Navette parlementaire/ }).first().getAttribute("aria-label")), "quiz : la bonne réponse est dite juste");

/* 5. Soutenir */
await page.goto(BASE + "/soutenir", { waitUntil: "networkidle" });
for (const id of ["soutien-partager", "soutien-avis", "soutien-github"]) verifier(await page.getByTestId(id).isVisible(), `soutien : le geste ${id} est là`);
verifier(await page.getByTestId("don-eteint").isVisible(), "soutien : le don reste éteint (aucun paiement)");

/* 6. Tout du long */
verifier(erreurs.length === 0, "aucune erreur JavaScript" + (erreurs.length ? " : " + erreurs.slice(0, 2).join(" | ") : ""));
verifier(!demandees.some(u => /77288|melun/i.test(new URL(u).pathname + new URL(u).search)), "aucune adresse demandée ne porte Melun ni son code (invariant 2)");

await nav.close();
if (echecs) { console.log(`parcours citoyen : ${echecs} échec(s)`); process.exit(1); }
console.log("parcours citoyen : zéro échec");
