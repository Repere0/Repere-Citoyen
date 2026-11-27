#!/usr/bin/env node
/* GÉNÉRER DES BROUILLONS DE RÉSUMÉS « EN CLAIR » AVEC UNE IA — 26/11/2026 (porteur : voie 2, Mistral).
 *
 * Ce script ÉCRIT des BROUILLONS, jamais une publication :
 *   1. il lit un ou plusieurs textes officiels (un fichier texte par dossier, préparé par la collecte ou à la main) ;
 *   2. il demande un résumé au modèle avec une consigne fixe (CONSIGNE, ci-dessous) ;
 *   3. il passe la réponse dans les contrôles de scripts/resumes-clairs.mjs (nombres et noms propres présents dans le
 *      texte officiel, aucun mot de jugement, longueur) ; une réponse qui échoue n'est PAS écrite ;
 *   4. il range le brouillon dans data/resumes/<dossier>.json avec `valide: false`.
 * Rien ne s'affiche tant que le porteur n'a pas posé `valide: true` à la main (garde-fou 5, décision du 26/11/2026),
 * puis lancé `node scripts/resumes-clairs.mjs --publier ./data`.
 *
 * AUCUNE CLÉ DANS LE DÉPÔT, AUCUN APPEL DEPUIS L'APPLICATION : la clé vient de l'environnement (MISTRAL_API_KEY), en
 * local ou dans un secret GitHub. L'application ne fait que lire le fichier publié.
 *
 * USAGE (depuis mono/) :
 *   node scripts/generer_resumes.mjs --liste lots.json [--mock] [--modele mistral-small-latest] [--essai]
 *   (lots de lois : textes-officiels.mjs ; budgets et votes : sources-explications.mjs, champ `type` et `cle`)
 *   lots.json : [{ "dossier": "DLR5L17N51670", "texte": "chemin/vers/officiel.txt", "url": "https://www.assemblee-nationale.fr/...",
 *                  "titre": "…", "scrutins": ["9759"] }, …]
 *   --mock   : aucun appel réseau ; le « modèle » renvoie les deux premières phrases du texte officiel (pour éprouver
 *              la chaîne sans clé ni dépense).
 *   --essai  : appelle le modèle, contrôle, affiche, mais n'écrit rien (mesurer la qualité et les jetons consommés).
 * DÉPENSE : chaque appel est facturé par Mistral. Le script compte les jetons renvoyés par l'API (champ `usage`) et
 * les affiche ; il ne connaît pas le tarif et ne chiffre rien. Premier passage recommandé : 20 textes en --essai. */
import fs from "node:fs";
import { brouillon, controlerResume } from "./resumes-clairs.mjs";
import { jourParis } from "../packages/core/src/aujourdhui.js";

export const MODELE_DEFAUT = "mistral-small-latest";
export const URL_MISTRAL = "https://api.mistral.ai/v1/chat/completions";

/* La consigne du porteur (26/11/2026), mot pour mot dans sa partie centrale, et les règles de Repère autour. */
export const CONSIGNE = [
  "Explique ce texte à un jeune de 15 ans, en 3 phrases maximum, sans aucun jugement de valeur, en te basant UNIQUEMENT sur les faits présents dans ce texte.",
  "Règles : n'ajoute aucun nombre, aucune date ni aucun nom qui ne figure pas dans le texte ; n'utilise aucun mot qui donne un avis, qui compare ou qui classe ;",
  "ne dis pas si le texte est bon ou mauvais ; écris en français courant, au présent ; réponds par le résumé seul, sans titre ni introduction.",
].join(" ");

/* AU-DELÀ DES LOIS (porteur, 27/11/2026 : « un traducteur universel »). Même consigne de fond, et un complément par
   type de donnée. Les sources viennent de scripts/sources-explications.mjs ; les contrôles refusent en plus, pour un
   budget ou un vote, tout mot qui juge un chiffre (JUGEMENT_CHIFFRES). */
export const CONSIGNES = {
  loi: CONSIGNE,
  budget: [
    "Explique ces comptes de commune à un jeune de 15 ans, en 3 phrases maximum, sans aucun jugement de valeur, en te basant UNIQUEMENT sur les montants présents dans ce texte.",
    "Dis simplement ce que la commune a encaissé, ce qu'elle a dépensé et ce qu'elle doit ; reprends les montants tels qu'ils sont écrits, sans en calculer d'autres ;",
    "n'emploie aucun mot qui qualifie un montant (élevé, faible, beaucoup, peu, trop) et ne compare à rien qui ne soit pas dans le texte ; écris en français courant ; réponds par l'explication seule.",
  ].join(" "),
  vote: [
    "Explique ce vote à un jeune de 15 ans, en 3 phrases maximum, sans aucun jugement de valeur, en te basant UNIQUEMENT sur les faits présents dans ce texte.",
    "Dis ce qui était soumis au vote, en mots simples, puis le résultat avec les nombres tels qu'ils sont écrits ; n'en calcule pas d'autres ;",
    "ne qualifie pas le résultat (large, serré, net) et ne dis rien des députés ni des groupes qui n'est pas dans le texte ; réponds par l'explication seule.",
  ].join(" "),
};

/* Le message envoyé au modèle : la consigne du type, puis le texte officiel tel quel, délimité. */
export function messages(texteOfficiel, type = "loi") {
  if (!CONSIGNES[type]) throw new Error(`type inconnu : ${type} (loi, budget ou vote)`);
  return [
    { role: "system", content: CONSIGNES[type] },
    { role: "user", content: `Texte officiel :\n"""\n${String(texteOfficiel).trim()}\n"""` },
  ];
}

/* Le faux modèle : les deux premières phrases du texte officiel, mot pour mot. Il passe toujours les contrôles de
   faits (tout vient du texte) : il éprouve la chaîne, pas la qualité. */
export function modeleSimule(texteOfficiel) {
  const phrases = String(texteOfficiel).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  return { texte: phrases.slice(0, 2).join(" "), jetons: null };
}

/* L'appel réel. `fetchImpl` est injectable pour les tests (aucun réseau dans le banc). */
/* Les refus de l'API qui ne viennent pas du texte : le lot s'arrête et le run est ROUGE (27/11/2026 : un essai dont les
   5 textes avaient reçu « 402 » a fini vert, et a été pris pour une réussite). */
export const PANNES_API = {
  401: "clé refusée par Mistral (401) : vérifier le secret MISTRAL_API_KEY",
  402: "paiement requis par Mistral (402) : le compte n'a pas de crédit ou pas de facturation active (console.mistral.ai, Billing)",
  429: "trop de demandes ou quota atteint chez Mistral (429) : relancer plus tard ou réduire la limite",
};
export async function appelerMistral(texteOfficiel, { cle, modele = MODELE_DEFAUT, fetchImpl = fetch, type = "loi" } = {}) {
  if (!cle) throw new Error("MISTRAL_API_KEY absente de l'environnement (jamais dans un fichier du dépôt)");
  const rep = await fetchImpl(URL_MISTRAL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cle}` },
    body: JSON.stringify({ model: modele, temperature: 0, max_tokens: 300, messages: messages(texteOfficiel, type) }),
  });
  if (!rep.ok) throw Object.assign(new Error(PANNES_API[rep.status] || `Mistral a répondu ${rep.status}`), { panne: true, statut: rep.status });
  const json = await rep.json();
  const texte = json && json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;
  if (typeof texte !== "string" || !texte.trim()) throw new Error("réponse sans texte");
  return { texte: texte.trim(), jetons: json.usage || null };
}

/* Un lot : génère, contrôle, écrit (ou pas). Renvoie un compte rendu par dossier, sans jamais lever pour un seul
   texte refusé (les autres continuent). */
export async function genererLot(lots, { mock = false, essai = false, cle, modele, fetchImpl, jour, sortie } = {}) {
  const compte = [];
  for (const l of lots) {
    const type = l.type || "loi", cleExpl = l.cle || l.dossier;
    const ligne = { dossier: cleExpl, type, titre: l.titre || null, pdf: l.pdf || l.url || null, ok: false, erreurs: [], jetons: null };
    try {
      const officiel = fs.readFileSync(l.texte, "utf8");
      const { texte, jetons } = mock ? modeleSimule(officiel) : await appelerMistral(officiel, { cle, modele, fetchImpl, type });
      ligne.jetons = jetons;
      const c = controlerResume(texte, officiel, { type });
      if (!c.ok) { ligne.erreurs = c.erreurs; ligne.resume = texte; compte.push(ligne); continue; }
      ligne.resume = texte;
      if (!essai) brouillon({ dossier: l.dossier, cle: cleExpl, texte: officiel, resume: texte, url: l.url, titre: l.titre || null, scrutins: l.scrutins || [], jour,
        producteur: l.producteur || null, voie: mock ? "simulation" : `ia:${modele || MODELE_DEFAUT}`, ...(sortie ? { sortie } : {}) });
      ligne.ok = true;
    } catch (e) {
      ligne.erreurs = [String(e && e.message ? e.message : e)];
      /* Une panne de l'API (clé, paiement, quota) vaut pour tous les textes : on s'arrête, sans repayer d'appel. */
      if (e && e.panne) { ligne.panne = true; compte.push(ligne); break; }
    }
    compte.push(ligne);
  }
  return compte;
}

async function main() {
  const a = process.argv.slice(2);
  const val = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  const liste = val("--liste");
  if (!liste) { console.error("usage : node scripts/generer_resumes.mjs --liste lots.json [--mock] [--essai] [--modele NOM]"); process.exit(2); }
  const lots = JSON.parse(fs.readFileSync(liste, "utf8"));
  const mock = a.includes("--mock"), essai = a.includes("--essai");
  /* La date du relevé, à l'heure de Paris (jamais celle de la machine en UTC). */
  const jour = jourParis(new Date());
  const compte = await genererLot(lots, { mock, essai, cle: process.env.MISTRAL_API_KEY, modele: val("--modele") || MODELE_DEFAUT, jour });
  let jetons = 0;
  for (const l of compte) {
    if (l.jetons && l.jetons.total_tokens) jetons += l.jetons.total_tokens;
    console.log(`${l.ok ? "brouillon" : "REFUSÉ  "} ${l.dossier}${l.erreurs.length ? " : " + l.erreurs.join(" ; ") : ""}`);
    /* Pour juger le résumé depuis un téléphone (26/11/2026) : le titre et le texte officiel lu, à côté. */
    if (l.titre) console.log(`          ${l.titre}`);
    if (l.pdf) console.log(`          texte lu : ${l.pdf}`);
    if (l.resume) console.log(`          « ${l.resume} »`);
  }
  console.log(`${compte.filter(l => l.ok).length}/${compte.length} brouillons ${essai ? "contrôlés (rien d'écrit, --essai)" : "écrits, valide: false"}${mock ? " (modèle simulé)" : ""}.`);
  if (!mock) console.log(`Jetons consommés selon l'API : ${jetons || "non renvoyés"}. Le coût dépend du tarif Mistral du jour : non calculé ici.`);
  console.log("Rien ne s'affiche avant que le porteur pose valide: true, puis publie (scripts/resumes-clairs.mjs --publier).");
  const code = codeDeSortie(compte);
  if (code) console.log(`::error::${compte.some(l => l.panne) ? compte.find(l => l.panne).erreurs[0] : "aucun texte n'a passé les contrôles"}`);
  process.exit(code);
}

/* ROUGE si l'API a refusé (clé, paiement, quota) ou si un lot non vide n'a donné AUCUN texte valable. Des refus
   isolés par les contrôles (un mot de jugement, un nombre absent) restent verts : c'est le garde-fou qui marche. */
export function codeDeSortie(compte) {
  if (compte.some(l => l.panne)) return 1;
  if (compte.length > 0 && !compte.some(l => l.ok)) return 1;
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error("generer_resumes : " + e.message); process.exit(2); });
