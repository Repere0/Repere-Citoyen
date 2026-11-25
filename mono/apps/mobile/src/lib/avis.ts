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
export type Reponses = { note?: number | null; points?: string[]; texte?: string };

export function corpsAvis(s: Systeme, r: Reponses = {}): string {
  const jour = s.date.toISOString().slice(0, 10);
  const note = r.note && r.note >= 1 && r.note <= 5 ? Math.round(r.note) : null;
  const points = (r.points || []).filter(p => (POINTS_AVIS as readonly string[]).includes(p));
  const texte = (r.texte || "").trim();
  return [
    note ? `Ma note : ${note} sur 5` : null,
    points.length ? `Ce qui compte pour moi : ${points.join(", ")}` : null,
    note || points.length ? "" : null,
    "Mon avis sur Repère :",
    texte || "",
    "",
    texte ? null : "Ce que je faisais :",
    texte ? null : "",
    "",
    "---",
    "Informations techniques (vous pouvez les effacer) :",
    `Version : ${s.version}`,
    `Date : ${jour}`,
    `Plateforme : ${s.plateforme}`,
    s.navigateur ? `Navigateur : ${s.navigateur}` : null,
  ].filter(l => l !== null).join("\n");
}

export function lienAvis(adresse: string, s: Systeme, r: Reponses = {}): string {
  return `mailto:${adresse}?subject=${encodeURIComponent(`Avis sur Repère ${s.version}`)}&body=${encodeURIComponent(corpsAvis(s, r))}`;
}
