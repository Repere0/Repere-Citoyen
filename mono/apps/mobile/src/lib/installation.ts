/* INSTALLER REPÈRE SUR L'ÉCRAN D'ACCUEIL (porteur, 27/11/2026 : « le point critique pour ne pas passer par l'App
 * Store »). Fonctions pures, éprouvées par tests/installation.test.mjs ; le bandeau est ui/invitation-installation.tsx.
 *
 * Trois cas, et seulement sur un téléphone ou une tablette, dans le navigateur :
 *   - « android » : Chrome (et cousins) a envoyé `beforeinstallprompt` ; un bouton « Installer » ouvre sa fenêtre ;
 *   - « ios » : iPhone ou iPad ; aucun navigateur iOS n'ouvre de fenêtre d'installation : on montre le geste
 *     (Partager, puis « Sur l'écran d'accueil ») sur la page /installer ;
 *   - null : déjà installée (affichage autonome), ordinateur, application native, ou rien de possible : RIEN.
 *
 * RIEN N'EST GARDÉ (invariant 2 : deux clés, aucune troisième) : « Plus tard » cache le bandeau jusqu'à la prochaine
 * ouverture de l'application. Le garder refermé pour de bon demanderait un champ de plus dans `repere.profil`,
 * donc un ADR du porteur. */
export type Installation = "android" | "ios" | null;

export function estIos(ua: string, plateforme = "", pointsTactiles = 0): boolean {
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  /* iPadOS se présente comme un Mac : un « Mac » tactile est un iPad. */
  return /Macintosh/.test(ua) && (plateforme === "MacIntel" || plateforme === "") && pointsTactiles > 1;
}

export function installationPossible(o: { ua: string; plateforme?: string; pointsTactiles?: number; autonome: boolean; invite: boolean; large: boolean }): Installation {
  if (o.autonome || o.large) return null;
  if (o.invite) return "android";
  if (estIos(o.ua, o.plateforme, o.pointsTactiles)) return "ios";
  return null;
}

/* Déjà installée ? Safari iOS : navigator.standalone ; les autres : la requête média display-mode. */
export function estAutonome(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  return typeof window.matchMedia === "function" && (window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches);
}

/* L'invitation d'Android arrive UNE fois, tôt, parfois avant que React ait monté le bandeau : on l'écoute dès le
   chargement de ce module (web seulement) et on la garde en mémoire, sans rien écrire. */
type Invitation = Event & { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };
let invitation: Invitation | null = null;
let installee = false;
const abonnes = new Set<() => void>();
const prevenir = () => abonnes.forEach(f => f());
if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); invitation = e as Invitation; prevenir(); });
  window.addEventListener("appinstalled", () => { installee = true; invitation = null; prevenir(); });
}
export const invitationAndroid = () => invitation;
export const vientDEtreInstallee = () => installee;
export function abonner(f: () => void) { abonnes.add(f); return () => { abonnes.delete(f); }; }
/* Ouvre la fenêtre d'installation d'Android. Elle ne sert qu'une fois : ensuite, le navigateur n'en redonne pas. */
export async function installerAndroid(): Promise<"acceptee" | "refusee" | "indisponible"> {
  const i = invitation;
  if (!i) return "indisponible";
  invitation = null;
  try { await i.prompt(); const c = i.userChoice ? await i.userChoice : null; prevenir(); return c && c.outcome === "accepted" ? "acceptee" : "refusee"; }
  catch { prevenir(); return "indisponible"; }
}

/* « Plus tard » : en mémoire jusqu'à la prochaine ouverture (rien n'est stocké, invariant 2). */
let plusTard = false;
export const refuseeCetteFois = () => plusTard;
export function refuserCetteFois() { plusTard = true; prevenir(); }
