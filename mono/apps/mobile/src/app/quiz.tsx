/* LE QUIZ CIVIQUE (12/11/2026, refondu le 13/11/2026 par décision du porteur) : un écran à lui, qui tient sans défiler.
 * Une définition, quatre mots, un seul juste ; vocabulaire institutionnel seulement. La série vit en mémoire
 * (invariant 2 : aucune clé de stockage en plus), aucun score comparé, aucun partage, aucun son (invariant 6). */
import { View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Quiz } from "../ui/quiz";
import { categorieDuMot } from "../lib/categories-mots";
import { couleurs } from "../lib/theme";

export default function QuizEcran() {
  /* ?mot= (26/11/2026) : depuis le dictionnaire, la manche commence par ce mot. */
  const p = useLocalSearchParams<{ mot?: string | string[] }>();
  const mot = Array.isArray(p.mot) ? p.mot[0] : p.mot;
  return (
    <View style={{ flex: 1, backgroundColor: couleurs.sol }}>
      <Stack.Screen options={{ title: "Quiz civique" }} />
      <Quiz categorieDe={categorieDuMot} premier={mot || null} />
    </View>
  );
}
