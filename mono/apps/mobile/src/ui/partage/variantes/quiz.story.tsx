/* Modèle D, « le défi » (ivoire, 23/11/2026 ; quiz civique, ADR 0010) : le rang atteint, en très gros.
 *
 * Ce que cette carte ne dit JAMAIS : un vote, une position, un élu, un parti, une commune. Elle ne parle
 * que de vocabulaire institutionnel — c'est la limite exacte de l'amendement de l'invariant 6. Aucun
 * rang comparé entre lecteurs non plus : il n'y a rien à comparer, Repère ne sait rien des autres. */
import type { ComponentRef, RefObject } from "react";
import { Text, View } from "react-native";
import { POLICE } from "../../../lib/theme";
import { NEUTRES_CARTE } from "../../../lib/palette";
import { CarteStory, Etiquette } from "../carte-story";

export function QuizStory({ refCarte, rang, defi }: {
  refCarte: RefObject<ComponentRef<typeof View> | null>; rang: string; defi: string;
}) {
  const P = NEUTRES_CARTE.ivoire;
  return (
    <CarteStory refCarte={refCarte} fond="ivoire" filet source="Définitions : dictionnaire citoyen de Repère." invitation="Jouer au quiz civique"
      etiquette={<Etiquette fond="ivoire" texte="Quiz civique" />}
      corps={<>
        <Text style={{ fontFamily: POLICE.texte, color: P.sourd, fontSize: 20, lineHeight: 28 }}>J'ai atteint le rang de</Text>
        <Text style={{ fontFamily: POLICE.affiche, fontSize: rang.length > 14 ? 40 : 52, lineHeight: rang.length > 14 ? 46 : 58, letterSpacing: -1, color: P.encre }}>{rang}</Text>
        <View style={{ borderWidth: 2, borderColor: P.encre, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 20, alignSelf: "flex-start" }}>
          <Text style={{ fontFamily: POLICE.section, color: P.encre, fontSize: 22, lineHeight: 28 }}>{defi}</Text>
        </View>
      </>} />
  );
}
