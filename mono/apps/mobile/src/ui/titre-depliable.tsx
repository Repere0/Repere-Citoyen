/* UN TITRE OFFICIEL LONG, EN DEUX LIGNES (28/11/2026, hotfix H3, audit du jour).
 *
 * Mesuré en production le 28/11 sur 41 titres du calendrier : médiane 4 lignes, 90e centile 7, maximum 11 (307 caractères),
 * en gras. Sans IA : on ne réécrit rien. Le titre est coupé à deux lignes, et « Lire tout » le déplie sur place. Le texte
 * officiel reste entier dans la page (le lecteur d'écran le lit en entier, invariant 4) ; seul l'œil est soulagé.
 *
 * Le seuil est un nombre de caractères, pas une mesure de rendu : à 390 px, une ligne de 17 px tient environ 35 caractères,
 * deux lignes environ 70. À 60, un titre qui pourrait passer sur trois lignes a toujours son bouton ; un titre court n'en a
 * jamais. Sur grand écran, un titre de 61 caractères peut avoir un bouton qui ne déplie rien : c'est le prix d'une règle
 * qui ne dépend pas du moteur de rendu. */
import { useState } from "react";
import { Pressable, Text, TextStyle, View } from "react-native";
import { CIBLE, couleurs, POLICE, TYPO } from "../lib/theme";
import { enfonce } from "./mouvement";

export const SEUIL_TITRE_LONG = 60;

export function TitreDepliable({ texte, style, testID }: { texte: string; style: TextStyle; testID?: string }) {
  const [ouvert, setOuvert] = useState(false);
  const long = (texte || "").length > SEUIL_TITRE_LONG;
  return (
    <View>
      <Text testID={testID} style={style} numberOfLines={long && !ouvert ? 2 : undefined}>{texte}</Text>
      {long ? (
        <Pressable onPress={() => setOuvert(o => !o)} accessibilityRole="button"
          accessibilityLabel={ouvert ? "Réduire le titre" : "Lire tout le titre"} accessibilityState={{ expanded: ouvert }}
          style={({ pressed }) => ({ minHeight: CIBLE, justifyContent: "center", alignSelf: "flex-start", ...enfonce(pressed) })}>
          <Text style={[TYPO.note, { color: couleurs.lien, fontFamily: POLICE.texteMoyen }]}>{ouvert ? "Réduire" : "Lire tout"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
