/* LE MODE BUREAU (dashboard desktop, porteur, 25/11/2026). Au-dessus de 1024 px de large, sur le web seulement :
 * barre latérale à gauche au lieu de la barre d'onglets en bas, et tableau de bord sur l'accueil. En dessous,
 * l'application mobile est inchangée. Les deux seuils reprennent ceux de Tailwind (lg 1024, xl 1280) ; le porteur a
 * choisi de garder theme.ts plutôt que Tailwind (25/11/2026). */
import { Platform, useWindowDimensions } from "react-native";

export const LG = 1024, XL = 1280;
export const LARGEUR_BARRE = 240; /* porteur, 26/11/2026 (264 le 25/11) */
/* LA GRILLE DU TABLEAU DE BORD (porteur, 26/11/2026) : 12 colonnes. Chaque rangée donne le nombre de colonnes de
   chaque carte. En xl (1280 px et plus) : 8 + 4, 6 + 6, 8 + 4. En lg (1024 à 1279 px, barre latérale comprise, il
   reste environ 720 px) : les cartes de 8 et de 4 colonnes prennent toute la largeur, l'une sous l'autre ; 6 + 6
   reste côte à côte. Sous 1024 px, pas de tableau de bord : l'application mobile. */
export const COLONNES = 12;
export function etendues(rangee: number[], large: boolean): number[][] {
  if (large || rangee.every(n => n === COLONNES / 2)) return [rangee];
  return rangee.map(n => [n]);
}

export const estBureau = (largeur: number, os: string = Platform.OS) => os === "web" && largeur >= LG;

export function useBureau(): { bureau: boolean; large: boolean } {
  const { width } = useWindowDimensions();
  return { bureau: estBureau(width), large: estBureau(width) && width >= XL };
}

/* Transitions douces au survol (200 ms), sur le web seulement ; ailleurs, rien. */
export const TRANSITION: object = Platform.OS === "web"
  ? { transitionProperty: "background-color, border-color, color, opacity, transform", transitionDuration: "200ms", transitionTimingFunction: "ease-out" }
  : {};

/* LES PAGES DE DÉTAIL SUR ORDINATEUR (porteur, 25/11/2026) : deux colonnes de lecture, comme une page de magazine.
   Le contenu coule de haut en bas dans la première colonne, puis dans la seconde : l'ordre de lecture ne change pas,
   et aucun bloc n'est coupé entre deux colonnes. Le style est posé une fois, par une feuille du navigateur. */
export function poserStylesBureau() {
  if (Platform.OS !== "web" || typeof document === "undefined" || document.getElementById("repere-bureau")) return;
  const el = document.createElement("style");
  el.id = "repere-bureau";
  el.textContent = [
    '[data-bureau-colonnes="1"]{display:block!important;column-count:2;column-gap:56px}',
    /* Textes en bloc (26/11/2026) : sans flex autour, react-native-web rend un texte (dir="auto") « en ligne » ; deux
       paragraphes qui se suivaient se collaient (« …l'association.Repère ne collecte… », Soutenir à 1440 px). Seuls
       les textes : un display:block sur une rangée en flex la casserait. */
    '[data-bureau-colonnes="1"]>*{break-inside:avoid;margin-bottom:24px}',
    '[data-bureau-colonnes="1"]>[dir="auto"]{display:block}',
  ].join("\n");
  document.head.appendChild(el);
}

/* MICRO-INTERACTIONS (polish, porteur, 25/11/2026) : sur le web, tout ce qui se touche (bouton, lien, onglet, case,
   interrupteur) change de fond, de filet ou d'opacité en 200 ms, au lieu de sauter. Rien si le lecteur a demandé
   moins de mouvement (préférence du système). */
export function poserStylesWeb() {
  if (Platform.OS !== "web" || typeof document === "undefined" || document.getElementById("repere-transitions")) return;
  const el = document.createElement("style");
  el.id = "repere-transitions";
  el.textContent = '@media (prefers-reduced-motion: no-preference){[role="button"],[role="link"],[role="tab"],[role="switch"],[role="radio"],[role="checkbox"]{transition:background-color 200ms ease-out,border-color 200ms ease-out,opacity 200ms ease-out,transform 200ms ease-out,box-shadow 200ms ease-out}}';
  document.head.appendChild(el);
}

/* FONDU ENTRE ÉCRANS SUR LE WEB (porteur, 26/11/2026 : « transitions douces sur les changements d'écran »).
   Sur téléphone, la pile native glisse déjà (iOS, Android) et les onglets ont leur fondu (animation: "fade").
   Sur le web, la pile ne s'anime pas : un écran remplaçait l'autre d'un coup. On fond le contenu en 200 ms
   quand on entre dans un écran de la pile ou qu'on en sort ; pas entre deux onglets (ils ont déjà le leur).
   Jamais si le lecteur a demandé moins de mouvement (système ou Confort de lecture). */
export const ONGLETS = new Set(["/", "/qui-decide", "/chez-vous", "/finances", "/a-venir"]);
export function doitFondre(avant: string | null, apres: string): boolean {
  if (!avant || avant === apres) return false;
  return !(ONGLETS.has(avant) && ONGLETS.has(apres));
}
export function fondreEcran(avant: string | null, apres: string, reduit: boolean) {
  if (Platform.OS !== "web" || typeof document === "undefined" || reduit || !doitFondre(avant, apres)) return;
  if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const pile = document.querySelector('[data-testid="pile"]') as (HTMLElement & { animate?: (k: object[], o: object) => unknown }) | null;
  pile?.animate?.([{ opacity: 0.35 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
}
