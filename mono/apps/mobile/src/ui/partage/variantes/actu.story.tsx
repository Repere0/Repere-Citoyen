/* Modèle B, « la une » (ivoire, 23/11/2026) : une actualité, comme une une de journal. L'étiquette dit d'où elle
   vient (« Ce qui s'est passé au Parlement », « Actualité locale · Melun »), le titre de l'enregistrement en grand,
   sa première phrase telle quelle. Le texte n'est jamais réécrit ici. */
import type { ComponentRef, RefObject } from "react";
import { Text, View } from "react-native";
import { POLICE } from "../../../lib/theme";
import { NEUTRES_CARTE } from "../../../lib/palette";
import { CarteStory, Etiquette, tailleTitre } from "../carte-story";

export function ActuStory({ refCarte, titre, corps, source, etiquette = "Ce qui s'est passé au Parlement", date }: {
  refCarte: RefObject<ComponentRef<typeof View> | null>; titre: string; corps: string; source: string; etiquette?: string; date?: string;
}) {
  const P = NEUTRES_CARTE.ivoire;
  const phrase = corps.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? corps;
  const t = tailleTitre(titre, 38);
  return (
    <CarteStory refCarte={refCarte} fond="ivoire" filet source={source} invitation="Les faits, leurs sources"
      etiquette={<Etiquette fond="ivoire" texte={etiquette} droite={date} />}
      corps={<>
        <Text numberOfLines={7} style={{ fontFamily: POLICE.affiche, fontSize: t, lineHeight: Math.round(t * 1.12), letterSpacing: -0.6, color: P.encre }}>{titre}</Text>
        {phrase && phrase !== titre ? <Text numberOfLines={3} style={{ fontFamily: POLICE.texte, color: P.sourd, fontSize: 16, lineHeight: 22 }}>{phrase}</Text> : null}
      </>} />
  );
}
