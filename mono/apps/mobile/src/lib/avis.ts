/* MODE DÉMO ET AVIS DES LECTEURS (17/11/2026, porteur : démonstration publique avant la sortie).
 *
 * Deux réglages de build, aucun serveur (invariant 1), rien de stocké (invariant 2) :
 *   - EXPO_PUBLIC_APP_MODE=demo : un bandeau discret dit que c'est une version de démonstration ;
 *   - EXPO_PUBLIC_FEEDBACK_EMAIL (à défaut EXPO_PUBLIC_CONTACT_EMAIL) : l'adresse qui reçoit les avis.
 *     Sans adresse, aucun bouton « Laisser un avis » : pas de bouton mort, pas d'adresse inventée.
 * L'avis part par la messagerie du lecteur (mailto:). Le message est pré-rempli avec ce que le lecteur voit
 * de son appareil : version de Repère, date, plateforme et navigateur. Il peut tout effacer avant d'envoyer.
 * Fonctions pures : éprouvées par tests/avis.test.mjs. */

export const MODE_DEMO = process.env.EXPO_PUBLIC_APP_MODE === "demo";
const ADRESSE = process.env.EXPO_PUBLIC_FEEDBACK_EMAIL || process.env.EXPO_PUBLIC_CONTACT_EMAIL || "";
const COURRIEL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const COURRIEL_AVIS: string | null = COURRIEL.test(ADRESSE) ? ADRESSE : null;

export type Systeme = { version: string; date: Date; plateforme: string; navigateur?: string | null };

/* L'AVIS EN TROIS ÉTAPES (Step Up, 25/11/2026) : une note de 1 à 5, des points cochés parmi une liste fixe,
   un texte libre. Rien n'est envoyé par Repère : tout part dans le message que le lecteur relit et envoie. */
export const POINTS_AVIS = ["Facile à comprendre", "Les sources sont claires", "Le design", "Il manque des informations", "C'est lent", "J'ai vu une erreur"] as const;
/* Les trois premiers disent ce qui va, les trois derniers ce qui ne va pas (porteur, 27/11/2026 : le message les sépare). */
const VA_BIEN: readonly string[] = POINTS_AVIS.slice(0, 3);

/* LA PAGE CONCERNÉE (porteur, 27/11/2026) : un choix dans une liste fixe ; il entre dans le sujet du message, pour
   que l'équipe range les avis. Sans choix : « Général ». */
export const THEMES_AVIS = ["Accueil", "L'Assemblée", "Ma commune", "Finances", "Les élus", "Le calendrier", "Le quiz", "Autre"] as const;
export type Reponses = { note?: number | null; points?: string[]; texte?: string; theme?: string | null; prenom?: string | null };

const NOMS_NOTE = ["", "Pas du tout", "Un peu", "Moyennement", "Beaucoup", "Énormément"];
export const SEPARATEUR_TECHNIQUE = "--- Ne pas modifier en dessous de cette ligne ---";

/* Le navigateur en clair (« Safari 18 sur iOS 18.1 ») plutôt que la chaîne entière, longue et illisible dans un
   message ; inconnu : rien, plutôt qu'une supposition. */
export function navigateurCourt(ua: string | null | undefined): string | null {
  if (!ua) return null;
  const v = (re: RegExp) => { const m = ua.match(re); return m ? m[1].replace(/_/g, ".") : null; };
  const os = /iPhone|iPad|iPod/.test(ua) ? `iOS ${v(/OS (\d+(?:_\d+)?)/) || ""}`.trim()
    : /Android/.test(ua) ? `Android ${v(/Android (\d+(?:\.\d+)?)/) || ""}`.trim()
    : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : null;
  const nav = /Edg\//.test(ua) ? `Edge ${v(/Edg\/(\d+)/)}`
    : /Firefox\//.test(ua) ? `Firefox ${v(/Firefox\/(\d+)/)}`
    : /CriOS\//.test(ua) ? `Chrome ${v(/CriOS\/(\d+)/)}`
    : /Chrome\//.test(ua) ? `Chrome ${v(/Chrome\/(\d+)/)}`
    : /Safari\//.test(ua) && /Version\//.test(ua) ? `Safari ${v(/Version\/(\d+)/)}` : null;
  return [nav, os].filter(Boolean).join(" sur ") || null;
}

export function sujetAvis(r: Reponses = {}): string {
  const theme = r.theme && (THEMES_AVIS as readonly string[]).includes(r.theme) ? r.theme : "Général";
  const prenom = (r.prenom || "").trim();
  return `[Avis - ${theme}] ${prenom ? `Retour de ${prenom}` : "Retour d'un lecteur"}`;
}

/* LE MESSAGE (porteur, 27/11/2026) : la note, les points cochés (ce qui va, ce qui ne va pas), le texte libre, puis,
   tout en bas et séparées par une ligne, les informations techniques, en peu de lignes. */
export function corpsAvis(s: Systeme, r: Reponses = {}): string {
  const jour = s.date.toISOString().slice(0, 10);
  const note = r.note && r.note >= 1 && r.note <= 5 ? Math.round(r.note) : null;
  const points = (r.points || []).filter(p => (POINTS_AVIS as readonly string[]).includes(p));
  const va = points.filter(p => VA_BIEN.includes(p)), vaPas = points.filter(p => !VA_BIEN.includes(p));
  const texte = (r.texte || "").trim();
  const nav = navigateurCourt(s.navigateur);
  return [
    /* En toutes lettres : le symbole étoile est refusé par la garde des emoji (conformite.test). */
    note ? `Note : ${note} étoile${note > 1 ? "s" : ""} sur 5 (${NOMS_NOTE[note].toLowerCase()})` : null,
    va.length ? `Ce qui va : ${va.join(", ")}` : null,
    vaPas.length ? `Ce qui ne va pas : ${vaPas.join(", ")}` : null,
    note || points.length ? "" : null,
    "Mon message :",
    texte || "(écrivez ici)",
    "",
    "",
    SEPARATEUR_TECHNIQUE,
    `Repère ${s.version} · ${jour} · ${s.plateforme}${nav ? ` · ${nav}` : ""}`,
  ].filter(l => l !== null).join("\n");
}

export function lienAvis(adresse: string, s: Systeme, r: Reponses = {}): string {
  return `mailto:${adresse}?subject=${encodeURIComponent(sujetAvis(r))}&body=${encodeURIComponent(corpsAvis(s, r))}`;
}

/* SIGNALER UNE ERREUR (filet d'erreurs, 27/11/2026). Sans traceur (invariant 2), Repère ne sait rien d'un plantage
   chez un lecteur : le filet propose de l'écrire. Le message contient l'écran (chemin, jamais la commune : elle vit
   après le « # »), le texte de l'erreur borné à 300 caractères, la version et la date. Le lecteur relit et envoie. */
export function lienSignalement(adresse: string, s: { version: string; date: Date; chemin: string; erreur: string; navigateur?: string | null }): string {
  const lignes = [
    "Bonjour,", "", "Repère a affiché une erreur sur cet écran. (Vous pouvez ajouter ce que vous faisiez.)", "", "", "—",
    `Écran : ${s.chemin.split("#")[0].split("?")[0] || "/"}`,
    `Erreur : ${String(s.erreur || "inconnue").slice(0, 300)}`,
    `Version : ${s.version}`,
    `Date : ${s.date.toISOString().slice(0, 10)}`,
    ...(s.navigateur ? [`Navigateur : ${s.navigateur}`] : []),
  ];
  return `mailto:${adresse}?subject=${encodeURIComponent("Repère : une erreur à signaler")}&body=${encodeURIComponent(lignes.join("\n"))}`;
}
