/* MODE D'AFFICHAGE PERSISTÉ (V35, bloc 1, D67) : le choix de l'écran Réglages
 * (Système, Clair, Sombre) est gardé dans repere.profil, sans nouvelle clé, et il
 * survit à un rechargement. Les autres réglages du profil ne sont pas écrasés.
 * Usage : node apps/mobile/tests/mode-web.mjs http://localhost:8811 */
import { createRequire } from "node:module";
const { chromium } = createRequire(process.cwd() + "/")("playwright");

const BASE = process.argv[2] || "http://localhost:8811";
let echecs = 0;
const verifier = (ok, texte) => { console.log((ok ? "ok    " : "ECHEC ") + texte); if (!ok) echecs++; };

/* Le fond nuit de la palette (sol sombre) : une couleur présente dans l'arbre = thème sombre. */
const FOND_NUIT = "rgb(13, 17, 23)"; /* #0D1117, graphite de la refonte premium du 25/11/2026 */
const fondNuitPresent = page => page.evaluate(nuit => [...document.querySelectorAll("*")]
  .some(e => getComputedStyle(e).backgroundColor === nuit), FOND_NUIT);

const navigateur = await chromium.launch();
const contexte = await navigateur.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
/* Profil déjà répondu, commune retenue, taille de texte 22 : elle doit survivre au changement de mode. */
await contexte.addInitScript(() => {
  if (!localStorage.getItem("repere.departement")) localStorage.setItem("repere.departement", JSON.stringify({ d: "77", c: "77284" }));
  if (!localStorage.getItem("repere.profil")) localStorage.setItem("repere.profil", JSON.stringify({ prenom: "Test",
    niveauZoom: "france", tailleTexte: 22, espacement: 1.5, contraste: "normal", policeDyslexie: false,
    animationsReduites: false, modeDaltonien: false, masquerImages: false, themes: [], mode: "auto",
  }));
});
const page = await contexte.newPage();
const erreurs = [];
page.on("pageerror", e => erreurs.push(String(e.message || e).slice(0, 160)));
const profil = () => page.evaluate(() => JSON.parse(localStorage.getItem("repere.profil") || "null"));
/* Step Up (25/11/2026) : l'écran Réglages, deux interrupteurs (« Suivre le téléphone », « Mode sombre »). */
const coche = async nom => (await page.getByRole("switch", { name: new RegExp("^" + nom) }).getAttribute("aria-checked")) === "true";
const basculer = async nom => { await page.getByRole("switch", { name: new RegExp("^" + nom) }).click(); await page.waitForTimeout(300); };
const choisir = async nom => {
  await page.getByRole("link", { name: "Réglages", exact: true }).first().click();
  await page.getByRole("switch", { name: /^Suivre le téléphone/ }).waitFor({ timeout: 10000 });
  if (nom === "Système") { if (!(await coche("Suivre le téléphone"))) await basculer("Suivre le téléphone"); }
  else {
    if (await coche("Suivre le téléphone")) await basculer("Suivre le téléphone");
    if ((await coche("Mode sombre")) !== (nom === "Sombre")) await basculer("Mode sombre");
  }
  await page.waitForTimeout(400);
  await page.goto(BASE + "/qui-decide", { waitUntil: "networkidle" }); await page.waitForTimeout(600);
};

/* Un écran à barre d'onglets : c'est là que se trouve la roue des réglages. Le système est clair. */
await page.goto(BASE + "/qui-decide", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
verifier(!(await fondNuitPresent(page)), "départ : système clair, pas de fond nuit");

await choisir("Sombre");
let p = await profil();
verifier(p && p.mode === "sombre", `« Sombre » est écrit dans repere.profil (mode=${p && p.mode})`);
verifier(p && p.tailleTexte === 22, "le choix du mode n'écrase pas la taille de texte (22 gardée)");
verifier(await fondNuitPresent(page), "le thème sombre est affiché tout de suite");

await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(800);
verifier(await fondNuitPresent(page), "après rechargement, le thème sombre est toujours affiché");
p = await profil();
verifier(p && p.mode === "sombre", "après rechargement, repere.profil garde mode=sombre");

await choisir("Clair");
p = await profil();
verifier(p && p.mode === "clair", `« Clair » est écrit (mode=${p && p.mode})`);
/* 25/11/2026 : la CI, plus lente, a vu le fond nuit encore présent à 600 ms ; on attend jusqu'à 5 s qu'il parte
   (un fond resté sombre au-delà serait un vrai défaut, et échouerait toujours). */
let nuitPartie = false;
for (let i = 0; i < 25 && !nuitPartie; i++) { nuitPartie = !(await fondNuitPresent(page)); if (!nuitPartie) await page.waitForTimeout(200); }
if (!nuitPartie) console.log("fond nuit restant :", await page.evaluate(nuit => [...document.querySelectorAll("*")].filter(e => getComputedStyle(e).backgroundColor === nuit).slice(0, 3).map(e => e.tagName + "." + (e.getAttribute("data-testid") || "") + " " + (e.textContent || "").slice(0, 40)), FOND_NUIT));
verifier(nuitPartie, "le thème clair remplace le sombre");

await choisir("Système");
p = await profil();
verifier(p && p.mode === "auto", `« Système » revient à mode=auto (mode=${p && p.mode})`);

const cles = await page.evaluate(() => Object.keys(localStorage).sort());
verifier(JSON.stringify(cles) === JSON.stringify(["repere.departement", "repere.profil"]),
  "aucune clé de stockage ajoutée : " + JSON.stringify(cles));
verifier(erreurs.length === 0, "mode : aucune erreur JavaScript" + (erreurs.length ? " (" + erreurs[0] + ")" : ""));

await navigateur.close();
console.log(echecs === 0 ? "mode : zéro échec" : `mode : ${echecs} échec(s)`);
process.exit(echecs === 0 ? 0 : 1);
