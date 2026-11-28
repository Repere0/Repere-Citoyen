/* LA BIENVENUE, COMPOSANT (14/11/2026, ADR 0011 ; 23/11/2026, ADR 0012 ; 28/11/2026, hotfix H2).
 *
 * 28/11/2026 (porteur, accroche A) : la première ouverture ne passe plus par ici. L'accueil EST l'onboarding (l'accroche,
 * puis la recherche de commune) : l'audit du jour mesurait trois écrans avant toute valeur, et la commune toujours pas
 * choisie à la fin. Cet écran ne se pose plus que si le lecteur le demande (« Personnaliser » sur un lien partagé,
 * Réglages) : une seule question, le prénom, facultatif. « Passer » donne « Citoyen » (porteur, 14/11).
 *
 * Les réglages déjà gardés sur l'appareil (lecture, thèmes, points) ne sont PAS remis à zéro : seul le prénom change.
 * Le prénom reste sur l'appareil, jamais transmis (invariant 2). Ce qui n'est pas un prénom n'est pas gardé.
 * L'ancien écran « Ce que Repère ne fait pas » a disparu, et sa phrase inexacte avec lui (« Personne ne sait que vous
 * êtes là » : les hébergeurs reçoivent l'adresse IP de chaque visite). */
import { useState } from "react";
import { Animated, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { nettoyerPrenom, PRENOM_MAX, PROFIL_DEFAUT } from "@repere/core";
import { MODE_INITIAL, useProfil } from "../lib/profil";
import { ACCENTS, CIBLE, couleurs, PAS, POLICE, RAYON, TYPO } from "../lib/theme";
import { enfonce, useApparition } from "./mouvement";
import { niveauTitre } from "./titre";

/* Le prénom donné à qui passe la question (porteur, 14/11/2026). */
export const PRENOM_PAR_DEFAUT = "Citoyen";

export function Bienvenue() {
  const { enregistrer, profil } = useProfil();
  const marges = useSafeAreaInsets();
  const [saisie, setSaisie] = useState("");
  const apparition = useApparition();
  const prenom = nettoyerPrenom(saisie);
  /* Une saisie non vide que la règle refuse (chiffres, signes) : on le dit, on ne la garde pas en silence. */
  const refuse = saisie.trim().length > 0 && !prenom;

  const terminer = (p: string) => {
    /* Rien d'autre que le prénom ne change. Dès qu'il est gardé, la coquille retire cet écran : pas de navigation. */
    enregistrer({ ...(profil ?? { ...PROFIL_DEFAUT, mode: MODE_INITIAL }), prenom: p || PRENOM_PAR_DEFAUT } as Parameters<typeof enregistrer>[0]);
  };

  const bouton = (texte: string, action: () => void, id?: string) => (
    <Pressable onPress={action} accessibilityRole="button" accessibilityLabel={texte} testID={id}
      style={({ pressed }) => ({ minHeight: CIBLE + 8, borderRadius: RAYON.pastille, alignItems: "center", justifyContent: "center", backgroundColor: ACCENTS.autorite, ...enfonce(pressed) })}>
      <Text style={{ fontSize: 16, fontFamily: POLICE.section, color: ACCENTS.surAutorite }}>{texte}</Text>
    </Pressable>
  );
  const discret = (texte: string, etiquette: string, action: () => void) => (
    <Pressable onPress={action} accessibilityRole="button" accessibilityLabel={etiquette}
      style={({ pressed }) => ({ minHeight: CIBLE, alignItems: "center", justifyContent: "center", ...enfonce(pressed) })}>
      <Text style={[TYPO.note, { color: couleurs.sourd, fontFamily: POLICE.texteGras }]}>{texte}</Text>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: couleurs.sol }}>
      <Animated.View testID="bienvenue-prenom" style={{ flex: 1, paddingHorizontal: PAS * 6, paddingTop: marges.top + PAS * 6, paddingBottom: marges.bottom + PAS * 6,
        justifyContent: "center", gap: PAS * 6, maxWidth: 520, width: "100%", alignSelf: "center",
        opacity: apparition, transform: [{ translateY: apparition.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>

        <>
            <View style={{ alignItems: "center", gap: PAS * 4 }}>
              <Text style={[TYPO.affiche, { textAlign: "center" }]} {...niveauTitre(1)}>Comment souhaitez-vous qu'on vous appelle ?</Text>
            </View>
            <View style={{ gap: PAS * 2 }}>
              <TextInput value={saisie} onChangeText={setSaisie} maxLength={PRENOM_MAX} autoCapitalize="words" autoCorrect={false} autoComplete="given-name"
                returnKeyType="done" onSubmitEditing={() => terminer(prenom)} placeholder="Votre prénom" placeholderTextColor={couleurs.sourd}
                accessibilityLabel="Votre prénom"
                style={{ minHeight: CIBLE + 12, borderRadius: RAYON.bloc, borderWidth: 1, borderColor: refuse ? couleurs.encre : couleurs.trait, backgroundColor: couleurs.carte,
                  paddingHorizontal: PAS * 6, fontSize: 20, fontFamily: POLICE.titre, color: couleurs.encre, textAlign: "center" }} />
              <Text style={[TYPO.note, { textAlign: "center" }]} accessibilityLiveRegion="polite">
                {refuse ? "Un prénom : des lettres, un espace ou un trait d'union. Il ne sera pas gardé tel quel." : `Il reste sur cet appareil et n'est jamais envoyé. Sans prénom, Repère vous appellera « ${PRENOM_PAR_DEFAUT} ».`}
              </Text>
            </View>
            <View style={{ gap: PAS * 2 }}>
              {bouton("Continuer", () => terminer(prenom), "continuer-1")}
              {discret("Passer", "Passer, sans donner de prénom", () => terminer(PRENOM_PAR_DEFAUT))}
            </View>
        </>

      </Animated.View>
    </KeyboardAvoidingView>
  );
}
