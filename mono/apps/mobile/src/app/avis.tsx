/* DONNER SON AVIS, EN TROIS ÉTAPES (Step Up, porteur, 25/11/2026) : une note, des points cochés, un texte.
 * Le bout du chemin est la messagerie du lecteur (mailto, lib/avis.ts) : il relit, efface ce qu'il veut, envoie.
 * Repère n'envoie rien et ne garde rien (invariants 1 et 2) : les réponses vivent le temps de l'écran. */
import { useState } from "react";
import { Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack } from "expo-router";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { COURRIEL_AVIS, lienAvis, POINTS_AVIS, THEMES_AVIS } from "../lib/avis";
import { useProfil } from "../lib/profil";
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

/* LE MENU « VOTRE AVIS PORTE SUR » (porteur, 27/11/2026) : un menu déroulant, liste fixe. Le choix entre dans le sujet
   du message ([Avis - Finances]). Un bouton qui se déplie (et dit son état), puis une liste à choix unique. */
function MenuTheme({ theme, choisir }: { theme: string | null; choisir: (t: string) => void }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <View style={{ gap: PAS * 2 }}>
      <Text style={TYPO.note} nativeID="avis-theme-titre">Votre avis porte sur :</Text>
      <Pressable onPress={() => setOuvert(o => !o)} accessibilityRole="button" accessibilityState={{ expanded: ouvert }} aria-expanded={ouvert}
        accessibilityLabel={`Votre avis porte sur : ${theme || "aucune page choisie"}`} accessibilityHint="Ouvrir la liste des pages" testID="avis-theme"
        style={({ pressed }) => [{ minHeight: CIBLE, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: PAS * 3,
          borderRadius: RAYON.bloc, borderWidth: 1, borderColor: couleurs.trait, backgroundColor: couleurs.sol }, pressed && enfonce(true)]}>
        <Text style={[TYPO.corps, { color: theme ? couleurs.encre : couleurs.sourd }]}>{theme || "Choisir une page (facultatif)"}</Text>
        <Ionicons name={ouvert ? "chevron-up" : "chevron-down"} size={18} color={couleurs.sourd} accessible={false} importantForAccessibility="no" />
      </Pressable>
      {ouvert ? (
        <View accessibilityRole="radiogroup" aria-labelledby="avis-theme-titre" style={{ borderRadius: RAYON.bloc, borderWidth: 1, borderColor: couleurs.trait, overflow: "hidden" }}>
          {THEMES_AVIS.map((t, i) => (
            <Pressable key={t} onPress={() => { choisir(t); setOuvert(false); }} accessibilityRole="radio" accessibilityState={{ checked: theme === t }} aria-checked={theme === t}
              accessibilityLabel={t} testID={`avis-theme-${i}`}
              style={({ pressed }) => [{ minHeight: CIBLE, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: PAS * 3,
                borderTopWidth: i ? 1 : 0, borderColor: couleurs.trait, backgroundColor: theme === t ? couleurs.voile : couleurs.carte }, pressed && enfonce(true)]}>
              <Text style={[TYPO.corps, { color: couleurs.encre }]}>{t}</Text>
              {theme === t ? <Ionicons name="checkmark" size={18} color={couleurs.encre} accessible={false} importantForAccessibility="no" /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function Avis() {
  const [etape, setEtape] = useState(0);
  const [note, setNote] = useState(0);
  const [points, setPoints] = useState<string[]>([]);
  const [texte, setTexte] = useState("");
  const [theme, setTheme] = useState<string | null>(null);
  const { profil } = useProfil();
  const bas = useBasSur();
  if (!COURRIEL_AVIS) return (
    <View style={{ flex: 1, backgroundColor: couleurs.sol, padding: PAS * 4 }}>
      <Stack.Screen options={{ title: "Donner mon avis" }} />
      <Vide icone="mail-outline" titre="Aucune adresse n'est réglée pour recevoir les avis" corps="Cette version de Repère n'a pas d'adresse de contact. Rien ne peut être envoyé d'ici." />
    </View>
  );
  const envoyer = () => {
    const navigateur = Platform.OS === "web" && typeof navigator !== "undefined" ? navigator.userAgent : null;
    const lien = lienAvis(COURRIEL_AVIS as string, {
      version: Constants.expoConfig?.version || "inconnue", date: new Date(),
      plateforme: `${Platform.OS} ${String(Platform.Version ?? "")}`.trim(), navigateur,
    }, { note, points, texte, theme, prenom: profil ? profil.prenom : null });
    /* Sur le web (26/11/2026) : react-native-web ouvrait mailto: par window.open(…, "_blank"), qui laisse un onglet
       vide sur ordinateur et peut ne rien ouvrir dans l'application installée sur l'écran d'accueil d'un iPhone.
       Une adresse mailto: posée sur la page ouvre la messagerie sans quitter Repère. */
    if (Platform.OS === "web" && typeof window !== "undefined") { window.location.href = lien; return; }
    Linking.openURL(lien).catch(() => {});
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
            <MenuTheme theme={theme} choisir={setTheme} />
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

          </>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: PAS * 3 }}>
        {etape > 0 ? <Bouton texte="Retour" onPress={() => setEtape(etape - 1)} testID="avis-precedent" /> : null}
        {etape < 2
          ? <Bouton plein texte="Continuer" onPress={() => setEtape(etape + 1)} desactive={etape === 0 && !note} testID="avis-suivant" />
          : <Bouton plein texte="Ouvrir ma messagerie" onPress={envoyer} testID="avis-envoyer" />}
      </View>
      {etape === 2 ? (
        /* Porteur, 27/11/2026 : un lien mailto ne transporte pas d'image (et Repère n'a pas de serveur) ; la capture se
           joint dans la messagerie. Aucune messagerie réglée : l'adresse reste lisible pour écrire autrement. */
        <View style={{ gap: PAS }}>
          <Text style={TYPO.micro} testID="avis-aide">Votre messagerie va s'ouvrir. Vous pourrez y joindre une capture d'écran si besoin. Repère n'envoie et ne garde rien.</Text>
          <Text style={TYPO.micro} selectable testID="avis-adresse">Rien ne s'ouvre ? Écrivez à {COURRIEL_AVIS}.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
