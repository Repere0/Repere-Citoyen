/* LE PARTAGE EN IMAGE, DANS UN NAVIGATEUR (23/11/2026, audit pré-bêta C2 et C3).
 *
 * Usage : node apps/mobile/tests/partage-image-web.mjs http://localhost:8811   (depuis mono/)
 *
 * Mesuré avant le correctif : la capture échouait toujours sur le web (html2canvas-pro absent), le téléphone
 * recevait un texte sans image ni lien ; sans navigator.share (ordinateur), le clic levait une erreur non
 * rattrapée et l'écran ne disait rien. Ce contrôle joue les trois navigateurs sur « Repère du jour » :
 *   1. partage de fichier possible (Safari iOS, Chrome Android) : UN fichier PNG de 1080 x 1920, et le lien https ;
 *   2. partage de texte seulement : le texte et le lien https, aucune erreur ;
 *   3. aucun partage (ordinateur) : le PNG est téléchargé, et l'écran le dit.
 * Chaque page est servie AVEC la politique de sécurité publiée (scripts/cloudflare.mjs) : sans elle, un fetch
 * d'adresse data: passait ici et aurait été refusé en ligne (connect-src 'self'). */
import { createRequire } from "node:module";
const require = createRequire(process.cwd() + "/");
const { chromium } = require("playwright");
const { politique } = await import(new URL("../scripts/cloudflare.mjs", import.meta.url));

const BASE = (process.argv[2] || "http://localhost:8811").replace(/\/$/, "");
let echecs = 0;
const verifier = (ok, m) => { console.log((ok ? "ok    " : "ECHEC ") + m); if (!ok) echecs++; };
const PROFIL = { prenom: "Test", niveauZoom: "france", tailleTexte: 16, espacement: 1.5, contraste: "normal", policeDyslexie: false,
  animationsReduites: false, modeDaltonien: false, masquerImages: false, mode: "auto", themes: [] };
const DEPARTEMENT = { d: "77", c: "77288" };

const navigateur = await chromium.launch();
async function scenario(nom, mode) {
  const ctx = await navigateur.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true });
  await ctx.addInitScript(([profil, dep, mode]) => {
    localStorage.setItem("repere.profil", JSON.stringify(profil));
    localStorage.setItem("repere.departement", JSON.stringify(dep));
    window.__partages = [];
    if (mode !== "aucun") {
      Object.defineProperty(navigator, "share", { configurable: true, value: async (d) => {
        const f = d.files && d.files[0];
        let taille = null;
        if (f) { const bm = await createImageBitmap(f); taille = [bm.width, bm.height]; }
        window.__partages.push({ text: d.text || "", url: d.url || "", fichiers: d.files ? d.files.length : 0, type: f ? f.type : null, taille });
      } });
      Object.defineProperty(navigator, "canShare", { configurable: true, value: (d) => mode === "fichier" || !(d && d.files) });
    } else {
      Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    }
  }, [PROFIL, DEPARTEMENT, mode]);
  await ctx.route(u => !/\.[a-z0-9]+$/i.test(new URL(u).pathname), async route => {
    const r = await route.fetch();
    const html = await r.text();
    await route.fulfill({ response: r, body: html, headers: { ...r.headers(), "content-security-policy": politique(html) } });
  });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on("console", m => { if (/Content Security Policy|Refused/.test(m.text())) erreurs.push("CSP : " + m.text().slice(0, 160)); });
  page.on("pageerror", e => erreurs.push(e.message));
  await page.goto(`${BASE}/repere-du-jour`, { waitUntil: "networkidle" });
  const bouton = page.getByRole("button", { name: "Partager en image, pour une story" });
  try { await bouton.waitFor({ state: "visible", timeout: 15000 }); } catch { verifier(false, `${nom} : le bouton « En image » est visible`); await ctx.close(); return; }
  const attente = mode === "aucun" ? page.waitForEvent("download", { timeout: 15000 }).catch(() => null) : null;
  await bouton.click();
  await page.waitForTimeout(4000);
  const recus = await page.evaluate(() => window.__partages);
  if (mode === "fichier") {
    verifier(recus.length === 1 && recus[0].fichiers === 1 && recus[0].type === "image/png", `${nom} : un fichier PNG est remis au partage`);
    verifier(recus[0] && recus[0].taille && recus[0].taille[0] === 1080 && recus[0].taille[1] === 1920, `${nom} : l'image fait 1080 x 1920 (${recus[0] && recus[0].taille})`);
    verifier(recus[0] && recus[0].text.includes(`${BASE}/repere-du-jour`), `${nom} : le lien https accompagne l'image`);
  } else if (mode === "texte") {
    verifier(recus.length === 1 && recus[0].fichiers === 0, `${nom} : un partage de texte, sans fichier`);
    verifier(recus[0] && recus[0].url.startsWith(`${BASE}/repere-du-jour`), `${nom} : le lien https est remis (${recus[0] && recus[0].url})`);
  } else {
    const dl = await attente;
    if (dl && process.env.GARDER) await dl.saveAs(process.env.GARDER);
    verifier(!!dl && /\.png$/.test(dl.suggestedFilename()), `${nom} : le PNG est téléchargé (${dl ? dl.suggestedFilename() : "rien"})`);
    const dit = await page.getByTestId("partage-resultat").first().innerText().catch(() => "");
    verifier(/Image téléchargée/.test(dit), `${nom} : l'écran dit ce qui s'est passé (« ${dit} »)`);
  }
  verifier(erreurs.length === 0, `${nom} : aucune erreur de page${erreurs.length ? " : " + erreurs[0] : ""}`);
  await ctx.close();
}
try {
  await scenario("partage de fichier", "fichier");
  await scenario("partage de texte seul", "texte");
  await scenario("ordinateur sans partage", "aucun");
} finally { await navigateur.close(); }
if (echecs) { console.log(`${echecs} échec(s)`); process.exit(1); }
console.log("partage en image : tout est vert");
