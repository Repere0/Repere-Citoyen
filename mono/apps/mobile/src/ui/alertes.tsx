/* LES ALERTES LOCALES SUR L'ACCUEIL (Step Up, ADR 0013, 25/11/2026).
 * Aucune notification poussée, aucun serveur : à l'ouverture, on compare les fichiers publics déjà publiés
 * aux sujets choisis (core/alertes.js). Une seule demande, douce et refusable, tant que `alertes` vaut null ;
 * « Non merci » écrit [] et la demande ne revient pas. Sans nouveauté : une phrase vraie, pas de cadre vide. */
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { actusFlux, chargerActuellesRss, chargerCatalogueScrutins, chargerEvenements } from "../lib/donnees";
import { FENETRE_ALERTES_JOURS, LIBELLE_ALERTE, dateFr, jourParis, nouveautes, titreLisible } from "@repere/core";
import { prochaineElection } from "../lib/elections";
import { useProfil } from "../lib/profil";
import { CIBLE, OMBRE, PAS, POLICE, RAYON, TYPO, couleurs } from "../lib/theme";
import { enfonce } from "./mouvement";
import { niveauTitre } from "./titre";

type Nouveaute = { sujet: string; d: string; texte: string; lien?: string };

const carte = { gap: PAS * 3, padding: PAS * 4, borderRadius: RAYON.carte, backgroundColor: couleurs.carte, ...OMBRE };

function Action({ texte, onPress, plein = false, testID }: { texte: string; onPress: () => void; plein?: boolean; testID?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" testID={testID}
      style={({ pressed }) => [{ minHeight: CIBLE, paddingHorizontal: PAS * 4, borderRadius: RAYON.bloc, alignItems: "center", justifyContent: "center",
        backgroundColor: plein ? couleurs.encre : "transparent", borderWidth: plein ? 0 : 1, borderColor: couleurs.trait }, pressed && enfonce(true)]}>
      <Text style={[TYPO.corps, { fontFamily: POLICE.texteMoyen, color: plein ? couleurs.sol : couleurs.encre }]}>{texte}</Text>
    </Pressable>
  );
}

export function BandeauAlertes({ insee }: { insee?: string | null }) {
  const { profil, modifier } = useProfil();
  const sujets = profil ? profil.alertes ?? null : null;
  const [liste, setListe] = useState<Nouveaute[] | null>(null);
  const cle = (sujets || []).join(",");
  useEffect(() => {
    if (!sujets || !sujets.length) return;
    let vivant = true;
    const jour = jourParis(new Date());
    Promise.all([chargerCatalogueScrutins(), chargerEvenements(), sujets.includes("actus") && insee ? chargerActuellesRss() : Promise.resolve(null)])
      .then(([c, e, r]) => {
        if (!vivant) return;
        const sc = c.donnees ? ((c.donnees as { scrutins?: { n: string; d: string; t: string }[] }).scrutins || []).map(x => ({ ...x, t: titreLisible(x.t) })) : [];
        const ev = e.donnees ? ((e.donnees as { r?: { id: string; d: string; t: string }[] }).r || []) : [];
        const ac = r && insee ? (actusFlux(r.donnees, insee, jour) as { titre: string; date: string; lien: string }[]) : [];
        const pe = prochaineElection(new Date());
        setListe(nouveautes({ sujets, aujourdhui: jour, scrutins: sc, evenements: ev, actus: ac,
          election: pe ? { nom: pe.election.titre, jours: pe.jours } : null }) as Nouveaute[]);
      }).catch(() => { if (vivant) setListe([]); });
    return () => { vivant = false; };
  }, [cle, insee]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!profil) return null;
  /* Jamais demandé : une proposition, refusable en un geste. Rien ne bloque l'accueil. */
  if (sujets === null) return (
    <View style={carte} testID="alertes-proposition">
      <View style={{ flexDirection: "row", gap: PAS * 3, alignItems: "flex-start" }}>
        <Ionicons name="notifications-outline" size={22} color={couleurs.encre} accessible={false} importantForAccessibility="no" />
        <View style={{ flex: 1, gap: PAS }}>
          <Text style={[TYPO.corps, { fontFamily: POLICE.titre }]} {...niveauTitre(2)}>Être prévenu de ce qui change ?</Text>
          <Text style={TYPO.note}>À chaque ouverture, Repère vous dit ce qui a été publié sur vos sujets. Rien n'est envoyé : tout reste sur cet appareil.</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: PAS * 2 }}>
        <Action plein texte="Choisir mes sujets" testID="alertes-choisir" onPress={() => { modifier({ alertes: ["votes", "budgets", "elections", "actus"] }); router.push("/reglages"); }} />
        <Action texte="Non merci" testID="alertes-refuser" onPress={() => modifier({ alertes: [] })} />
      </View>
    </View>
  );
  if (!sujets.length || liste === null) return null;
  return (
    <View style={carte} testID="alertes-bandeau">
      <View style={{ flexDirection: "row", alignItems: "center", gap: PAS * 2 }}>
        <Ionicons name="notifications-outline" size={20} color={couleurs.encre} accessible={false} importantForAccessibility="no" />
        <Text style={[TYPO.corps, { fontFamily: POLICE.titre, flex: 1 }]} {...niveauTitre(2)}>
          {liste.length ? `${liste.length} nouveauté${liste.length > 1 ? "s" : ""} sur vos sujets` : "Rien de nouveau sur vos sujets"}
        </Text>
      </View>
      {liste.slice(0, 4).map((x, i) => (
        <View key={i} style={{ gap: 2 }}>
          <Text style={TYPO.note}>{LIBELLE_ALERTE[x.sujet as keyof typeof LIBELLE_ALERTE]}{x.sujet === "elections" ? "" : ` · ${dateFr(x.d)}`}</Text>
          <Text style={TYPO.corps} numberOfLines={2}>{x.texte}</Text>
        </View>
      ))}
      <Text style={TYPO.micro}>Publié ces {FENETRE_ALERTES_JOURS} derniers jours, d'après les fichiers de Repère. Aucune notification n'est envoyée.</Text>
      <Pressable onPress={() => router.push("/reglages")} accessibilityRole="link" style={({ pressed }) => [{ minHeight: CIBLE, justifyContent: "center", alignSelf: "flex-start" }, pressed && enfonce(true)]}>
        <Text style={[TYPO.note, { fontFamily: POLICE.texteMoyen, color: couleurs.lien }]}>Choisir mes sujets</Text>
      </Pressable>
    </View>
  );
}
