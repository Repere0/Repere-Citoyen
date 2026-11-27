/* INSTALLER REPÈRE SUR L'ÉCRAN D'ACCUEIL — LE TUTORIEL (porteur, 27/11/2026). Ouvert par le bandeau (« Comment faire »)
 * et par Réglages. Le geste de l'appareil qui lit cette page est montré en premier ; l'autre reste en dessous, pour
 * qui aide un proche. Rien n'est installé à la place du lecteur : sur iPhone, aucun navigateur ne le permet. */
import { Text, View } from "react-native";
import { Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Carte } from "../lib/composants";
import { Page, Question } from "../ui/page";
import { couleurs, PAS, POLICE, TYPO } from "../lib/theme";
import { estAutonome, estIos } from "../lib/installation";

type Etape = { icone: keyof typeof Ionicons.glyphMap; texte: string };
const IOS: Etape[] = [
  { icone: "share-outline", texte: "Touchez le bouton Partager : le carré à flèche, en bas de Safari (en haut sur iPad), ou dans le menu de votre navigateur." },
  { icone: "add-circle-outline", texte: "Faites défiler et touchez « Sur l'écran d'accueil »." },
  { icone: "checkmark-circle-outline", texte: "Touchez « Ajouter ». Repère apparaît parmi vos applications." },
];
const ANDROID: Etape[] = [
  { icone: "ellipsis-vertical", texte: "Touchez le menu du navigateur : les trois points, en haut à droite de Chrome." },
  { icone: "download-outline", texte: "Touchez « Installer l'application » ou « Ajouter à l'écran d'accueil »." },
  { icone: "checkmark-circle-outline", texte: "Confirmez. Repère apparaît parmi vos applications." },
];

function Etapes({ titre, etapes, id }: { titre: string; etapes: Etape[]; id: string }) {
  return (
    <Carte titre={titre}>
      <View testID={id} style={{ gap: PAS * 4 }}>
        {etapes.map((e, i) => (
          <View key={i} style={{ flexDirection: "row", gap: PAS * 3, alignItems: "flex-start" }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: couleurs.voile, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={e.icone} size={18} color={couleurs.encre} accessible={false} importantForAccessibility="no" />
            </View>
            <Text style={[TYPO.corps, { flex: 1 }]}><Text style={{ fontFamily: POLICE.section }}>{i + 1}. </Text>{e.texte}</Text>
          </View>
        ))}
      </View>
    </Carte>
  );
}

export default function Installer() {
  const ios = typeof navigator !== "undefined" && estIos(navigator.userAgent, navigator.platform, navigator.maxTouchPoints || 0);
  const deja = estAutonome();
  const blocs = [<Etapes key="i" titre="Sur iPhone ou iPad" etapes={IOS} id="etapes-ios" />, <Etapes key="a" titre="Sur Android" etapes={ANDROID} id="etapes-android" />];
  return (
    <Page>
      <Stack.Screen options={{ title: "Installer Repère" }} />
      <Question etiquette="Sur votre téléphone" question="Installer Repère sur l'écran d'accueil" />
      {deja ? (
        <Carte titre="C'est déjà fait">
          <Text testID="installer-deja" style={TYPO.corps}>Repère est ouvert comme une application installée sur cet appareil. Rien d'autre à faire.</Text>
        </Carte>
      ) : null}
      <Text style={TYPO.corps}>Repère s'ouvre alors en plein écran, comme une application, et garde les données déjà lues pour fonctionner sans réseau. Rien n'est téléchargé depuis un magasin d'applications, aucun compte n'est demandé.</Text>
      {ios ? blocs : blocs.reverse()}
    </Page>
  );
}
