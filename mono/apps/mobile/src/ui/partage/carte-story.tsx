/* LE GABARIT DES CARTES DE PARTAGE (refonte du 23/11/2026, audit pré-bêta M2, modèles A à D validés par le porteur).
 *
 * 360 x 640 pt, capturé à 1080 x 1920 px. Mesuré avant : aucune adresse ni invitation (une story vue ne menait
 * nulle part), marque en haut sous le bandeau d'Instagram, source en bas sous la zone de réponse.
 * Désormais :
 *   - ZONES SÛRES d'Instagram et de TikTok : rien d'écrit dans les 250 px du haut ni les 340 px du bas (sur 1920),
 *     soit HAUT_SUR et BAS_SUR ici ; garde : tests/partage-story-web.mjs ;
 *   - en haut, la marque (logo et « Repère ») ; en pied, un bouton dessiné : l'invitation et l'adresse publique (Step Up, 25/11/2026) ;
 *   - la source juste au-dessus du pied, toujours écrite (invariant 4).
 * Deux fonds neutres (palette.ts, NEUTRES_CARTE), fixes quel que soit le thème du téléphone. */
import type { ComponentRef, ReactNode, RefObject } from "react";
import { Text, View } from "react-native";
import { NEUTRES_CARTE, type FondCarte } from "../../lib/palette";
import { POLICE } from "../../lib/theme";
import { ADRESSE_PUBLIQUE } from "../../lib/adresse-publique";
import { Logo } from "../logo";

export const LARGEUR_CARTE = 360, HAUTEUR_CARTE = 640;
/* 250 / 1920 et 340 / 1920, ramenés à 640 pt, arrondis vers le haut. */
export const HAUT_SUR = 84, BAS_SUR = 114;
export const HOTE_PUBLIC = ADRESSE_PUBLIQUE.replace(/^https?:\/\//, "");

export function CarteStory({ refCarte, fond = "nuit", corps, source, invitation, etiquette, filet = false }: {
  refCarte: RefObject<ComponentRef<typeof View> | null>; fond?: FondCarte; corps: ReactNode; source: string;
  /* « Et chez vous ? », « Tapez votre commune », « Jouer »… : une invitation courte, avant l'adresse. */
  invitation: string;
  /* La ligne du haut : « Melun · budget 2025 », « Ce qui s'est passé »… */
  etiquette?: ReactNode;
  /* Modèles « une » (B, D) : un filet d'encre sous l'étiquette et au-dessus du pied. */
  filet?: boolean;
}) {
  const P = NEUTRES_CARTE[fond];
  return (
    <View ref={refCarte} collapsable={false} testID="carte-story"
      style={{ width: LARGEUR_CARTE, height: HAUTEUR_CARTE, backgroundColor: P.sol, paddingTop: HAUT_SUR, paddingBottom: BAS_SUR, paddingHorizontal: 30 }}>
      {/* Step Up (porteur, 25/11/2026) : la marque EN HAUT, juste sous la zone masquée par Instagram ; l'appel à
          l'action EN BAS, dans un bouton dessiné (contour, pas d'aplat : le texte garde 4,5:1 sur le fond de la carte). */}
      <View testID="carte-marque" style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Logo size={34} c={P} />
        <Text style={{ color: P.encre, fontFamily: POLICE.affiche, fontSize: 20, lineHeight: 24 }}>Repère</Text>
      </View>
      {etiquette ? (
        <View style={{ paddingBottom: 12, marginBottom: 8, borderBottomWidth: filet ? 2 : 0, borderBottomColor: P.encre }}>{etiquette}</View>
      ) : null}
      <View style={{ flex: 1, justifyContent: "center", gap: 18 }}>{corps}</View>
      <Text testID="carte-source" numberOfLines={2} style={{ color: P.sourd, fontSize: 12, lineHeight: 16, marginBottom: 12 }}>{source}</Text>
      <View testID="carte-pied" style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: P.encre }}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: P.encre, fontFamily: POLICE.texteMoyen, fontSize: 14, lineHeight: 20 }}>{invitation}</Text>
          {/* L'adresse a sa ligne : elle ne doit jamais être coupée (vu le 23/11 : « repere-cit… »). */}
          <Text numberOfLines={1} style={{ color: P.encre, fontFamily: POLICE.donneeForte, fontSize: 12, lineHeight: 16 }}>{HOTE_PUBLIC}</Text>
        </View>
        <Text style={{ color: P.encre, fontFamily: POLICE.affiche, fontSize: 20, lineHeight: 24 }} accessible={false}>→</Text>
      </View>
    </View>
  );
}

/* L'étiquette du haut, en capitales espacées (police à chasse fixe), comme dans les maquettes. */
export function Etiquette({ texte, droite, fond = "nuit" }: { texte: string; droite?: string; fond?: FondCarte }) {
  const P = NEUTRES_CARTE[fond];
  const st = { color: fond === "ivoire" ? P.encre : P.sourd, fontFamily: POLICE.donnee, fontSize: 12, lineHeight: 16, letterSpacing: 1, textTransform: "uppercase" as const };
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
      <Text numberOfLines={1} style={[st, { flexShrink: 1 }]}>{texte}</Text>
      {droite ? <Text numberOfLines={1} style={[st, { color: P.sourd }]}>{droite}</Text> : null}
    </View>
  );
}

/* La taille d'un grand titre selon sa longueur : il tient toujours entre l'étiquette et la source. */
export function tailleTitre(texte: string, grand = 40): number {
  const n = texte.length;
  /* Step Up (25/11/2026) : la marque, montée en haut, prend 50 pt ; les titres longs descendent d'un cran. */
  return n > 140 ? Math.round(grand * 0.5) : n > 90 ? Math.round(grand * 0.6) : n > 50 ? Math.round(grand * 0.72) : grand;
}
