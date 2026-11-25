/* L'INTERRUPTEUR (Step Up, 25/11/2026) : une ligne entière cliquable (48 au moins), une icône facultative,
   le libellé, et un vrai interrupteur dessiné à droite. Le mot « activé » ou « désactivé » reste dans le nom
   accessible : la position du rond ne suffit pas à dire l'état. Neutre (encre et gris), jamais une couleur de vote. */
import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CIBLE, PAS, TYPO, couleurs } from "../lib/theme";
import { enfonce } from "./mouvement";

export function Interrupteur({ texte, actif, onPress, icone, aide, desactive = false }: {
  texte: string; actif: boolean; onPress: () => void; icone?: keyof typeof Ionicons.glyphMap; aide?: string; desactive?: boolean;
}) {
  return (
    <Pressable onPress={desactive ? undefined : onPress} disabled={desactive} accessibilityRole="switch"
      accessibilityState={{ checked: actif, disabled: desactive }} aria-checked={actif}
      accessibilityLabel={`${texte} : ${actif ? "activé" : "désactivé"}`}
      style={({ pressed }) => [{ minHeight: CIBLE, flexDirection: "row", alignItems: "center", gap: PAS * 3, opacity: desactive ? 0.5 : 1 }, pressed && enfonce(true)]}>
      {icone ? <Ionicons name={icone} size={20} color={couleurs.encre} accessible={false} importantForAccessibility="no" /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={TYPO.corps}>{texte}</Text>
        {aide ? <Text style={TYPO.note}>{aide}</Text> : null}
      </View>
      <View style={{ width: 48, height: 28, borderRadius: 14, padding: 4, justifyContent: "center",
        backgroundColor: actif ? couleurs.encre : couleurs.trait, alignItems: actif ? "flex-end" : "flex-start" }}>
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: actif ? couleurs.sol : couleurs.carte }} />
      </View>
    </Pressable>
  );
}
