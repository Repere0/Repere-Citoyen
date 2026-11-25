/* DONNER SON AVIS, EN TROIS ÉTAPES (Step Up, porteur, 25/11/2026) : une note, des points cochés, un texte.
 * Le bout du chemin est la messagerie du lecteur (mailto, lib/avis.ts) : il relit, efface ce qu'il veut, envoie.
 * Repère n'envoie rien et ne garde rien (invariants 1 et 2) : les réponses vivent le temps de l'écran. */
import { useState } from "react";
import { Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack } from "expo-router";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { COURRIEL_AVIS, lienAvis, POINTS_AVIS } from "../lib/avis";
import { CIBLE, OMBRE, PAS, POLICE, RAYON, TYPO, couleurs } from "../lib/theme";
import { MARQUE_DEFILEMENT } from "../lib/defilement-ios";
import { useBasSur } from "../ui/page";
import { niveauTitre } from "../ui/titre";
import { enfonce } from "../ui/mouvement";
import { Vide } from "../lib/composants";

const NOMS_NOTE = ["", "Pas du tout", "Un peu", "Moyennement", "Beaucoup", "Énormément"];

function Bouton({ texte, onPress, plein = false, testID, desactive = false }: { texte: string; onPress: () => void; plein?: boolean; testID?: string; desactive?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={desactive} accessibilityRole="button" accessibilityState={{ disabled: desactive }} testID={testID}
      style={({ pressed }) => [{ flex: 1, minHeight: CIBLE, borderRadius: RAYON.bloc, alignItems: "center", justifyContent: "center", paddingHorizontal: PAS * 4,
        backgroundColor: plein ? couleurs.encre : "transparent", borderWidth: plein ? 0 : 1, borderColor: couleurs.trait, opacity: desactive ? 0.4 : 1 }, pressed && enfonce(true)]}>
      <Text style={[TYPO.corps, { fontFamily: POLICE.texteMoyen, color: plein ? couleurs.sol : couleurs.encre }]}>{texte}</Text>
    </Pressable>
  );
}

export default function Avis() {
  const [etape, setEtape] = useState(0);
  const [note, setNote] = useState(0);
  const [points, setPoints] = useState<string[]>([]);
  const [texte, setTexte] = useState("");
  const bas = useBasSur();
  if (!COURRIEL_AVIS) return (
    <View style={{ flex: 1, backgroundColor: couleurs.sol, padding: PAS * 4 }}>
      <Stack.Screen options={{ title: "Donner mon avis" }} />
      <Vide titre="Aucune adresse n'est réglée pour recevoir les avis" corps="Cette version de Repère n'a pas d'adresse de contact. Rien ne peut être envoyé d'ici." />
    </View>
  );
  const envoyer = () => {
    const navigateur = Platform.OS === "web" && typeof navigator !== "undefined" ? navigator.userAgent : null;
    Linking.openURL(lienAvis(COURRIEL_AVIS as string, {
      version: Constants.expoConfig?.version || "inconnue", date: new Date(),
      plateforme: `${Platform.OS} ${String(Platform.Version ?? "")}`.trim(), navigateur,
    }, { note, points, texte })).catch(() => {});
  };
  return (
    <ScrollView {...MARQUE_DEFILEMENT} style={{ flex: 1, backgroundColor: couleurs.sol }} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: PAS * 4, paddingBottom: bas, gap: PAS * 6, maxWidth: 640, width: "100%", alignSelf: "center" }}>
      <Stack.Screen options={{ title: "Donner mon avis" }} />
      <View style={{ gap: PAS * 2 }}>
        <Text style={TYPO.etiquette} testID="avis-etape">Étape {etape + 1} sur 3</Text>
        <View style={{ flexDirection: "row", gap: PAS }}>
          {[0, 1, 2].map(i => <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= etape ? couleurs.encre : couleurs.trait }} />)}
        </View>
      </View>

      <View style={{ gap: PAS * 4, padding: PAS * 4, borderRadius: RAYON.carte, backgroundColor: couleurs.carte, ...OMBRE }}>
        {etape === 0 ? (
          <>
            <Text style={TYPO.section} {...niveauTitre(1)}>Repère vous aide-t-il à comprendre ce qui se passe chez vous ?</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }} accessibilityRole="radiogroup">
              {[1, 2, 3, 4, 5].map(n => (
                <Pressable key={n} onPress={() => setNote(n)} accessibilityRole="radio" accessibilityState={{ checked: note === n }} aria-checked={note === n}
                  accessibilityLabel={`${n} sur 5 : ${NOMS_NOTE[n]}`} testID={`avis-note-${n}`}
                  style={({ pressed }) => [{ minWidth: CIBLE, minHeight: CIBLE, alignItems: "center", justifyContent: "center" }, pressed && enfonce(true)]}>
                  <Ionicons name={n <= note ? "star" : "star-outline"} size={36} color={couleurs.encre} accessible={false} importantForAccessibility="no" />
                </Pressable>
              ))}
            </View>
            <Text style={[TYPO.note, { textAlign: "center" }]}>{note ? `${note} sur 5 : ${NOMS_NOTE[note]}` : "Touchez une étoile."}</Text>
          </>
        ) : etape === 1 ? (
          <>
            <Text style={TYPO.section} {...niveauTitre(1)}>Qu'est-ce qui compte pour vous ?</Text>
            <Text style={TYPO.note}>Plusieurs choix possibles, ou aucun.</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: PAS * 2 }}>
              {POINTS_AVIS.map(p => {
                const actif = points.includes(p);
                return (
                  <Pressable key={p} onPress={() => setPoints(actif ? points.filter(x => x !== p) : [...points, p])}
                    accessibilityRole="checkbox" accessibilityState={{ checked: actif }} aria-checked={actif}
                    style={({ pressed }) => [{ minHeight: CIBLE, paddingHorizontal: PAS * 4, borderRadius: RAYON.pastille, justifyContent: "center",
                      borderWidth: 1, borderColor: actif ? couleurs.encre : couleurs.trait, backgroundColor: actif ? couleurs.encre : couleurs.carte }, pressed && enfonce(true)]}>
                    <Text style={[TYPO.note, { color: actif ? couleurs.sol : couleurs.encre, fontFamily: POLICE.texteMoyen }]}>{p}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <>
            <Text style={TYPO.section} {...niveauTitre(1)}>Un mot de plus ?</Text>
            <TextInput value={texte} onChangeText={setTexte} multiline placeholder="Ce qui vous a plu, ce qui manque, ce qui est faux…"
              placeholderTextColor={couleurs.sourd} accessibilityLabel="Votre avis, en quelques mots" testID="avis-texte"
              style={[TYPO.corps, { color: couleurs.encre, minHeight: 140, textAlignVertical: "top", padding: PAS * 3, borderRadius: RAYON.bloc, borderWidth: 1, borderColor: couleurs.trait, backgroundColor: couleurs.sol }]} />
            <Text style={TYPO.micro}>Le bouton ouvre votre messagerie avec un message prêt. Vous le relisez, vous effacez ce que vous voulez, vous l'envoyez. Repère n'envoie et ne garde rien.</Text>
          </>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: PAS * 3 }}>
        {etape > 0 ? <Bouton texte="Retour" onPress={() => setEtape(etape - 1)} testID="avis-precedent" /> : null}
        {etape < 2
          ? <Bouton plein texte="Continuer" onPress={() => setEtape(etape + 1)} desactive={etape === 0 && !note} testID="avis-suivant" />
          : <Bouton plein texte="Ouvrir ma messagerie" onPress={envoyer} testID="avis-envoyer" />}
      </View>
    </ScrollView>
  );
}
