/* L'AVIS EN TROIS ÉTAPES (Step Up, 25/11/2026) : note, points, texte, puis la messagerie du lecteur (mailto).
 * Rien n'est envoyé par Repère : on intercepte l'ouverture du lien et on lit le message préparé.
 * Usage : node apps/mobile/tests/avis-web.mjs http://localhost:8811 (build avec EXPO_PUBLIC_CONTACT_EMAIL). */
import { createRequire } from "node:module";
const { chromium } = createRequire(process.cwd() + "/")("playwright");
const BASE = process.argv[2] || "http://localhost:8811";
let echecs = 0;
const verifier = (ok, texte) => { console.log((ok ? "ok    " : "ECHEC ") + texte); if (!ok) echecs++; };
const navigateur = await chromium.launch();
const contexte = await navigateur.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await contexte.addInitScript(() => {
  localStorage.setItem("repere.profil", JSON.stringify({ prenom: "Test", animationsReduites: true, mode: "clair", alertes: [] }));
  window.__liens = []; const o = window.open; window.open = (u, ...r) => { window.__liens.push(String(u)); return null; };
});
const page = await contexte.newPage();
/* 26/11/2026 : sur le web, la messagerie s'ouvre par la page elle-même (location), plus par window.open(…, "_blank")
   qui laissait un onglet vide. Chromium annonce cette navigation vers mailto: au protocole de débogage. */
const cdp = await contexte.newCDPSession(page);
await cdp.send("Page.enable");
const navigations = []; cdp.on("Page.frameRequestedNavigation", e => navigations.push(String(e.url)));
const erreurs = []; page.on("pageerror", e => erreurs.push(String(e.message || e).slice(0, 160)));
await page.goto(BASE + "/avis", { waitUntil: "networkidle" });
await page.getByTestId("avis-etape").waitFor({ timeout: 15000 });
verifier((await page.getByTestId("avis-etape").innerText()).toLowerCase().includes("1 sur 3"), "étape 1 sur 3");
verifier(await page.getByTestId("avis-suivant").isDisabled(), "sans note, « Continuer » est éteint");
await page.getByTestId("avis-note-4").click();
/* 27/11/2026 (porteur) : le menu « Votre avis porte sur », fermé d'abord, une liste fixe de huit pages. */
const menu = page.getByTestId("avis-theme");
verifier(await menu.getAttribute("aria-expanded") === "false", "menu des pages : fermé d'abord, état annoncé");
await menu.click();
/* Les étoiles sont aussi des boutons radio : on compte les choix du menu seulement. */
const choix = () => page.locator('[data-testid^="avis-theme-"][role="radio"]');
verifier(await choix().count() === 8, `menu ouvert : huit pages au choix (${await choix().count()})`);
verifier((await menu.boundingBox()).height >= 44, "menu : cible de 44 px au moins");
await page.getByRole("radio", { name: "Finances" }).click();
verifier(await choix().count() === 0 && (await menu.innerText()).includes("Finances"), "le choix referme le menu et s'y lit");
await page.getByTestId("avis-suivant").click();
verifier((await page.getByTestId("avis-etape").innerText()).toLowerCase().includes("2 sur 3"), "étape 2 sur 3");
await page.getByRole("checkbox", { name: "Le design" }).click();
await page.getByTestId("avis-suivant").click();
await page.getByTestId("avis-texte").fill("Très clair & utile.");
const avant = await page.evaluate(() => window.__liens.length);
await page.getByTestId("avis-envoyer").click(); await page.waitForTimeout(500);
const liens = await page.evaluate(() => window.__liens);
const mail = navigations.find(l => l.startsWith("mailto:")) || "";
const corps = decodeURIComponent((mail.split("&body=")[1] || ""));
verifier(!!mail, "« Ouvrir ma messagerie » ouvre un lien mailto");
verifier(liens.length === avant, "sans nouvel onglet (pas de window.open)");
verifier(/Écrivez à \S+@\S+/.test(await page.getByTestId("avis-adresse").innerText()), "l'adresse reste écrite, pour qui n'a pas de messagerie réglée");
const sujet = decodeURIComponent((mail.split("?subject=")[1] || "").split("&body=")[0]);
verifier(sujet === "[Avis - Finances] Retour de Test", `le sujet porte la page choisie et le prénom (${sujet})`);
verifier(corps.includes("Note : 4 étoiles sur 5") && corps.includes("Ce qui va : Le design") && corps.includes("Très clair & utile."), "le message porte la note, le point coché et le texte");
const lignes = corps.split("\n"), sep = lignes.indexOf("--- Ne pas modifier en dessous de cette ligne ---");
verifier(sep > 0 && lignes.length - sep - 1 === 1 && /^Repère .+ · \d{4}-\d{2}-\d{2} · web/.test(lignes[sep + 1]), "infos techniques séparées : une ligne, sous la ligne de tirets, tout en bas");
verifier(lignes.slice(0, sep).join("\n").includes("Très clair") && !corps.includes("Mozilla/5.0"), "le texte du lecteur est au-dessus ; plus de chaîne de navigateur entière");
verifier((await page.getByTestId("avis-aide").innerText()).includes("Vous pourrez y joindre une capture d'écran si besoin."), "l'aide sous le bouton parle de la capture d'écran");
verifier(erreurs.length === 0, "avis : aucune erreur JavaScript" + (erreurs.length ? " (" + erreurs[0] + ")" : ""));
await navigateur.close();
console.log(echecs === 0 ? "avis : zéro échec" : `avis : ${echecs} échec(s)`);
process.exit(echecs === 0 ? 0 : 1);
