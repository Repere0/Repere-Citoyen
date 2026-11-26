#!/usr/bin/env node
/* LES TEXTES OFFICIELS À RÉSUMER, SANS INTERVENTION — 26/11/2026 (porteur : « totale autonomie lors de la collecte »).
 *
 * Pour chaque scrutin solennel publié (data/scrutins.json, champ `dr` = référence du dossier législatif) :
 *   1. on cherche, dans l'archive « Dossiers législatifs » de l'Assemblée (déjà téléchargée chaque jour par la collecte :
 *      outils/collecte.py, Dossiers_Legislatifs.json.zip), le DOCUMENT initial du dossier : projet ou proposition de loi,
 *      « Texte Déposé », le plus ancien (c'est lui qui porte l'exposé des motifs) ;
 *   2. on télécharge sa version PDF officielle : https://www.assemblee-nationale.fr/dyn/opendata/<uid>.pdf ;
 *   3. on en tire le texte (pdftotext, paquet poppler-utils) et on garde l'EXPOSÉ DES MOTIFS, borné en longueur ;
 *   4. on écrit officiels/<dossier>.txt et lots.json, que lit scripts/generer_resumes.mjs.
 * Rien n'est inventé : un dossier sans document reconnu, sans PDF ou sans exposé lisible est écarté, et le dit.
 *
 * NON VÉRIFIÉ sur l'archive réelle depuis le conteneur de développement (il ne joint pas assemblee-nationale.fr) :
 * la forme des documents vient de docs/schema_dossiers.md (décrite par la collecte sur l'archive réelle), l'adresse
 * des PDF de pages publiques de l'Assemblée. Le premier passage sur le runner, en --essai, le dira.
 *
 * USAGE (depuis mono/) :
 *   node scripts/textes-officiels.mjs --archive ../data/brut_Dossiers_Legislatifs --scrutins data/scrutins.json \
 *        --sortie officiels [--deja data/resumes] [--limite 20]
 *   --deja : dossiers qui ont déjà un fichier (brouillon ou validé) : sautés, on ne repaie pas un résumé. */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const URL_PDF = uid => `https://www.assemblee-nationale.fr/dyn/opendata/${uid}.pdf`;
export const URL_DOSSIER = ref => `https://www.assemblee-nationale.fr/dyn/17/dossiers/${ref}`;
export const LONGUEUR_MAX = 12000; /* caractères envoyés au modèle : borne le coût et reste dans un seul appel */
const REF = /^DLR5L\d+N\d+$/;
const TYPES_INITIAUX = new Set(["PRJL", "PION"]); /* projet de loi, proposition de loi (docs/schema_dossiers.md) */

/* Les dossiers à résumer : ceux des scrutins publiés, sans doublon, dans l'ordre du catalogue. */
export function dossiersDesScrutins(catalogue) {
  const vus = new Map();
  for (const s of (catalogue && catalogue.scrutins) || []) {
    if (typeof s.dr === "string" && REF.test(s.dr) && !vus.has(s.dr)) vus.set(s.dr, { dossier: s.dr, titre: s.dl || null, scrutins: [] });
    if (vus.has(s.dr)) vus.get(s.dr).scrutins.push(String(s.n));
  }
  return [...vus.values()];
}

/* Tous les documents de l'archive, indexés par dossier. On lit tout fichier JSON dont la racine est « document ». */
export function indexerDocuments(racine) {
  const parDossier = new Map();
  const marcher = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { marcher(p); continue; }
      if (!e.name.endsWith(".json")) continue;
      let doc;
      try { doc = JSON.parse(fs.readFileSync(p, "utf8")).document; } catch { continue; }
      if (!doc || typeof doc.uid !== "string" || typeof doc.dossierRef !== "string") continue;
      if (!parDossier.has(doc.dossierRef)) parDossier.set(doc.dossierRef, []);
      parDossier.get(doc.dossierRef).push(doc);
    }
  };
  if (fs.existsSync(racine)) marcher(racine);
  return parDossier;
}

/* Le document initial : projet ou proposition de loi, « Texte Déposé », le plus ancien dépôt. Sinon : null. */
export function documentInitial(documents) {
  const date = d => String((d.cycleDeVie && d.cycleDeVie.chrono && (d.cycleDeVie.chrono.dateDepot || d.cycleDeVie.chrono.dateCreation)) || "9999");
  const candidats = (documents || []).filter(d => {
    const c = d.classification || {};
    const type = c.type && c.type.code;
    /* Simulation du 26/11 : un avis du Conseil d'État (AVCE) ou une étude d'impact (ETDI) portent AUSSI la classe
       PRJLOI ; seul le type dit « le texte ». Et un document du Sénat (uid …SNR5S…) n'a pas de PDF à l'Assemblée (404). */
    return TYPES_INITIAUX.has(type) && /ANR5L/.test(d.uid) && d.provenance === "Texte Déposé";
  });
  candidats.sort((a, b) => (date(a) < date(b) ? -1 : date(a) > date(b) ? 1 : 0));
  return candidats[0] || null;
}

/* L'exposé des motifs dans le texte brut du PDF : de l'intitulé « EXPOSÉ DES MOTIFS » jusqu'au dispositif
   (« PROJET DE LOI » / « PROPOSITION DE LOI » en tête de ligne, ou « Article 1er »), borné à LONGUEUR_MAX
   caractères, coupé à la fin d'une phrase. Pas d'exposé reconnu : null (on n'envoie pas le dispositif seul). */
export function exposeDesMotifs(brut, max = LONGUEUR_MAX) {
  const t = String(brut || "").replace(/\r/g, "").replace(/[ \t ]+/g, " ").replace(/-\n(?=\p{Ll})/gu, "");
  /* Simulation du 26/11 : dans un projet de loi de finances, le premier « EXPOSÉ DES MOTIFS » est celui du SOMMAIRE
     (suite de « ARTICLE 12 : … 47 »). On prend la première occurrence suivie de prose, pas d'une table. */
  const titre = /EXPOS[ÉE] (?:G[ÉE]N[ÉE]RAL )?DES MOTIFS/gi;
  let corps = null;
  for (let m; (m = titre.exec(t));) {
    const suite = t.slice(m.index + m[0].length);
    if ((suite.slice(0, 2000).match(/ARTICLE [\dIVXL]+\w* ?:/gi) || []).length >= 3) continue;
    corps = suite;
    break;
  }
  if (corps === null) return null;
  corps = corps.replace(/^\s*(Mesdames,? Messieurs,?|MESDAMES,? MESSIEURS,?)\s*/, "");
  const fin = corps.search(/\n\s*(PROJET DE LOI|PROPOSITION DE LOI(?: ORGANIQUE)?)\s*\n|\n\s*Article (1er|premier|unique)\b/i);
  if (fin > 0) corps = corps.slice(0, fin);
  /* Lignes recollées : les retours à la ligne du PDF ne sont pas des paragraphes. */
  corps = corps.split(/\n\s*\n/).map(p => p.replace(/\s*\n\s*/g, " ").trim()).filter(p => p && !/^[–—-]?\s*\d+\s*[–—-]?$/.test(p)).join("\n\n");
  if (corps.length > max) {
    const coupe = corps.slice(0, max);
    const point = coupe.lastIndexOf(". ");
    corps = point > max / 2 ? coupe.slice(0, point + 1) : coupe;
  }
  return corps.trim().length >= 200 ? corps.trim() : null;
}

/* Téléchargement + pdftotext. Injectables pour les tests (aucun réseau ni binaire dans le banc). */
async function pdfEnTexte(uid, { fetchImpl = fetch, pdftotext = fichier => execFileSync("pdftotext", ["-enc", "UTF-8", fichier, "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }) } = {}) {
  const r = await fetchImpl(URL_PDF(uid));
  if (!r.ok) throw new Error(`PDF ${uid} : HTTP ${r.status}`);
  const tmp = path.join(fs.mkdtempSync(path.join(process.env.RUNNER_TEMP || "/tmp", "pdf-")), uid + ".pdf");
  fs.writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
  return pdftotext(tmp);
}

export async function preparer({ archive, catalogue, sortie, deja = null, limite = 20, fetchImpl, pdftotext }) {
  const docs = indexerDocuments(archive);
  const existants = deja && fs.existsSync(deja) ? new Set(fs.readdirSync(deja).filter(f => f.endsWith(".json")).map(f => f.replace(/\.json$/, ""))) : new Set();
  fs.mkdirSync(sortie, { recursive: true });
  const lots = [], ecartes = [];
  for (const d of dossiersDesScrutins(catalogue)) {
    if (lots.length >= limite) break;
    if (existants.has(d.dossier)) { ecartes.push({ dossier: d.dossier, raison: "déjà un fichier de résumé" }); continue; }
    const doc = documentInitial(docs.get(d.dossier));
    if (!doc) { ecartes.push({ dossier: d.dossier, raison: "aucun projet ou proposition de loi « Texte Déposé » dans l'archive" }); continue; }
    try {
      const expose = exposeDesMotifs(await pdfEnTexte(doc.uid, { fetchImpl, pdftotext }));
      if (!expose) { ecartes.push({ dossier: d.dossier, raison: `pas d'exposé des motifs lisible dans ${doc.uid}` }); continue; }
      const fichier = path.join(sortie, d.dossier + ".txt");
      fs.writeFileSync(fichier, expose + "\n");
      lots.push({ dossier: d.dossier, texte: fichier, url: URL_DOSSIER(d.dossier), titre: d.titre, scrutins: d.scrutins, document: doc.uid, pdf: URL_PDF(doc.uid) });
    } catch (e) {
      ecartes.push({ dossier: d.dossier, raison: String(e && e.message ? e.message : e) });
    }
  }
  fs.writeFileSync(path.join(sortie, "lots.json"), JSON.stringify(lots, null, 1) + "\n");
  return { lots, ecartes };
}

async function main() {
  const a = process.argv.slice(2);
  const val = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  if (!val("--archive") || !val("--scrutins") || !val("--sortie")) {
    console.error("usage : node scripts/textes-officiels.mjs --archive DOSSIER --scrutins data/scrutins.json --sortie officiels [--deja data/resumes] [--limite 20]");
    process.exit(2);
  }
  const { lots, ecartes } = await preparer({ archive: val("--archive"), catalogue: JSON.parse(fs.readFileSync(val("--scrutins"), "utf8")),
    sortie: val("--sortie"), deja: val("--deja"), limite: Number(val("--limite") || 20) });
  for (const l of lots) console.log(`texte prêt   ${l.dossier} (${l.document}, ${fs.statSync(l.texte).size} octets)`);
  for (const e of ecartes) console.log(`écarté       ${e.dossier} : ${e.raison}`);
  console.log(`${lots.length} texte(s) prêt(s), ${ecartes.length} écarté(s). Lot : ${path.join(val("--sortie"), "lots.json")}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error("textes-officiels : " + e.message); process.exit(2); });
