/* Modèle C, « la question » (nuit, 23/11/2026) : la question du produit en titre, la réponse dans une carte.
   Ce n'est pas une carte de vote : aucun parti, aucune couleur politique, aucune photo (invariant 7). */
import type { ComponentRef, RefObject } from "react";
import { Text, View } from "react-native";
import { POLICE } from "../../../lib/theme";
import { NEUTRES_CARTE } from "../../../lib/palette";
import { CarteStory, Etiquette } from "../carte-story";

export function ElusStory({ refCarte, nom, fonction, lieu, source }: {
  refCarte: RefObject<ComponentRef<typeof View> | null>; nom: string; fonction: string; lieu: string; source: string;
}) {
  const P = NEUTRES_CARTE.nuit;
  const question = lieu ? `Qui décide pour ${lieu} ?` : "Qui décide chez vous ?";
  const t = question.length > 34 ? 32 : 40;
  return (
    <CarteStory refCarte={refCarte} fond="nuit" source={source} invitation="Tapez votre commune"
      etiquette={<Etiquette texte="Annuaire des élus" />}
      corps={<>
        <Text style={{ fontFamily: POLICE.affiche, fontSize: t, lineHeight: Math.round(t * 1.1), letterSpacing: -0.8, color: P.encre }}>{question}</Text>
        <View style={{ backgroundColor: P.carte, borderColor: P.trait, borderWidth: 1, borderRadius: 18, padding: 20, gap: 8 }}>
          {fonction ? <Etiquette texte={fonction} /> : null}
          <Text numberOfLines={2} style={{ fontFamily: POLICE.affiche, fontSize: nom.length > 22 ? 24 : 28, lineHeight: 32, color: P.encre }}>{nom}</Text>
        </View>
      </>} />
  );
}
