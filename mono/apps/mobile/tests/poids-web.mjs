/* LE POIDS DU PREMIER ÉCRAN DE L'APPLICATION WEB (23/11/2026, audit pré-bêta M1).
 *
 * Usage : node apps/mobile/tests/poids-web.mjs http://localhost:8812   (depuis mono/, sur l'export PWA)
 *
 * Mesuré avant : 1 096 Ko de polices TTF au premier écran (Ionicons entier : 390 Ko). Après : 163 Ko de woff2.
 * Ce contrôle ouvre la bienvenue et l'accueil, additionne ce qui est téléchargé, et échoue si :
 *   - une police .ttf est encore demandée ;
 *   - les polices dépassent PLAFOND_POLICES ;
 *   - le JavaScript dépasse PLAFOND_JS (non compressé : le serveur de test ne compresse pas).
 * Les plafonds laissent environ 20 % de marge ; les relever est une décision, pas un réglage. */
import { createRequire } from "node:module";
const require = createRequire(process.cwd() + "/");
const { chromium } = require("playwright");

const BASE = (process.argv[2] || "http://localhost:8812").replace(/\/$/, "");
export const PLAFOND_POLICES = 200 * 1024;
export const PLAFOND_JS = 1800 * 1024;
let echecs = 0;
const verifier = (ok, m) => { console.log((ok ? "ok    " : "ECHEC ") + m); if (!ok) echecs++; };

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
const page = await ctx.newPage();
const recu = { police: 0, js: 0, ttf: [] };
page.on("response", async r => {
  const u = new URL(r.url()).pathname;
  let n = 0;
  try { n = (await r.body()).length; } catch { return; }
  if (/\.(woff2?|ttf|otf)$/.test(u)) { recu.police += n; if (u.endsWith(".ttf")) recu.ttf.push(u.split("/").pop()); }
  else if (u.endsWith(".js")) recu.js += n;
});
try {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  verifier(recu.ttf.length === 0, `aucune police TTF demandée${recu.ttf.length ? " : " + recu.ttf.join(", ") : ""}`);
  verifier(recu.police > 0 && recu.police <= PLAFOND_POLICES, `polices : ${Math.round(recu.police / 1024)} Ko (plafond ${PLAFOND_POLICES / 1024} Ko)`);
  verifier(recu.js <= PLAFOND_JS, `JavaScript : ${Math.round(recu.js / 1024)} Ko non compressés (plafond ${PLAFOND_JS / 1024} Ko)`);
  const rendu = await page.evaluate(() => document.fonts.check("16px Inter_700Bold") && document.fonts.check("16px ionicons"));
  verifier(rendu, "Inter et Ionicons sont chargées");
} finally { await b.close(); }
if (echecs) { console.log(`${echecs} échec(s)`); process.exit(1); }
console.log("poids du premier écran : dans les plafonds");
