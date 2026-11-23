/* Modèle B, « la une » (ivoire, 23/11/2026), pour un point de l'agenda : le titre en grand, la date en haut à droite.
   Pas de vote, pas de résultat : un point de calendrier n'a pas encore de position. */
import type { ComponentRef, RefObject } from "react";
import { Text, View } from "react-native";
import { POLICE } from "../../../lib/theme";
import { NEUTRES_CARTE } from "../../../lib/palette";
import { CarteStory, Etiquette, tailleTitre } from "../carte-story";

export function AgendaStory({ refCarte, titre, date, source }: {
  refCarte: RefObject<ComponentRef<typeof View> | null>; titre: string; date: string; source: string;
}) {
  const P = NEUTRES_CARTE.ivoire;
  const t = tailleTitre(titre, 38);
  return (
    <CarteStory refCarte={refCarte} fond="ivoire" filet source={source} invitation="Le calendrier du Parlement"
      etiquette={<Etiquette fond="ivoire" texte="À venir au Parlement" />}
      corps={<>
        <Text numberOfLines={7} style={{ fontFamily: POLICE.affiche, fontSize: t, lineHeight: Math.round(t * 1.12), letterSpacing: -0.6, color: P.encre }}>{titre}</Text>
        <Text style={{ fontFamily: POLICE.texteMoyen, color: P.sourd, fontSize: 18, lineHeight: 24 }}>{date}</Text>
      </>} />
  );
}
