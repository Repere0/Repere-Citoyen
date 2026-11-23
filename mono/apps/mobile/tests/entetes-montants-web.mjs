/* EN-TÊTES ET MONTANTS, DANS UN NAVIGATEUR (23/11/2026, audit pré-bêta M3 et M4).
 *
 * Usage : node apps/mobile/tests/entetes-montants-web.mjs http://localhost:8811   (depuis mono/)
 *
 * Mesuré avant le correctif :
 *   - Finances affichait « 2495€ » en grand : l'espace des milliers était figée à 16 px sous un chiffre de 60 px,
 *     et l'espace avant « € » tombait dans le nombre ;
 *   - « ‹ Communes » se lisait comme un retour sur un écran d'onglet ;
 *   - Finances et le Calendrier perdaient la bascule clair / sombre et les réglages (trois en-têtes différents).
 * Ce contrôle vérifie, sur chacun des quatre onglets : la commune nommée à gauche, la bascule et les réglages à
 * droite ; et sur Finances : un espace visible entre les milliers et avant « € ». */
import { createRequire } from "node:module";
const require = createRequire(process.cwd() + "/");
const { chromium } = require("playwright");

const BASE = (process.argv[2] || "http://localhost:8811").replace(/\/$/, "");
let echecs = 0;
const verifier = (ok, m) => { console.log((ok ? "ok    " : "ECHEC ") + m); if (!ok) echecs++; };
const PROFIL = { prenom: "Test", niveauZoom: "france", tailleTexte: 16, espacement: 1.5, contraste: "normal", policeDyslexie: false,
  animationsReduites: true, modeDaltonien: false, masquerImages: false, mode: "sombre", themes: [] };
const DEPARTEMENT = { d: "77", c: "77288" };

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.addInitScript(([p, d]) => { localStorage.setItem("repere.profil", JSON.stringify(p)); localStorage.setItem("repere.departement", JSON.stringify(d)); }, [PROFIL, DEPARTEMENT]);
const page = await ctx.newPage();
const erreurs = [];
page.on("pageerror", e => erreurs.push(e.message));
try {
  for (const chemin of ["chez-vous", "qui-decide", "finances", "a-venir"]) {
    await page.goto(`${BASE}/${chemin}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const commune = page.getByRole("button", { name: /^Changer de commune \(Melun\)/ });
    verifier(await commune.count() >= 1 && await commune.first().isVisible(), `${chemin} : la commune ouverte est nommée en haut à gauche`);
    const texte = await commune.first().innerText().catch(() => "");
    verifier(!texte.includes("‹"), `${chemin} : plus de chevron de retour sur un onglet (« ${texte.trim()} »)`);
    verifier(await page.getByRole("button", { name: /^Passer en mode (clair|sombre)$/ }).count() >= 1, `${chemin} : la bascule clair / sombre est là`);
    verifier(await page.getByRole("button", { name: "Réglages de l'affichage" }).count() >= 1, `${chemin} : les réglages sont là`);
  }
  await page.goto(`${BASE}/finances`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const mesure = await page.evaluate(() => {
    const el = [...document.querySelectorAll("div[aria-label]")].find(e => /€, par habitant et par an$/.test(e.getAttribute("aria-label") || ""));
    if (!el) return null;
    const chiffre = el.firstElementChild;
    const taille = parseFloat(getComputedStyle(chiffre).fontSize);
    const espaces = [...chiffre.querySelectorAll("span, div")].filter(s => /^\s$/.test(s.textContent)).map(s => s.getBoundingClientRect().width);
    return { texte: chiffre.textContent, taille, espaces };
  });
  verifier(!!mesure, "finances : le grand chiffre est trouvé");
  if (mesure) {
    verifier(/\d\s\d{3}\s€$/.test(mesure.texte), `finances : « ${mesure.texte} » a ses espaces (milliers et avant €)`);
    verifier(mesure.espaces.length >= 2 && Math.min(...mesure.espaces) >= mesure.taille * 0.15, `finances : chaque espace se voit (${mesure.espaces.map(Math.round).join(", ")} px pour un chiffre de ${Math.round(mesure.taille)} px)`);
  }
  verifier(erreurs.length === 0, "aucune erreur de page" + (erreurs[0] ? " : " + erreurs[0] : ""));
} finally { await b.close(); }
if (echecs) { console.log(`${echecs} échec(s)`); process.exit(1); }
console.log("en-têtes et montants : tout est vert");
