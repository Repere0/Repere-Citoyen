/* LE BANDEAU DU LECTEUR ARRIVÉ PAR UN LIEN (23/11/2026, porteur, ADR 0012).
 *
 * Sans prénom gardé, une page ouverte par un lien partagé montre son contenu, et ce bandeau en tête : ce qu'est
 * Repère en une phrase, et « Personnaliser », qui pose la bienvenue par-dessus la page. Il ne bloque rien et
 * disparaît dès qu'un prénom est gardé (ou « Passer », qui donne « Citoyen »). */
import { Pressable, Text, View } from "react-native";
import { useProfil } from "../lib/profil";
import { useBienvenue } from "../lib/bienvenue";
import { CIBLE, couleurs, PAS, RAYON, TYPO } from "../lib/theme";
import { enfonce } from "./mouvement";

export function BandeauDecouverte() {
  const { profil } = useProfil();
  const { ouvrir } = useBienvenue();
  if (profil && profil.prenom) return null;
  return (
    <View testID="bandeau-decouverte" style={{ width: "100%", marginBottom: PAS * 2, flexDirection: "row", alignItems: "center", gap: PAS * 3, padding: PAS * 3, borderRadius: RAYON.bloc, backgroundColor: couleurs.voile }}>
      <Text style={[TYPO.note, { flex: 1, color: couleurs.encre }]}>Vous découvrez Repère : qui décide chez vous, où va votre argent, avec leurs sources.</Text>
      <Pressable onPress={ouvrir} accessibilityRole="button" accessibilityLabel="Personnaliser Repère : ouvrir la bienvenue"
        style={({ pressed }) => ({ minHeight: CIBLE, justifyContent: "center", paddingHorizontal: PAS * 3, borderRadius: RAYON.bloc, borderWidth: 1, borderColor: couleurs.trait, ...enfonce(pressed) })}>
        <Text style={{ color: couleurs.lien, fontWeight: "600" }}>Personnaliser</Text>
      </Pressable>
    </View>
  );
}
