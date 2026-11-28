/* LA PALETTE DE REPERE MOBILE, EN DONNEES PURES — 29/10/2026.
 *
 * Deux thèmes : clair (valeurs de l'application depuis le 30/09/2026, inchangées)
 * et sombre (ajouté le 29/10/2026). Ce module ne dépend d'aucun composant : il
 * est lu par theme.ts ET directement par les tests (tests/theme.test.mjs), qui
 * vérifient les contrastes et l'amplitude sur les vraies valeurs.
 *
 * INVARIANTS RESPECTÉS :
 * - les cinq couleurs d'échelon viennent de @repere/data-utils (invariant 7),
 *   jamais recopiées ici ; seule la couleur « France » change de bord en
 *   sombre (c'est l'encre du produit, voir ECHELONS_PAR_MODE) ;
 * - tout le reste est neutre, amplitude RGB <= 24 (invariant 7) ;
 * - couleurs de vote (D24, 30/10/2026, ADR 0003, invariant 7 complété) : vert pour,
 *   rouge contre, gris abstention, dans COULEURS_VOTE et nulle part ailleurs. Elles
 *   codent le sens du vote, un fait ; la position reste écrite en toutes lettres.
 *
 * LE THÈME SOMBRE N'EST PAS LA PALETTE 2026 DE LA BRANCHE ux/theme-sombre-20-10 :
 * celle-ci change aussi le clair (fond bleu-gris, accents émeraude, corail pour
 * « contre »). Elle n'est pas reprise ici : elle touche à l'invariant 7 et à la
 * neutralité du vote, et relève d'une décision du fondateur (DECISIONS). */
import { ECHELONS } from "@repere/data-utils";

export type Mode = "clair" | "sombre";
export type Echelon = keyof typeof ECHELONS;

export type Neutres = {
  sol: string; carte: string; encre: string; sourd: string;
  trait: string; voile: string; blanc: string; lien: string;
};

/* Neutres du clair : « Néo-Civique » des maquettes Stitch (09/11/2026, invariant 7 amendé par le
   porteur, « tout Stitch »). Lin bleuté, cartes blanches bordées, ardoise pour le texte, pétrole
   pour les liens. Contrastes mesurés dans tests/theme.test.mjs. Le gris secondaire est l'ardoise
   #475569 de Stitch, pas son #64748B : celui-ci tombe à 3,86:1 sur les teintes d'échelon et
   à 4,28:1 sur les pastilles (mesuré dans le navigateur, parcours-web), sous le seuil AA. */
/* Step Up (porteur, 25/11/2026) : la MÊME famille de gris chauds que le sombre. Avant : ardoise bleutée
   (#F8FAFC, #0F172A, #475569) en clair, gris chauds en sombre ; l'audit UI y voyait deux applications.
   Contrastes calculés : encre sur sol 16,6:1, sourd sur sol 6,1:1, sourd sur carte 6,6:1 (AA : 4,5:1). */
/* Refonte « premium » (porteur, 25/11/2026) : gris froids très doux, page gris pâle et cartes blanches, filets
   fins. Le blanc des cartes garde les contrastes mesurés des couleurs de vote (A2). Amplitude RGB sous 24 partout :
   l'interface reste neutre (invariant 7), sans amendement. */
const NEUTRES_CLAIR: Neutres = {
  sol: "#F9FAFB", carte: "#FFFFFF", encre: "#111827", sourd: "#5B6270",
  trait: "#E5E7EB", voile: "#F3F4F6", blanc: "#ffffff", lien: "#111827",
};

/* Neutres du sombre : même famille chaude que le clair (pas de bleu), mesurés
   dans tests/theme.test.mjs. DA premium (07/11/2026) : encre sur sol 15,9:1 ; sourd sur carte 6,9:1. */
/* 07/11/2026 : « sombre minéral » des maquettes Stitch (surface, surface-container, on-surface,
   on-surface-variant, outline), validé par le porteur. « sourd » : #8E8B82 demandé, mais 4,32:1
   sur le voile, sous le seuil AA ; #928F86 est la nuance la plus proche qui le tient (4,55:1). */
/* 09/11/2026 : « Dark Luxury » des maquettes Stitch (invariant 7 amendé, « tout Stitch ») : textes
   #F8FAFC et #94A3B8, liens en or mat. Sol, carte et trait inchangés (déjà ceux de Stitch). */
/* 09/11/2026 (docs/historique/DESIGN.md « Dark Luxury », complément du porteur) : texte en ivoire lin #F5F4F0,
   métadonnées en gris minéral #9C9A92, filets #2B2A26. Sol et carte inchangés. */
/* Refonte « premium » (porteur, 25/11/2026 : « un gris bleuté profond, pas du noir ») : graphite froid, cartes un
   cran plus claires pour la profondeur. Le porteur citait les ardoises « 0F172A » et « 1E293B » : leur amplitude RGB (27 à 29)
   dépasse la limite des neutres (invariant 7), et le vote « pour » daltonien y tombait sous 3:1. Ces gris en sont
   le plus proche qui tient les deux (mesuré dans tests/theme.test.mjs). */
const NEUTRES_SOMBRE: Neutres = {
  sol: "#0D1117", carte: "#171D26", encre: "#F3F4F6", sourd: "#9CA3AF",
  trait: "#2A313C", voile: "#212833", blanc: "#ffffff", lien: "#F3F4F6",
};
/* Pour le filet d'erreurs (ui/filet.tsx, 27/11/2026) : il s'affiche quand l'application a planté, donc sans le
   fournisseur de thème ; il prend ces neutres directement, selon le mode du système. */
export const NEUTRES_FILET = Object.freeze({ clair: NEUTRES_CLAIR, sombre: NEUTRES_SOMBRE });
/* Les cartes de partage gardent le sombre chaud du 23/11 : leurs modèles A à D sont validés tels quels. */
const NUIT_CARTE: Neutres = {
  sol: "#141311", carte: "#1F1E1B", encre: "#F5F4F0", sourd: "#9C9A92",
  trait: "#2B2A26", voile: "#2A2823", blanc: "#ffffff", lien: "#F5F4F0",
};

/* L'INTERFACE RESTE NEUTRE (décision du porteur, 09/11/2026, après la PR #181) : noir, ivoire,
   gris. L'émeraude est réservée aux DONNÉES DE VOTE (barres, pastilles, badges) : sur un bouton
   ou un titre, elle se lirait « pour = bien ». Ces rôles gardent leurs noms pour les écrans,
   mais tous pointent vers des neutres de la palette.
   - autorite, texteAccent : l'encre (titres d'autorité, onglet actif, bouton plein) ;
   - civique : le gris secondaire (filet du cartouche « En clair », point d'onglet actif) ;
   - fondCivique : le gris des pastilles (fond du cartouche « En clair ») ;
   - surAutorite : le texte posé sur un bouton plein. */
export type Accents = { autorite: string; texteAccent: string; civique: string; fondCivique: string; surAutorite: string };
export const ACCENTS_PAR_MODE: Readonly<Record<Mode, Accents>> = Object.freeze({
  clair: { autorite: "#111827", texteAccent: "#111827", civique: "#5B6270", fondCivique: "#F3F4F6", surAutorite: "#FFFFFF" },
  sombre: { autorite: "#F3F4F6", texteAccent: "#F3F4F6", civique: "#9CA3AF", fondCivique: "#212833", surAutorite: "#0D1117" },
});

/* Les échelons : identiques dans les deux thèmes, sauf « France ». */
export const ECHELONS_PAR_MODE: Record<Mode, Record<Echelon, string>> = {
  clair: { ...ECHELONS },
  sombre: { ...ECHELONS, france: NEUTRES_SOMBRE.encre },
};

/* Teintes d'échelon : fond de carte + quelques pour cent de l'échelon. Chacune
   reste sous l'amplitude 24 (invariant 7) et porte un texte encre à plus de
   12:1. Clair : valeurs de main, inchangées. */
export const TEINTES_PAR_MODE: Record<Mode, Record<Echelon, string>> = {
  clair: { ville: "#dbeaee", agglo: "#e4f3f7", dept: "#f7ece4", region: "#efe7fb", france: "#ecebe8" },
  sombre: { ville: "#1D2728", agglo: "#1C2B2C", dept: "#2E2218", region: "#281E31", france: "#1B212B" },
};

export const NEUTRES_PAR_MODE: Record<Mode, Neutres> = { clair: NEUTRES_CLAIR, sombre: NEUTRES_SOMBRE };

/* LES CARTES DE PARTAGE (23/11/2026, modèles A à D validés par le porteur). Deux fonds, tous deux neutres
   (invariant 7 : noir, ivoire, gris ; aucune couleur de parti, aucun émeraude) :
   - « nuit » (A, C) : les neutres du sombre de l'application ;
   - « ivoire » (B, D) : papier chaud. Contrastes calculés : encre 16,0:1, sourd 6,7:1 (seuil AA : 4,5:1). */
export type FondCarte = "nuit" | "ivoire";
export const NEUTRES_CARTE: Record<FondCarte, Neutres> = {
  nuit: NUIT_CARTE,
  ivoire: { sol: "#F5F1E8", carte: "#FFFFFF", encre: "#171614", sourd: "#57544D", trait: "#171614", voile: "#EAE4D6", blanc: "#ffffff", lien: "#171614" },
};

/* Ombres : en sombre, l'ombre se voit par l'opacité du noir, pas par l'encre. */
export const OMBRE_PAR_MODE = {
  /* Refonte « légère » (09/11/2026) : une ombre à peine visible. */
  /* Step Up (25/11/2026) : une ombre douce qui détache la carte du sol ivoire. */
  /* Premium (25/11/2026) : une ombre à peine là ; le filet fait le travail. */
  clair: { shadowColor: "#111827", shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  /* DA premium (07/11/2026) : noir à 20 %, flou 20, décalage 5. Le clair, gardé par le banc
     de non-régression, n'est pas touché. */
  /* docs/historique/DESIGN.md (09/11/2026) : en sombre, la profondeur vient des surfaces et des filets, pas d'une ombre
     sous les cartes. */
  sombre: { shadowColor: "#000000", shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
} as const;

/* La palette des cartes de partage, figée et sombre (décision D5 du porteur, 30/10/2026).
   La carte est une image qui part dans une messagerie : elle garde la même apparence quel
   que soit le thème du téléphone. */
export const PALETTE_CARTE = Object.freeze({
  ...ECHELONS_PAR_MODE.sombre, ...NEUTRES_SOMBRE,
});

/* Contraste WCAG entre deux couleurs hexadécimales (D17). Sert à décider si un
   point d'échelon doit recevoir un contour clair pour rester distinct de sa carte. */
const canal = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function luminance(h: string): number {
  const c = canal(h).map(v => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function rapportContraste(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/* Seuil des éléments non textuels (WCAG 1.4.11). En dessous, le point d'échelon
   reçoit un contour de l'encre (un trait, pas une couleur nouvelle). */
export const SEUIL_POINT = 3;

/* Voile derriere la fenetre de reglage d'affichage (assombrit l'ecran dessous). */
export const VOILE_MODAL = "rgba(0,0,0,0.4)";

/* Couleurs de groupes politiques (invariant 7, amendé le 30/10/2026) : identification
   des élus seulement (badges, cartes de partage). Jamais un vote ni un score. « Inconnu » sert de repli : aucun groupe n'est déduit ni estimé. */
/* LES COULEURS DE VOTE (D24, puis A2 le 30/10/2026 : vert assombri, valeur D24 remplacee).
   Sur la carte claire (#FFFFFF) : 4,52 / 5,36 / 4,55:1, au-dessus de 4,5:1 (WCAG AA texte),
   verifie par tests/theme.test.mjs. Sur le sol clair, le vert et le gris restent sous 4,5:1 :
   les barres sont toujours posees sur une carte. Detail : docs/adr/0003-couleurs-votes.md. */
/* 09/11/2026 : couleurs Stitch (invariant 7 amendé par le porteur, « tout Stitch ») : émeraude,
   corail, ardoise. Mesuré : sur la carte claire 2,98 / 6,29 / 2,56:1 ; sur la carte sombre
   5,59 / 2,65 / 6,50:1. Sous le seuil du texte : ces couleurs remplissent des barres et des
   pastilles, le libellé du vote est toujours écrit en toutes lettres, dans l'encre. */
export const COULEURS_VOTE = Object.freeze({
  votePour: "#00A896",
  voteContre: "#BE123C",
  voteAbstention: "#94A3B8",
});

/* VARIANTE DALTONIENNE (D56, 30/10/2026) : réglage « mode daltonien » du profil. Palette
   Okabe-Ito : bleu #0072B2 (pour), vermillion assombri #B35900 (contre), même gris que le mode
   normal (abstention). Le vermillion est assombri pour atteindre 4,5:1 sur carte blanche.
   Vérifié par tests/theme.test.mjs et tests/daltonisme.test.mjs. */
export const COULEURS_VOTE_DALTONIEN = Object.freeze({
  votePour: "#0072B2",
  voteContre: "#B35900",
  voteAbstention: "#6E7781",
});

/* 12/11/2026 (porteur : « couleurs plus vives et contrastées pour les groupes ») : teintes plus saturées, mêmes
   familles qu'avant, toujours 12 couleurs, et DOUZE TEINTES DISTINCTES (aucune paire sous 60 de distance RVB :
   plus aucun groupe n'a besoin d'être cerné). Contraste mesuré sur la carte claire (#FFFFFF) / sombre (#1F1E1B) :
   LFI 4,2/4,0 ; RN 9,2/1,8 ; EPR 1,6/10,8 ; LÉ 2,7/6,3 ; LR 2,7/6,1 ; SOC 2,6/6,5 ; HOR 2,5/6,8 ; DEM 2,5/6,8 ;
   LIOT 3,6/4,7 ; GDR 8,7/1,9 ; NI 2,5/6,7 ; Inconnu 6,1/2,7. Sous 3:1 : l'hémicycle cerne alors le point d'un trait
   gris (ui/hemicycle) et le nom du groupe est toujours écrit à côté. Identification des élus seulement. */
export const COULEURS_GROUPES: Readonly<Record<string, string>> = Object.freeze({
  LFI: "#E63946", RN: "#2236B8", EPR: "#FFC83D", "LÉ": "#2DB55D", LR: "#3FA2F6", SOC: "#FF6FAE",
  HOR: "#12B5CB", DEM: "#F28C28", LIOT: "#9B6DF5", GDR: "#8F1D3F", NI: "#A0A5AD", Inconnu: "#5B6270",
  /* 28/11/2026 (porteur, hotfix H5) : UDR avait le gris « Inconnu », comme trois autres groupes. Treizième teinte
     (ADR 0001 amendé) : bleu de la famille de droite, à 68 de distance RVB de LR (la plus proche) ; contraste
     4,8:1 sur la carte claire, 3,5:1 sur la carte sombre. Identification des élus seulement. */
  UDR: "#5864E8",
});

/* LES SIGLES DE LA 17E LÉGISLATURE (28/11/2026, hotfix H5). L'Assemblée publie « DR », « EcoS » et « Dem » ; la palette
   les connaissait sous leurs anciens sigles. Résultat mesuré en production le 28/11 : EcoS, Dem, DR et UDR avaient tous le
   gris « Inconnu » (rgb(91, 98, 112)) dans l'hémicycle. La correspondance est écrite ici, une fois, comme pour le Sénat :
   même famille, même couleur (décisions du porteur, 13/10 et 20/10/2026). Un sigle absent reste gris : rien n'est deviné. */
export const SIGLES_EQUIVALENTS: Readonly<Record<string, string>> = Object.freeze({ DR: "LR", EcoS: "LÉ", Dem: "DEM" });

/* LA couleur d'un groupe de l'Assemblée, à partir de son sigle publié. Une seule fonction pour tous les écrans. */
export function couleurDuGroupe(sigle: string): string {
  return COULEURS_GROUPES[sigle] ?? COULEURS_GROUPES[SIGLES_EQUIVALENTS[sigle] ?? ""] ?? COULEURS_GROUPES.Inconnu;
}

/* Point d'une étape de la Timeline (05/11/2026, demande du porteur). Gris neutre : il ne code
   ni un vote ni une opinion. 09/11/2026 : l'ardoise des métadonnées de Stitch (l'ancien gris était
   celui de l'abstention D24). Contraste mesuré (objet graphique, 3:1) : 4,76:1 sur la carte claire,
   3,50:1 sur la carte sombre. */
/* QUIZ CIVIQUE (13/11/2026, décision du porteur, ADR 0009) : le retour d'une réponse. Vert sauge si elle est juste,
   rouge brique si elle est fausse. Ces deux teintes ne servent QU'AU QUIZ (une question de vocabulaire a une bonne
   réponse) : jamais à un vote, une position, un élu, un parti ou une commune. Elles sont volontairement distinctes
   de l'émeraude et du corail des votes. Le texte posé dessus est blanc (contraste mesuré : 4,9 et 6,0 pour 1), et
   la couleur n'est jamais seule : une coche ou une croix, et le mot « Juste » ou « Faux », l'accompagnent. */
export const COULEURS_QUIZ = Object.freeze({ juste: "#4A7C59", faux: "#AA4A4A", texte: "#FFFFFF" });

/* LES GROUPES DU SENAT (13/11/2026, decision de l'agent, a confirmer par le porteur).
   AUCUNE COULEUR NOUVELLE : chaque groupe du Senat reprend la teinte deja attribuee, dans
   COULEURS_GROUPES, a la meme famille politique a l'Assemblee. La palette reste a douze couleurs
   (ADR 0001, invariant 7), et ces teintes servent ici a ce qu'elles servent partout : RECONNAITRE un
   groupe, jamais coder un vote, une opinion ou un rang.
   La correspondance est ecrite ici, en toutes lettres, parce qu'elle est un choix et non un fait :
   un groupe du Senat n'EST pas un groupe de l'Assemblee. Un sigle absent de cette table reste gris. */
export const COULEURS_GROUPES_SENAT: Readonly<Record<string, string>> = Object.freeze({
  "Les Républicains": COULEURS_GROUPES.LR,   /* meme famille que le groupe LR de l'Assemblee */
  LR: COULEURS_GROUPES.LR,
  UCI: COULEURS_GROUPES.DEM,                 /* Union Centriste et Independants : centre, comme DEM */
  UC: COULEURS_GROUPES.DEM,
  SER: COULEURS_GROUPES.SOC,                 /* Socialiste, Ecologiste et Republicain */
  RDPI: COULEURS_GROUPES.EPR,                /* Rassemblement des democrates, progressistes et independants */
  RDSE: COULEURS_GROUPES.LIOT,               /* Rassemblement Democratique et Social Europeen */
  GEST: COULEURS_GROUPES["LÉ"],              /* Ecologiste - Solidarite et Territoires */
  "CRCE-K": COULEURS_GROUPES.GDR,            /* Communiste Republicain Citoyen et Ecologiste - Kanaky */
  CRCE: COULEURS_GROUPES.GDR,
  "Les Indépendants": COULEURS_GROUPES.HOR,  /* Les Independants - Republique et Territoires */
  LI: COULEURS_GROUPES.HOR,
});

export const POINT_ETAPE = "#64748B";

/* Le reflet et l'ombre d'un avatar (07/11/2026) : blanc et noir translucides, posés sur la
   couleur du groupe pour un dégradé ; ils ne changent pas la teinte qui identifie le groupe. */
export const REFLET_AVATAR = { clair: "rgba(255,255,255,0.22)", ombre: "rgba(0,0,0,0.18)" };

/* LA JAUGE DU BUDGET (maquettes Stitch). Amendements de l'invariant 7 par le porteur, 08/11 puis
   09/11/2026 (« tout Stitch ») : une palette par thème, couleurs de données financières, pour cette
   jauge seulement, jamais politiques. La légende écrite porte le sens.
   Clair (porteur, 09/11/2026, refonte « légère ») : tons pastel, bleu (salaires), vert sauge
   (investissements), gris clair (autres). Sous 3:1 sur la carte blanche (1,5 à 2,6:1) : la légende
   écrit chaque part, la couleur ne porte jamais seule le sens. L'émeraude reste réservée aux votes.
   Sombre : or mat, indigo, ardoise (inchangé). */
export const JAUGE_BUDGET_PAR_MODE = Object.freeze({
  clair: { salaires: "#8B9DC3", investissement: "#A3C9A8", autres: "#D3D3D3" },
  sombre: { salaires: "#D4AF37", investissement: "#818CF8", autres: "#475569" },
});

/* LE BADGE « DÉCLARATION DE CANDIDATURE » (12/11/2026, demande du porteur : badge orange). Il dit que le nom vient
   d'une annonce relevée dans la presse, pas de la liste officielle. Une seule teinte, la même pour tous les
   candidats : elle ne code ni un parti, ni une opinion, ni un rang. Texte sur fond : 6,4:1 en clair, 8,8:1 en sombre. */
export const BADGE_DECLARATION_PAR_MODE = Object.freeze({
  clair: { fond: "#FFEDD5", texte: "#9A3412", filet: "#FB923C" },
  sombre: { fond: "#3B2210", texte: "#FDBA74", filet: "#C2410C" },
});

/* FILET DES TUILES DE L'ACCUEIL (web, 12/11/2026, demande du porteur) : une tuile blanche sur fond presque blanc
   disparaissait en mode clair. Un filet neutre, sans sens : ce n'est ni un parti, ni un vote, ni un rang. */
export const FILET_TUILE_PAR_MODE = Object.freeze({ clair: { filet: "#E2E8F0" }, sombre: { filet: "#2B2A26" } });

/* Polish (porteur, 25/11/2026). Une couleur du thème rendue translucide (barre d'onglets floutée du web), et l'ombre
   intérieure du champ de recherche : deux effets, aucune teinte nouvelle. */
export function translucide(hex: string, alpha: number): string {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
export const OMBRE_INTERIEURE_CHAMP = "inset 0 1px 2px rgba(0, 0, 0, 0.05)";

/* LES TEINTES DU HUB DES OUTILS CITOYENS (porteur, 27/11/2026, ADR 0014 — amendement de l'invariant 7).
   Une teinte par CATEGORIE de service public (jamais un parti, un vote, un elu ou un territoire), pastel en clair,
   sombre et peu saturee en sombre ; variante daltonienne tiree d'Okabe-Ito (bleu, orange, ciel, vert bleute,
   jaune, pourpre). La couleur n'est jamais seule : le nom de la categorie reste ecrit sur chaque carte.
   Contraste du pictogramme (encre) sur la teinte : 3:1 au moins, teste (outils.test.mjs). */
export const TEINTES_OUTILS = Object.freeze({
  clair: {
    normal: { "Identité et connexion": "#DBEAFE", "Démarches et droits": "#EDE9FE", "Impôts": "#FEF9C3", "Santé": "#FCE7F3", "Aides et famille": "#ECFCCB", "Emploi et formation": "#CFFAFE" },
    daltonien: { "Identité et connexion": "#CCE3F2", "Démarches et droits": "#FBE3C4", "Impôts": "#FCF8CC", "Santé": "#F2DCE8", "Aides et famille": "#C9EDE2", "Emploi et formation": "#D6EEFA" },
  },
  sombre: {
    normal: { "Identité et connexion": "#1E3A5F", "Démarches et droits": "#3B2F5C", "Impôts": "#4A3F12", "Santé": "#4A2238", "Aides et famille": "#2F3F12", "Emploi et formation": "#134049" },
    daltonien: { "Identité et connexion": "#0B3A5A", "Démarches et droits": "#5A3D00", "Impôts": "#5A5410", "Santé": "#4D2A3F", "Aides et famille": "#00402F", "Emploi et formation": "#1C4A66" },
  },
});
