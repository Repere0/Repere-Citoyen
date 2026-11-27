/* INSTALLER REPÈRE SUR L'ÉCRAN D'ACCUEIL (27/11/2026) : qui voit le bandeau, ce qu'il fait, ce qu'il ne garde pas.
 *   - iPhone (Safari) : bandeau « Comment faire » → page /installer, les gestes iPhone en premier ;
 *   - iPhone déjà installé (navigator.standalone) : rien ;
 *   - Android, après l'invitation du navigateur (beforeinstallprompt) : « Installer » ouvre SA fenêtre, puis plus rien ;
 *   - Android sans invitation, ordinateur : rien ;
 *   - « Plus tard » : caché pour la séance, même en changeant d'onglet ; aucune clé de stockage en plus (invariant 2) ;
 *   - « Réduire les animations » : le bandeau est là d'emblée, sans glissement.
 * Usage : node apps/mobile/tests/installation-web.mjs http://localhost:8811 */
import { createRequire } from "node:module";
import path from "node:path";
let chromium;
for (const racine of ["../package.json", "../../../package.json"]) {
  try { ({ chromium } = createRequire(path.resolve(import.meta.dirname, racine))("playwright")); break; } catch { /* suivant */ }
}
const BASE = process.argv[2] || "http://localhost:8811";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";
const BUREAU = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
let echecs = 0;
const verifier = (ok, texte) => { console.log((ok ? "ok    " : "ECHEC ") + texte); if (!ok) echecs++; };
const nav = await chromium.launch();

async function ouvrir({ ua, largeur = 390, autonome = false, reduit = false, chemin = "/chez-vous" }) {
  const ctx = await nav.newContext({ viewport: { width: largeur, height: 844 }, userAgent: ua, isMobile: largeur < 800, hasTouch: largeur < 800 });
  await ctx.addInitScript(([a, r]) => {
    localStorage.setItem("repere.profil", JSON.stringify({ prenom: "Test", mode: "clair", alertes: [], animationsReduites: r }));
    localStorage.setItem("repere.departement", JSON.stringify({ d: "77", c: "77288" }));
    if (a) Object.defineProperty(navigator, "standalone", { get: () => true });
  }, [autonome, reduit]);
  const page = await ctx.newPage();
  await page.goto(BASE + chemin, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  return { ctx, page, bandeau: page.getByTestId("invitation-installation") };
}

/* iPhone */
{
  const { ctx, page, bandeau } = await ouvrir({ ua: IPHONE });
  verifier(await bandeau.isVisible(), "iPhone : le bandeau d'installation est là");
  verifier(/écran d'accueil/.test(await bandeau.innerText()) && /sans réseau/.test(await bandeau.innerText()), "iPhone : il dit ce qu'on gagne (écran d'accueil, sans réseau)");
  const b = await page.getByTestId("installation-principal").boundingBox(), t = await page.getByTestId("barre-onglets").boundingBox().catch(() => null);
  verifier(b && b.height >= 44, `iPhone : bouton de ${b && Math.round(b.height)} px`);
  const onglets = await page.getByRole("tablist").first().boundingBox().catch(() => null);
  verifier(!onglets || (await bandeau.boundingBox()).y + (await bandeau.boundingBox()).height <= onglets.y + 1, "iPhone : le bandeau ne couvre pas la barre d'onglets");
  /* Le dernier élément de l'écran, défilé tout en bas, reste au-dessus du bandeau (sa hauteur s'ajoute à la marge). */
  const dernier = page.getByText("Copier le lien").last();
  await dernier.scrollIntoViewIfNeeded().catch(() => {});
  await page.mouse.wheel(0, 5000); await page.waitForTimeout(500);
  const d = await dernier.boundingBox().catch(() => null), bb = await bandeau.boundingBox();
  verifier(!d || d.y + d.height <= bb.y + 1, `iPhone : le bas de l'écran reste lisible au-dessus du bandeau (${d && Math.round(d.y + d.height)} ≤ ${Math.round(bb.y)})`);
  await page.getByTestId("installation-principal").click();
  await page.getByTestId("etapes-ios").waitFor({ timeout: 10000 });
  const ios = await page.getByTestId("etapes-ios").boundingBox(), android = await page.getByTestId("etapes-android").boundingBox();
  verifier(ios.y < android.y, "iPhone : « Comment faire » ouvre le tutoriel, les gestes iPhone en premier");
  verifier(/Sur l'écran d'accueil/.test(await page.getByTestId("etapes-ios").innerText()), "tutoriel : « Sur l'écran d'accueil » est nommé");
  await page.goto(BASE + "/chez-vous", { waitUntil: "networkidle" }); await page.waitForTimeout(2200);
  await page.getByTestId("installation-plus-tard").click();
  await page.waitForTimeout(300);
  verifier(!(await bandeau.isVisible().catch(() => false)), "« Plus tard » : le bandeau se ferme");
  await page.getByRole("tab", { name: /Finances/ }).first().click(); await page.waitForTimeout(800);
  verifier(!(await page.getByTestId("invitation-installation").isVisible().catch(() => false)), "« Plus tard » : il ne revient pas en changeant d'onglet");
  const cles = await page.evaluate(() => Object.keys(localStorage).concat(Object.keys(sessionStorage)).sort());
  verifier(JSON.stringify(cles) === JSON.stringify(["repere.departement", "repere.profil"]), `rien n'est gardé de plus (invariant 2) : ${cles.join(", ")}`);
  await ctx.close();
}
/* iPhone déjà installé */
{
  const { ctx, bandeau, page } = await ouvrir({ ua: IPHONE, autonome: true });
  verifier(!(await bandeau.isVisible().catch(() => false)), "iPhone, application déjà installée : pas de bandeau");
  await page.goto(BASE + "/installer", { waitUntil: "networkidle" }); await page.waitForTimeout(800);
  verifier(await page.getByTestId("installer-deja").isVisible(), "tutoriel ouvert depuis l'application installée : « C'est déjà fait »");
  await ctx.close();
}
/* Android, avec et sans invitation du navigateur */
{
  const { ctx, page, bandeau } = await ouvrir({ ua: ANDROID });
  verifier(!(await bandeau.isVisible().catch(() => false)), "Android sans invitation du navigateur : pas de bandeau");
  await page.evaluate(() => {
    const e = new Event("beforeinstallprompt", { cancelable: true });
    window.__fenetre = 0;
    e.prompt = async () => { window.__fenetre++; };
    e.userChoice = Promise.resolve({ outcome: "accepted" });
    window.dispatchEvent(e);
  });
  await page.waitForTimeout(2000);
  verifier(await bandeau.isVisible() && (await page.getByTestId("installation-principal").innerText()).trim() === "Installer", "Android, invitation reçue : bandeau « Installer »");
  await page.getByTestId("installation-principal").click(); await page.waitForTimeout(400);
  verifier(await page.evaluate(() => window.__fenetre) === 1, "« Installer » ouvre la fenêtre d'installation du navigateur");
  verifier(!(await bandeau.isVisible().catch(() => false)), "après la fenêtre : le bandeau disparaît (le navigateur n'en redonne pas)");
  await ctx.close();
}
/* Ordinateur */
{
  const { ctx, bandeau } = await ouvrir({ ua: BUREAU, largeur: 1440 });
  verifier(!(await bandeau.isVisible().catch(() => false)), "ordinateur : pas de bandeau");
  await ctx.close();
}
/* Moins de mouvement */
{
  const { ctx, bandeau } = await ouvrir({ ua: IPHONE, reduit: true });
  const o = await bandeau.evaluate(e => getComputedStyle(e).opacity);
  verifier(o === "1", `« Réduire les animations » : le bandeau est là d'emblée (opacité ${o})`);
  await ctx.close();
}
await nav.close();
if (echecs) { console.log(`installation : ${echecs} échec(s)`); process.exit(1); }
console.log("installation : zéro échec");
