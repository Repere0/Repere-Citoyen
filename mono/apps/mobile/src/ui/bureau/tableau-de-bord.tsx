/* LE TABLEAU DE BORD DU BUREAU (dashboard desktop, porteur, 25/11/2026).
 *
 * Posé sur l'accueil quand l'écran fait 1024 px ou plus (lib/bureau.ts), SOUS la recherche de l'accueil, qui reste
 * la même (une seule logique de recherche). Des widgets en grille, chacun avec sa source en pied ; sans donnée, une
 * phrase vraie et un lien, jamais un cadre vide (invariant 5). Rien n'est classé (invariant 3) : « le dernier
 * scrutin » est le plus récent, jamais « le plus important », et l'écran le dit.
 * Graphiques : SVG du navigateur (le bureau n'existe que sur le web), aucune bibliothèque ajoutée (porteur,
 * 25/11/2026 : SVG natif plutôt que Recharts). Couleurs : celles des votes et de la jauge (palette.ts, invariant 7). */
import { createElement, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { GLOSSAIRE, dateFr, definition, jourParis, parHabitant, titreLisible } from "@repere/core";
import { chargerCatalogueScrutins } from "../../lib/donnees";
import { useCommuneChoisie } from "../../lib/useCommune";
import { useCouleurVote } from "../../lib/couleur-vote";
import { CIBLE, JAUGE, PAS, POLICE, RAYON, TYPO, couleurs } from "../../lib/theme";
import { TRANSITION } from "../../lib/bureau";
import { SemaineParlement } from "../semaine";
import { enfonce } from "../mouvement";
import { niveauTitre } from "../titre";

/* ---------- briques ---------- */

function Widget({ titre, source, children, testID, lien, interactif = false, style }: { titre: string; source?: string | null; children: ReactNode; testID?: string; lien?: { texte: string; aller: () => void };
  /* La carte contient déjà des boutons (bulle « En clair »…) : elle n'est pas un lien en entier (pas de contrôle dans
     un contrôle) ; le lien est alors écrit en bas. */
  interactif?: boolean; style?: object }) {
  /* Refonte premium (porteur, 25/11/2026) : un filet fin, aucune ombre, beaucoup d'air. Au survol, le filet se
     fonce et la flèche avance, en 200 ms. */
  const corps = (survol: boolean) => (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: PAS * 2 }}>
        <Text style={TYPO.etiquette} {...niveauTitre(2)}>{titre}</Text>
        {lien && !interactif ? <Ionicons name="arrow-forward" size={18} color={survol ? couleurs.encre : couleurs.sourd}
          style={[{ transform: [{ translateX: survol ? 3 : 0 }] }, TRANSITION]} accessible={false} importantForAccessibility="no" /> : null}
      </View>
      <View style={{ flex: 1, gap: PAS * 4 }}>{children}</View>
      {lien && interactif ? (
        <Pressable onPress={lien.aller} accessibilityRole="link"
          style={({ pressed }) => [{ minHeight: CIBLE, flexDirection: "row", alignItems: "center", gap: PAS * 2, alignSelf: "flex-start" }, pressed && enfonce(true)]}>
          {st => (
            <>
              <Text style={[TYPO.corps, { fontFamily: POLICE.texteMoyen, color: couleurs.lien }]}>{lien.texte}</Text>
              <Ionicons name="arrow-forward" size={18} color={couleurs.lien} style={[{ transform: [{ translateX: (st as { hovered?: boolean }).hovered ? 3 : 0 }] }, TRANSITION]} accessible={false} importantForAccessibility="no" />
            </>
          )}
        </Pressable>
      ) : null}
      {source ? <Text style={TYPO.micro} testID="widget-source">{source}</Text> : null}
    </>
  );
  const base = [{ flex: 1, gap: PAS * 5, padding: PAS * 8, borderRadius: RAYON.carte, borderWidth: 1, backgroundColor: couleurs.carte }, TRANSITION, style];
  if (!lien || interactif) return <View testID={testID} style={[...base, { borderColor: couleurs.trait }]}>{corps(false)}</View>;
  return (
    <Pressable testID={testID} onPress={lien.aller} accessibilityRole="link" accessibilityLabel={`${titre}. ${lien.texte}`}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [...base, { borderColor: hovered ? couleurs.sourd : couleurs.trait }, pressed && enfonce(true)]}>
      {st => corps(!!(st as { hovered?: boolean }).hovered)}
    </Pressable>
  );
}

/* « EN CLAIR » : un mot du dictionnaire, avec sa définition en bulle au survol (souris) ou au toucher. */
export function EnClair({ mot, texte }: { mot: string; texte?: string }) {
  const def = definition(mot) as { titre: string; corps: string } | null;
  const [ouvert, setOuvert] = useState(false);
  if (!def) return <Text style={TYPO.corps}>{texte || mot}</Text>;
  return (
    <View style={{ alignSelf: "flex-start", zIndex: ouvert ? 20 : 0 }}>
      <Pressable onPress={() => setOuvert(o => !o)} onHoverIn={() => setOuvert(true)} onHoverOut={() => setOuvert(false)}
        accessibilityRole="button" accessibilityLabel={`En clair : ${def.titre}`} accessibilityState={{ expanded: ouvert }}
        style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: PAS, minHeight: CIBLE, alignSelf: "flex-start" }, pressed && enfonce(true)]}>
        <Text style={[TYPO.corps, { fontFamily: POLICE.texteMoyen }]}>{texte || def.titre}</Text>
        <Ionicons name="help-circle-outline" size={18} color={couleurs.sourd} accessible={false} importantForAccessibility="no" />
      </Pressable>
      {ouvert ? (
        <View accessibilityLiveRegion="polite" style={{ position: "absolute", top: CIBLE, left: 0, width: 320, padding: PAS * 4, gap: PAS,
          borderRadius: RAYON.bloc, backgroundColor: couleurs.encre }}>
          <Text style={[TYPO.etiquette, { color: couleurs.sol }]}>En clair</Text>
          <Text style={[TYPO.note, { color: couleurs.sol }]}>{def.corps}</Text>
        </View>
      ) : null}
    </View>
  );
}

/* L'anneau, en SVG du navigateur. Les parts sont écrites à côté : la couleur ne porte jamais seule le sens. */
function Anneau({ parts, taille = 180 }: { parts: { valeur: number; couleur: string }[]; taille?: number }) {
  const r = 76, c = 2 * Math.PI * r, total = parts.reduce((a, p) => a + p.valeur, 0) || 1;
  let deja = 0;
  return createElement("svg", { width: taille, height: taille, viewBox: "0 0 180 180", role: "img", "aria-hidden": true },
    parts.map((p, i) => {
      const long = (p.valeur / total) * c;
      const el = createElement("circle", { key: i, cx: 90, cy: 90, r, fill: "none", stroke: p.couleur, strokeWidth: 16,
        strokeDasharray: `${long} ${c - long}`, strokeDashoffset: -deja, transform: "rotate(-90 90 90)" });
      deja += long;
      return el;
    }));
}

/* ---------- widgets ---------- */

type Scrutin = { n: string; d: string; t: string; dl?: string; sl?: string; dec?: { pour?: string; contre?: string; abstentions?: string } };

function DernierScrutin() {
  const [s, setS] = useState<Scrutin | null | undefined>(undefined);
  const [src, setSrc] = useState<{ producteur?: string; maj?: string } | null>(null);
  const COULEUR = useCouleurVote();
  useEffect(() => {
    let vivant = true;
    chargerCatalogueScrutins().then(r => {
      if (!vivant) return;
      const d = r.donnees as { scrutins?: Scrutin[]; source?: { producteur?: string; maj?: string } } | null;
      const liste = (d?.scrutins || []).filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x.d) && x.dec);
      setSrc(d?.source || null);
      setS(liste.length ? liste.reduce((a, b) => (b.d > a.d ? b : a)) : null);
    }).catch(() => { if (vivant) setS(null); });
    return () => { vivant = false; };
  }, []);
  const n = (x?: string) => Number(x || 0);
  const parts = s && s.dec ? [
    { cle: "Pour", v: n(s.dec.pour), couleur: COULEUR.p },
    { cle: "Contre", v: n(s.dec.contre), couleur: COULEUR.c },
    { cle: "Abstention", v: n(s.dec.abstentions), couleur: COULEUR.a },
  ] : [];
  const total = parts.reduce((a, p) => a + p.v, 0);
  return (
    <Widget testID="widget-scrutin" titre="Le dernier scrutin solennel" interactif
      source={src && src.producteur ? `Source : ${src.producteur}${src.maj ? `, relevé le ${dateFr(src.maj)}` : ""}. Le plus récent du catalogue, pas « le plus important ».` : null}
      lien={{ texte: "Tous les votes au Parlement", aller: () => router.push("/scrutins") }}>
      {s === undefined ? <Text style={TYPO.note}>Chargement…</Text> : s === null || !total ? (
        <Text style={TYPO.corps}>Le catalogue des scrutins n'a pas pu être lu sur cet appareil. La page du Parlement dit pourquoi.</Text>
      ) : (
        <>
          <Text style={TYPO.note}>{dateFr(s.d)} · Assemblée nationale · {total.toLocaleString("fr-FR")} députés ont voté</Text>
          <Text style={[TYPO.section, { fontFamily: POLICE.titre }]}>{s.dl || titreLisible(s.t)}</Text>
          {s.sl ? <Text style={[TYPO.corps, { color: couleurs.sourd }]}>Résultat : {s.sl}.</Text> : null}
          <View style={{ flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden", gap: 2, backgroundColor: couleurs.voile }} accessible={false}>
            {parts.filter(p => p.v > 0).map(p => <View key={p.cle} style={{ flex: p.v, backgroundColor: p.couleur }} />)}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: PAS * 6, rowGap: PAS }}>
            {parts.map(p => (
              <View key={p.cle} style={{ flexDirection: "row", alignItems: "center", gap: PAS * 2 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.couleur }} />
                <Text style={[TYPO.note, { color: couleurs.encre }]}>{p.cle} <Text style={{ fontFamily: POLICE.donneeForte }}>{p.v.toLocaleString("fr-FR")}</Text></Text>
              </View>
            ))}
          </View>
          <EnClair mot="scrutin solennel" texte="Qu'est-ce qu'un scrutin solennel ?" />
        </>
      )}
    </Widget>
  );
}

function Budget() {
  const { r } = useCommuneChoisie();
  const pret = r.pret ? r : null;
  const hab = pret && pret.d.exercice ? parHabitant(pret.d.exercice.ex) : null;
  const src = pret ? (pret.index?.sources?.comptes as { producteur?: string; maj?: string } | undefined) : undefined;
  const source = src && src.producteur ? `Source : ${src.producteur}${src.maj ? `, mis à jour le ${dateFr(src.maj)}` : ""}. Parts : calcul Repère.` : null;
  if (!pret || !hab || hab.depenses === null) {
    return (
      <Widget testID="widget-budget" titre="Le budget de votre commune">
        <Text style={[TYPO.section, { fontFamily: POLICE.texte }]}>{pret ? `Les comptes de ${pret.d.nomCommune} ne sont pas publiés dans les données de Repère.` : "Tapez votre commune dans la recherche : ses dépenses par habitant s'afficheront ici, avec leur source."}</Text>
      </Widget>
    );
  }
  const sal = hab.salaires, inv = hab.investissement, dep = hab.depenses;
  const parts = sal !== null && inv !== null && sal + inv <= dep ? [
    { cle: "Salaires", valeur: sal, couleur: JAUGE.salaires },
    { cle: "Investissements", valeur: inv, couleur: JAUGE.investissement },
    { cle: "Autres dépenses", valeur: dep - sal - inv, couleur: JAUGE.autres },
  ] : null;
  return (
    <Widget testID="widget-budget" interactif titre={`Budget de ${pret.d.nomCommune}, ${pret.d.exercice.an}`} source={source}
      lien={{ texte: "Le budget en détail", aller: () => router.push("/finances") }}>
      <View style={{ gap: PAS }}>
        {/* hors échelle : chiffre clé du bureau, 48 px en demi-gras (porteur : impactant mais fin). */}
        <Text testID="chiffre-cle" style={{ fontFamily: POLICE.donneeForte, fontSize: 48 /* hors échelle : chiffre clé du bureau, porteur 25/11/2026 */, lineHeight: 56, letterSpacing: -1.5, color: couleurs.encre, fontVariant: ["tabular-nums"] }}>
          {dep.toLocaleString("fr-FR")}{" "}€
        </Text>
        <Text style={[TYPO.corps, { color: couleurs.sourd }]}>dépensés par habitant</Text>
      </View>
      {parts ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: PAS * 6 }}>
          <Anneau parts={parts} taille={112} />
          <View style={{ flex: 1, gap: PAS * 2 }}>
            {parts.map(p => (
              <View key={p.cle} style={{ flexDirection: "row", alignItems: "center", gap: PAS * 2 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.couleur }} />
                <Text style={[TYPO.note, { flex: 1, color: couleurs.encre }]}>{p.cle}</Text>
                <Text style={[TYPO.note, { fontFamily: POLICE.donneeForte, color: couleurs.encre }]}>{Math.round(p.valeur / dep * 100)}{" "}%</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      <EnClair mot="investissement" texte="Investir, ça veut dire quoi ?" />
    </Widget>
  );
}

function Agenda() {
  const { r } = useCommuneChoisie();
  if (!r.pret) return (
    <Widget testID="widget-agenda" titre="Cette semaine au Parlement">
      <Text style={[TYPO.section, { fontFamily: POLICE.texte }]}>L'agenda de l'Assemblée et du Sénat s'affiche ici une fois votre commune choisie.</Text>
    </Widget>
  );
  /* Le calendrier a déjà sa carte (ui/semaine.tsx) : on lui donne l'habit des autres cartes, sans l'emboîter. */
  return (
    <View testID="widget-agenda" style={{ flex: 1 }}>
      <SemaineParlement sp={r.d.semaineParlement} lu={r.agendaLu} nom={r.d.nomCommune}
        style={{ flex: 1, padding: PAS * 8, gap: PAS * 4, borderWidth: 1, borderColor: couleurs.trait, shadowOpacity: 0, elevation: 0 }} />
    </View>
  );
}

/* Les sigles de partis ne sont jamais « le mot du jour » : le dictionnaire les définit, la une ne les met pas en avant. */
const SIGLES_PARTIS = ["ps", "lr", "rn", "lfi", "eelv", "epr", "pcf", "modem", "hor", "dem", "gdr", "liot", "udi"];
function MotDuJour() {
  const cle = useMemo(() => {
    const cles = Object.keys(GLOSSAIRE).filter(k => !SIGLES_PARTIS.includes(k));
    const jour = jourParis(new Date());
    const n = [...jour].reduce((a, ch) => a + ch.charCodeAt(0), 0);
    return cles[n % cles.length];
  }, []);
  const def = definition(cle) as { titre: string; corps: string };
  return (
    <Widget testID="widget-mot" titre="Le mot du jour" source="Dictionnaire citoyen de Repère. Un mot par jour, pris dans le dictionnaire."
      lien={{ texte: "Tester ses connaissances au quiz", aller: () => router.push("/quiz") }}>
      <Text style={TYPO.section}>{def.titre}</Text>
      <Text style={TYPO.corps}>{def.corps}</Text>
    </Widget>
  );
}

/* ---------- la grille ---------- */

/* Refonte premium (porteur, 25/11/2026) : quatre cartes, deux lignes. Le budget de la commune (ce qu'on vient
   chercher) et le dernier vote ; puis la semaine au Parlement et le mot du jour. L'hémicycle et le plan de
   l'Île-de-France sont retirés du tableau de bord tant que leurs données (plan réel, GeoJSON) ne sont pas publiées. */
export function TableauDeBord(_: { communes: [string, string, ...unknown[]][]; ouvrir: (insee: string, nom: string) => void }) {
  const ligne = { flexDirection: "row" as const, gap: PAS * 6, alignItems: "stretch" as const, flexWrap: "wrap" as const };
  const col = (n: number, min = 320) => ({ flexGrow: n, flexShrink: 1, flexBasis: 0, minWidth: min, display: "flex" as const });
  return (
    <View testID="tableau-de-bord" style={{ gap: PAS * 6, marginTop: PAS * 8 }}>
      <View style={ligne}>
        <View style={col(5)}><Budget /></View>
        <View style={col(7, 420)}><DernierScrutin /></View>
      </View>
      <View style={ligne}>
        <View style={col(7, 420)}><Agenda /></View>
        <View style={col(5)}><MotDuJour /></View>
      </View>
    </View>
  );
}
