/* ALERTES LOCALES (ADR 0013, 25/11/2026) : une proposition douce sur l'accueil tant que `alertes` vaut null ;
 * « Non merci » écrit [] et la proposition ne revient pas ; « Choisir mes sujets » ouvre les Réglages, dont les
 * interrupteurs écrivent dans repere.profil. Aucune clé de stockage ajoutée.
 * Usage : node apps/mobile/tests/alertes-web.mjs http://localhost:8811 */
import { createRequire } from "node:module";
const { chromium } = createRequire(process.cwd() + "/")("playwright");
const BASE = process.argv[2] || "http://localhost:8811";
let echecs = 0;
const verifier = (ok, texte) => { console.log((ok ? "ok    " : "ECHEC ") + texte); if (!ok) echecs++; };
const navigateur = await chromium.launch();
const PROFIL = { prenom: "Test", niveauZoom: "france", tailleTexte: 16, espacement: 1.5, contraste: "normal", policeDyslexie: false,
  animationsReduites: true, modeDaltonien: false, masquerImages: false, themes: [], mode: "clair" };
const nouveau = async () => {
  const contexte = await navigateur.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await contexte.addInitScript(p => { if (!localStorage.getItem("repere.profil")) localStorage.setItem("repere.profil", JSON.stringify(p)); }, PROFIL);
  const page = await contexte.newPage();
  const erreurs = []; page.on("pageerror", e => erreurs.push(String(e.message || e).slice(0, 160)));
  return { contexte, page, erreurs };
};
const profil = page => page.evaluate(() => JSON.parse(localStorage.getItem("repere.profil") || "null"));

{
  const { contexte, page, erreurs } = await nouveau();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.getByTestId("alertes-proposition").waitFor({ timeout: 15000 });
  verifier(true, "jamais demandé : la proposition est sur l'accueil");
  await page.getByTestId("alertes-refuser").click(); await page.waitForTimeout(400);
  verifier(JSON.stringify((await profil(page)).alertes) === "[]", "« Non merci » écrit alertes=[]");
  await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(800);
  verifier(await page.getByTestId("alertes-proposition").count() === 0, "après rechargement, la proposition ne revient pas");
  verifier(erreurs.length === 0, "refus : aucune erreur JavaScript" + (erreurs.length ? " (" + erreurs[0] + ")" : ""));
  await contexte.close();
}
{
  const { contexte, page, erreurs } = await nouveau();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.getByTestId("alertes-choisir").click();
  await page.getByRole("switch", { name: /^Budgets/ }).waitFor({ timeout: 10000 });
  verifier(JSON.stringify((await profil(page)).alertes) === JSON.stringify(["votes", "budgets", "elections", "actus"]), "« Choisir mes sujets » : les quatre sujets, puis les Réglages");
  await page.getByRole("switch", { name: /^Budgets/ }).click(); await page.waitForTimeout(300);
  verifier(JSON.stringify((await profil(page)).alertes) === JSON.stringify(["votes", "elections", "actus"]), "décocher « Budgets » le retire de repere.profil");
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.getByTestId("alertes-bandeau").waitFor({ timeout: 15000 });
  const texte = await page.getByTestId("alertes-bandeau").innerText();
  verifier(/nouveauté|Rien de nouveau/.test(texte) && /Aucune notification n.est envoyée/.test(texte), "le bandeau dit ce qu'il a trouvé, et qu'il n'envoie rien");
  const cles = await page.evaluate(() => Object.keys(localStorage).sort());
  verifier(cles.every(c => ["repere.departement", "repere.profil"].includes(c)), "aucune clé de stockage ajoutée : " + JSON.stringify(cles));
  verifier(erreurs.length === 0, "choix : aucune erreur JavaScript" + (erreurs.length ? " (" + erreurs[0] + ")" : ""));
  await contexte.close();
}
await navigateur.close();
console.log(echecs === 0 ? "alertes : zéro échec" : `alertes : ${echecs} échec(s)`);
process.exit(echecs === 0 ? 0 : 1);
