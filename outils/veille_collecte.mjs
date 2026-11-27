#!/usr/bin/env node
/* VEILLE DE LA COLLECTE (« Heartbeat ») — 27/11/2026, spec et seuil valides par le porteur.
 *
 * LE TROU FERME ICI. Les deux alertes existantes (outils/sante_publique.sh, outils/alerte_collecte.mjs)
 * tournent DANS collecte.yml : si la collecte ne demarre pas, aucune ne parle. Causes reelles : planification
 * suspendue par GitHub (depot public, 60 jours sans activite), workflow desactive, creneau saute, bascule de depot.
 * Ce script tourne dans un AUTRE workflow (.github/workflows/veille-collecte.yml), deux fois par jour, et lit :
 *   A. la derniere collecte REUSSIE sur main (API des runs) ;
 *   B. l'etat du workflow collecte.yml (tout autre etat que « active » : alerte immediate) ;
 *   C. la date de construction de la production en ligne (build.construit_le de data/index.json).
 *
 * SEUIL : 40 h. Mesure du 27/11/2026 : le cron de 05:47 UTC part en pratique entre 13:37 et 16:30 UTC ;
 * deux reussites peuvent etre separees de ~35 h sans panne. Plus serre = fausses alertes.
 *
 * CE QU'IL NE VOIT PAS : un arret de GitHub Actions pour tout le depot. Il vit au meme endroit que la
 * collecte. Decision du porteur (27/11) : aucun service tiers pour la V1 ; on reagit a la main.
 *
 * Usage : node outils/veille_collecte.mjs [--a-sec] [--seuil <heures>]
 *   --a-sec : affiche le diagnostic, ne touche a aucune issue (preuve locale).
 * GH_TOKEN et GITHUB_REPOSITORY dans l'environnement ; URL_RUN facultatif. */
import { gh, publierIssue } from "./alerte_collecte.mjs";
import { minuteParis } from "../mono/packages/core/src/aujourdhui.js";
import { jourFr } from "../mono/packages/core/src/format.js";

export const SEUIL_H = 40;
export const TITRE_VEILLE = "[ALERTE] veille : la collecte ne donne plus signe de vie";
const URL_SITE = "https://repereapp.netlify.app";

const heures = (de, a) => Math.floor((a.getTime() - Date.parse(de)) / 36e5);
const lisible = iso => !!iso && Number.isFinite(Date.parse(iso));

/* « jeudi 26 novembre 2026 à 16 h 49 », a l'heure de Paris (changement d'heure compris). */
export function quandParis(iso) {
  const m = minuteParis(new Date(iso));
  const [j, h] = m.split("T");
  const [hh, mm] = h.split(":");
  return `${jourFr(j)} à ${Number(hh)} h ${mm}`;
}

/* REGLE PURE (testee dans mono/tests/veille-collecte.test.mjs). */
export function diagnostic({ dernierSucces, etatWorkflow, construitLe, maintenant = new Date(), seuilH }) {
  const seuil = Number(seuilH) > 0 ? Number(seuilH) : SEUIL_H;
  const raisons = [];
  const constats = [];

  if (etatWorkflow == null) {
    constats.push("État du workflow de collecte : impossible à vérifier (API illisible).");
  } else if (etatWorkflow !== "active") {
    raisons.push({ code: "workflow", phrase: `Le workflow de collecte n'est plus actif (état : ${etatWorkflow}). Il ne démarrera plus seul : Actions, « Collecte quotidienne », « Enable workflow ».` });
  } else {
    constats.push("Workflow de collecte : actif.");
  }

  const silence = !lisible(dernierSucces) || heures(dernierSucces, maintenant) > seuil;
  if (!lisible(dernierSucces)) {
    raisons.push({ code: "silence", phrase: "Aucune collecte réussie trouvée sur main." });
  } else {
    const h = heures(dernierSucces, maintenant);
    const p = `Dernière collecte réussie : ${quandParis(dernierSucces)}, il y a ${h} h.`;
    if (silence) raisons.push({ code: "silence", phrase: `Aucune collecte réussie depuis ${h} h (seuil : ${seuil} h). ${p}` });
    else constats.push(p);
  }

  if (!lisible(construitLe)) {
    constats.push(`Production en ligne (${URL_SITE}) : impossible à vérifier depuis la veille.`);
  } else {
    const h = heures(construitLe, maintenant);
    const p = `Production en ligne construite le ${quandParis(construitLe)}, il y a ${h} h.`;
    if (h > seuil && !silence) raisons.push({ code: "hors-ligne", phrase: `La collecte réussit, mais la production n'est pas remise en ligne. ${p}` });
    else constats.push(p);
  }

  return { alerte: raisons.length > 0, raisons, constats, seuil };
}

export function corpsVeille(d, { urlRun } = {}) {
  return [
    d.alerte
      ? "La veille ne voit plus la collecte quotidienne vivre. Le site en ligne n'est peut-être plus rafraîchi."
      : "La collecte donne de nouveau signe de vie.",
    "",
    ...d.raisons.map(r => `- **${r.phrase}**`),
    ...d.constats.map(c => `- ${c}`),
    "",
    `Veille : ${urlRun || "lancement local"}`,
    "",
    "Cette issue se ferme seule au retour de la collecte. Outil : `outils/veille_collecte.mjs` (seuil " + d.seuil + " h).",
  ].join("\n");
}

async function lireProduction() {
  try {
    const r = await fetch(`${URL_SITE}/data/index.json?veille=${Date.now()}`, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const j = await r.json();
    return (j && j.build && j.build.construit_le) || null;
  } catch { return null; }
}

function lire(...args) {
  try { return gh(...args) || null; } catch { return null; }
}

async function main() {
  const args = process.argv.slice(2);
  const aSec = args.includes("--a-sec");
  const i = args.indexOf("--seuil");
  const seuilH = i >= 0 ? args[i + 1] : process.env.SEUIL_HEURES;
  const depot = process.env.GITHUB_REPOSITORY || "Repere0/Repere-Citoyen";
  const base = `repos/${depot}/actions/workflows/collecte.yml`;
  const d = diagnostic({
    /* updated_at : la fin du run reussi, au plus pres du moment ou la production a ete publiee. */
    dernierSucces: lire("api", `${base}/runs?branch=main&status=success&per_page=1`, "--jq", ".workflow_runs[0].updated_at // empty"),
    etatWorkflow: lire("api", base, "--jq", ".state"),
    construitLe: await lireProduction(),
    seuilH,
  });
  const texte = corpsVeille(d, { urlRun: process.env.URL_RUN });
  console.log(texte);
  if (aSec) { console.log(`\n(à sec : aucune issue touchée ; alerte = ${d.alerte})`); return; }
  publierIssue({
    titre: TITRE_VEILLE,
    texte,
    alerte: d.alerte,
    fermeture: texte,
    resume: d.raisons.map(r => r.code).join(", "),
  });
}
if (import.meta.url === `file://${process.argv[1]}`) main();
