/* LA BARRE BASSE (13/10/2026 ; quatre onglets des maquettes Stitch, 09/11/2026).
 *
 * Aujourd'hui  -> chez-vous   (les trois reponses du jour)
 * Qui décide   -> qui-decide  (la chaine de decision de la commune)
 * Finances     -> finances    (l'ecran « Où va l'argent », en onglet)
 * Calendrier   -> a-venir     (le Parlement, semaine et mois)
 * L'annuaire des élus (elus) reste une route, sans onglet : « Mes élus » et « Aller plus loin » y mènent.
 *
 * Le canevas dessine « Aujourd'hui » et « Calendrier » ; « Chez vous » n'a pas
 * d'ecran dessine : il ouvre « Qui decide », a confirmer par le porteur.
 * Les ecrans de detail (argent, vote, fiche, partage, dictionnaire...) restent
 * dans la pile, au-dessus de la barre. */
import { Platform, StyleSheet, Text, View, type ColorValue } from "react-native";
import { InvitationInstallation } from "../../ui/invitation-installation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useBureau } from "../../lib/bureau";
import { BARRE_FLOTTANTE, HauteurOnglets } from "../../lib/onglets-flottants";
import { translucide } from "../../lib/palette";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LIBELLES } from "@repere/core";
import { ACCENTS, couleurs } from "../../lib/theme";
import { useTheme } from "../../lib/themeChoix";
import { ChangerCommune } from "../../ui/retour";
import { BoutonReglages } from "../../ui/reglages";
import { useState } from "react";

/* Une icone par onglet (@expo/vector-icons, Ionicons, brief V47 bloc 1) : pleine quand l'onglet
 * est actif, contour sinon. L'icone est decorative : le nom de l'onglet la porte. Ionicons n'a pas
 * « landmark » ni « users » en contour : « business » (un batiment) et « calendar » font l'affaire. */
type NomIcone = "newspaper" | "business" | "calendar" | "person-circle" | "wallet" | "apps";
const icone = (nom: NomIcone) => ({ color, focused }: { color: ColorValue; focused: boolean }) => (
  /* Refonte « légère » (09/11/2026) : toujours le contour, fin ; l'onglet actif se lit à sa couleur et à son libellé. */
  <Ionicons name={`${nom}-outline` as const} size={22} color={typeof color === "string" ? color : undefined} allowFontScaling={false} accessible={false} importantForAccessibility="no" style={{ opacity: focused ? 1 : 0.9 }} />
);

/* L'intitule de l'onglet, sur deux lignes au plus (D22, 200 %). Le libelle par
 * defaut d'expo-router le tronque sur une ligne. Sur iOS, expo-router fixe deja la
 * taille des libelles d'onglets (allowFontScaling false, convention Apple : la
 * barre basse ne grossit pas, le « Large Content Viewer » la remplace) : on la
 * garde telle quelle. Sur Android, le libelle suit la taille choisie par le
 * lecteur, sans plafond, et la barre n'a plus de hauteur figee (voir tabBarStyle). */
/* ARBITRAGE (D22, 29/10/2026) : sur Android, le libelle d'onglet ne grossit pas au-dela
 * de 1,2 fois sa taille. A 13 px, « Aujourd'hui » mesure 75 px ; une colonne d'onglet
 * d'un ecran de 360 px en laisse environ 96 px utiles. A 1,2 : 90 px. Au-dela, le mot
 * ne tient plus et Android le coupe. Le reste de l'ecran suit la taille choisie,
 * sans plafond. Mesure navigateur, pas appareil : a valider sur Android. Pour
 * lever ce plafond, changer cette seule constante (et sa garde dans onglets.test.mjs). */
export const TAILLE_MAX_LIBELLE_ONGLET = 1.2;

const etiquette = (texte: string) => ({ color }: { color: ColorValue }) => (
  <Text numberOfLines={2} allowFontScaling={Platform.OS !== "ios"} maxFontSizeMultiplier={TAILLE_MAX_LIBELLE_ONGLET}
    /* 12 px au moins (porteur, 09/11/2026). Deux lignes au plus : rien n'est tronqué, même sur iOS
       où la taille reste fixe ; la largeur suit la colonne de l'onglet. */
    style={{ color, fontSize: 12, lineHeight: 15, fontWeight: "500", textAlign: "center" }}>{texte}</Text>
);

export default function Onglets() {
  /* V35 : s'abonner au thème fait relire les couleurs de l'en-tête à chaque changement de mode
     (sans cela, passer de sombre à clair laissait l'en-tête sombre jusqu'au rechargement). */
  useTheme();
  /* 12/11/2026 (roadmap bêta) : la hauteur minimale s'ajoute à la zone protégée de l'iPhone. La barre pose déjà cette
     marge en bas (paddingBottom) ; avec un minimum fixe de 72 px, il ne restait que 43 px pour l'icône et le libellé,
     qui descendaient de 6 px sous la barre d'accueil (mesuré avec une marge de 34 px, tests/marges-ios-web.mjs). */
  const marges = useSafeAreaInsets();
  const { bureau } = useBureau();
  const hauteurBarre = 72 + marges.bottom;
  const [hauteurInvitation, setHauteurInvitation] = useState(0);
  return (
    <HauteurOnglets.Provider value={BARRE_FLOTTANTE && !bureau ? hauteurBarre + 16 + hauteurInvitation : 0}>
    <View style={{ flex: 1 }}>
    <Tabs
      /* Dashboard desktop (25/11/2026) : sur grand écran, la barre latérale remplace la barre du bas. */
      tabBar={bureau ? () => null : undefined}
      screenOptions={{
        headerStyle: { backgroundColor: couleurs.sol },
        headerTintColor: couleurs.encre,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: couleurs.sol },
        animation: "fade", /* changement d'onglet : fondu court, sans glissement */
        tabBarActiveTintColor: ACCENTS.texteAccent,
        tabBarInactiveTintColor: couleurs.sourd,
        /* Filet de séparation d'un demi-pixel, pas d'ombre (refonte « légère »). */
        tabBarStyle: [{ backgroundColor: couleurs.carte, borderTopColor: couleurs.trait, borderTopWidth: StyleSheet.hairlineWidth, elevation: 0, shadowOpacity: 0, minHeight: 72 + marges.bottom, paddingTop: 4 },
          /* Polish (25/11/2026) : sur le web, translucide et floutée, collée en bas ; le contenu défile dessous. */
          BARRE_FLOTTANTE && ({ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: translucide(couleurs.carte, 0.82),
            backdropFilter: "saturate(180%) blur(16px)", WebkitBackdropFilter: "saturate(180%) blur(16px)" } as object)] as never,
        headerLeft: () => <ChangerCommune />,
        headerRight: () => <BoutonReglages />,
        /* Audit UI, vague 2 : le titre de l'en-tête n'est pas un titre de niveau 1 (celui de l'écran l'est). */
        /* 23/11/2026 (audit M3) : sur un onglet, l'en-tête ne répète plus le nom de l'écran. La barre basse le dit, et le
           titre de l'écran (niveau 1) le redit en grand. Mesuré à 360 px avec « Saint-Germain-en-Laye » : le titre passait
           sous le bouton « Partager ». À gauche la commune, à droite les actions, rien au milieu. */
        headerTitle: () => null,
      }}
    >
      <Tabs.Screen
        name="chez-vous"
        options={{
          title: LIBELLES.aujourdhui,
          tabBarLabel: etiquette(LIBELLES.aujourdhui),
          tabBarIcon: icone("newspaper"),
        }}
      />
      <Tabs.Screen name="qui-decide" options={{ title: LIBELLES.qui, tabBarLabel: etiquette(LIBELLES.qui), tabBarIcon: icone("business") }} />
      <Tabs.Screen name="finances" options={{ title: LIBELLES.argent, tabBarLabel: etiquette(LIBELLES.finances), tabBarIcon: icone("wallet") }} />
      <Tabs.Screen name="a-venir" options={{ title: LIBELLES.calendrier, tabBarLabel: etiquette(LIBELLES.calendrier), tabBarIcon: icone("calendar") }} />
      {/* 27/11/2026 (porteur) : le Hub des outils citoyens, cinquième onglet. */}
      <Tabs.Screen name="outils" options={{ title: LIBELLES.outils, tabBarLabel: etiquette(LIBELLES.outils), tabBarIcon: icone("apps") }} />
    </Tabs>
    {/* Installer sur l'écran d'accueil (27/11/2026) : au-dessus de la barre d'onglets, téléphone et navigateur seulement. */}
    <InvitationInstallation bas={hauteurBarre} surHauteur={setHauteurInvitation} />
    </View>
    </HauteurOnglets.Provider>
  );
}
