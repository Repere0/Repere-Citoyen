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
import { GLOSSAIRE, dateFr, definition, departementDe, jourParis, parHabitant, titreLisible } from "@repere/core";
import { chargerCatalogueScrutins } from "../../lib/donnees";
import { useCommuneChoisie } from "../../lib/useCommune";
import { useCouleurVote } from "../../lib/couleur-vote";
import { useProfil } from "../../lib/profil";
import { CIBLE, JAUGE, OMBRE, PAS, POLICE, RAYON, TYPO, couleurs } from "../../lib/theme";
import { useBureau } from "../../lib/bureau";
import { Hemicycle } from "../hemicycle";
import { useFichierGroupes } from "../../lib/groupes";
import { SemaineParlement } from "../semaine";
import { enfonce } from "../mouvement";
import { niveauTitre } from "../titre";

/* ---------- briques ---------- */

function Widget({ titre, source, children, testID, lien }: { titre: string; source?: string | null; children: ReactNode; testID?: string; lien?: { texte: string; aller: () => void } }) {
  return (
    <View testID={testID} style={{ flex: 1, gap: PAS * 4, padding: PAS * 6, borderRadius: RAYON.carte, backgroundColor: couleurs.carte, ...OMBRE }}>
      <Text style={TYPO.etiquette} {...niveauTitre(2)}>{titre}</Text>
      <View style={{ flex: 1, gap: PAS * 4 }}>{children}</View>
      {lien ? (
        <Pressable onPress={lien.aller} accessibilityRole="link" style={({ pressed }) => [{ minHeight: CIBLE, justifyContent: "center", alignSelf: "flex-start" }, pressed && enfonce(true)]}>
          <Text style={[TYPO.corps, { fontFamily: POLICE.texteMoyen, color: couleurs.lien }]}>{lien.texte} →</Text>
        </Pressable>
      ) : null}
      {source ? <Text style={TYPO.micro} testID="widget-source">{source}</Text> : null}
    </View>
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
        style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: PAS, minHeight: CIBLE }, pressed && enfonce(true)]}>
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
  const r = 70, c = 2 * Math.PI * r, total = parts.reduce((a, p) => a + p.valeur, 0) || 1;
  let deja = 0;
  return createElement("svg", { width: taille, height: taille, viewBox: "0 0 180 180", role: "img", "aria-hidden": true },
    parts.map((p, i) => {
      const long = (p.valeur / total) * c;
      const el = createElement("circle", { key: i, cx: 90, cy: 90, r, fill: "none", stroke: p.couleur, strokeWidth: 28,
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
    <Widget testID="widget-scrutin" titre="Le dernier scrutin solennel"
      source={src && src.producteur ? `Source : ${src.producteur}${src.maj ? `, relevé le ${dateFr(src.maj)}` : ""}. Le plus récent du catalogue, pas « le plus important ».` : null}
      lien={{ texte: "Tous les votes au Parlement", aller: () => router.push("/scrutins") }}>
      {s === undefined ? <Text style={TYPO.note}>Chargement…</Text> : s === null || !total ? (
        <Text style={TYPO.corps}>Le catalogue des scrutins n'a pas pu être lu sur cet appareil. La page du Parlement dit pourquoi.</Text>
      ) : (
        <>
          <Text style={TYPO.note}>{dateFr(s.d)} · Assemblée nationale</Text>
          <Text style={TYPO.section}>{s.dl || titreLisible(s.t)}</Text>
          {s.sl ? <Text style={[TYPO.corps, { color: couleurs.sourd }]}>Résultat : {s.sl}.</Text> : null}
          <View style={{ flexDirection: "row", height: 20, borderRadius: 10, overflow: "hidden", backgroundColor: couleurs.voile }} accessible={false}>
            {parts.filter(p => p.v > 0).map(p => <View key={p.cle} style={{ flex: p.v, backgroundColor: p.couleur }} />)}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: PAS * 6, rowGap: PAS }}>
            {parts.map(p => (
              <View key={p.cle} style={{ flexDirection: "row", alignItems: "center", gap: PAS * 2 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: p.couleur }} />
                <Text style={TYPO.corps}>{p.cle} : <Text style={{ fontFamily: POLICE.donneeForte }}>{p.v.toLocaleString("fr-FR")}</Text> député{p.v > 1 ? "s" : ""}</Text>
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
      <Widget testID="widget-budget" titre="Où va l'argent de ma commune">
        <Text style={TYPO.corps}>{pret ? `Les comptes de ${pret.d.nomCommune} ne sont pas publiés dans les données de Repère.` : "Choisissez votre commune dans la recherche, en haut : son budget par habitant s'affichera ici."}</Text>
      </Widget>
    );
  }
  const sal = hab.salaires, inv = hab.investissement, dep = hab.depenses;
  const parts = sal !== null && inv !== null && sal + inv <= dep ? [
    { cle: "Salaires", valeur: sal, couleur: JAUGE.salaires },
    { cle: "Investir", valeur: inv, couleur: JAUGE.investissement },
    { cle: "Autres dépenses", valeur: dep - sal - inv, couleur: JAUGE.autres },
  ] : null;
  return (
    <Widget testID="widget-budget" titre={`Où va l'argent · ${pret.d.nomCommune} · ${pret.d.exercice.an}`} source={source}
      lien={{ texte: "Le budget en détail", aller: () => router.push("/finances") }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: PAS * 6, flexWrap: "wrap" }}>
        {parts ? <Anneau parts={parts} /> : null}
        <View style={{ flex: 1, minWidth: 200, gap: PAS * 2 }}>
          <Text style={TYPO.chiffre}>{dep.toLocaleString("fr-FR")}{" "}€</Text>
          <Text style={TYPO.note}>dépensés par habitant en {pret.d.exercice.an}</Text>
          {parts ? parts.map(p => (
            <View key={p.cle} style={{ flexDirection: "row", alignItems: "center", gap: PAS * 2 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: p.couleur }} />
              <Text style={TYPO.corps}>{p.cle} : <Text style={{ fontFamily: POLICE.donneeForte }}>{Math.round(p.valeur).toLocaleString("fr-FR")}{" "}€</Text> ({Math.round(p.valeur / dep * 100)}{" "}%)</Text>
            </View>
          )) : null}
          <EnClair mot="investissement" texte="Investir, ça veut dire quoi ?" />
        </View>
      </View>
    </Widget>
  );
}

function Agenda() {
  const { r } = useCommuneChoisie();
  if (!r.pret) return (
    <Widget testID="widget-agenda" titre="L'agenda de la semaine">
      <Text style={TYPO.corps}>Le calendrier du Parlement s'affiche ici une fois votre commune choisie (il nomme votre député).</Text>
    </Widget>
  );
  return (
    <Widget testID="widget-agenda" titre="L'agenda de la semaine" lien={{ texte: "Tout le calendrier", aller: () => router.push("/a-venir") }}>
      <SemaineParlement sp={r.d.semaineParlement} lu={r.agendaLu} nom={r.d.nomCommune} />
    </Widget>
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

/* LA CARTE DE L'ÎLE-DE-FRANCE, en PLAN SCHÉMATIQUE : les 8 départements à leur place relative, pas leur forme.
   Les vrais contours (IGN, Licence ouverte) demandent un fichier que la collecte ne publie pas encore : on ne dessine
   pas une forme inventée en la présentant comme réelle. Un département ouvre la liste de ses communes. */
const PLAN: [string, number, number][] = [ // code, colonne, ligne (grille 4 x 3)
  ["95", 1, 0], ["78", 0, 1], ["92", 1, 1], ["75", 2, 1], ["93", 3, 1], ["91", 1, 2], ["94", 2, 2], ["77", 3, 2],
];
const NOMS_DEP: Record<string, string> = { "75": "Paris", "77": "Seine-et-Marne", "78": "Yvelines", "91": "Essonne", "92": "Hauts-de-Seine", "93": "Seine-Saint-Denis", "94": "Val-de-Marne", "95": "Val-d'Oise" };

export function CarteIdf({ communes, ouvrir }: { communes: [string, string, ...unknown[]][]; ouvrir: (insee: string, nom: string) => void }) {
  const [dep, setDep] = useState<string | null>(null);
  const liste = useMemo(() => (dep ? communes.filter(c => departementDe(c[0]) === dep).sort((a, b) => a[1].localeCompare(b[1], "fr")) : []), [dep, communes]);
  return (
    <Widget testID="widget-carte" titre="L'Île-de-France, département par département"
      source="Plan schématique : chaque case est un département à sa place relative, pas sa forme réelle. Communes : découpage administratif Etalab.">
      <View style={{ gap: PAS }} accessibilityRole="radiogroup" aria-label="Départements d'Île-de-France">
        {[0, 1, 2].map(ligne => (
          <View key={ligne} style={{ flexDirection: "row", gap: PAS }}>
            {[0, 1, 2, 3].map(col => {
              const x = PLAN.find(p => p[1] === col && p[2] === ligne);
              if (!x) return <View key={col} style={{ flex: 1, flexBasis: 0, minWidth: 0 }} />;
              const actif = dep === x[0];
              return (
                <Pressable key={col} onPress={() => setDep(actif ? null : x[0])} accessibilityRole="radio" accessibilityState={{ checked: actif }} aria-checked={actif}
                  accessibilityLabel={`${NOMS_DEP[x[0]]} (${x[0]})`} testID={`dep-${x[0]}`}
                  style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [{ flex: 1, flexBasis: 0, minWidth: 0, minHeight: 72, padding: PAS * 2, borderRadius: RAYON.bloc, justifyContent: "center",
                    borderWidth: 1, borderColor: actif || hovered ? couleurs.encre : couleurs.trait, backgroundColor: actif ? couleurs.encre : couleurs.voile }, pressed && enfonce(true)]}>
                  <Text style={[TYPO.corps, { fontFamily: POLICE.section, color: actif ? couleurs.sol : couleurs.encre }]}>{x[0]}</Text>
                  <Text numberOfLines={2} style={[TYPO.note, { color: actif ? couleurs.sol : couleurs.sourd }]}>{NOMS_DEP[x[0]]}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      {dep ? (
        liste.length ? (
          <View style={{ gap: PAS }}>
            <Text style={TYPO.note}>{liste.length.toLocaleString("fr-FR")} communes en {NOMS_DEP[dep]}, de A à Z</Text>
            <View style={{ maxHeight: 240, overflow: "scroll" as never, gap: 2 }}>
              {liste.map(c => (
                <Pressable key={c[0]} onPress={() => ouvrir(c[0], c[1])} accessibilityRole="button" accessibilityLabel={`Ouvrir ${c[1]}`}
                  style={({ pressed }) => [{ minHeight: 44, justifyContent: "center", paddingHorizontal: PAS * 2 }, pressed && enfonce(true)]}>
                  <Text style={TYPO.corps}>{c[1]}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : <Text style={TYPO.corps}>La liste des communes n'est pas encore chargée sur cet appareil.</Text>
      ) : <Text style={TYPO.note}>Choisissez un département pour voir ses communes.</Text>}
    </Widget>
  );
}

function HemicycleWidget() {
  const fichier = useFichierGroupes();
  return (
    <Widget testID="widget-hemicycle" titre="L'Assemblée nationale" lien={{ texte: "Les groupes et leurs députés", aller: () => router.push("/scrutins") }}>
      {/* Doctrine du vide : sans la table des groupes, une phrase, pas un cadre blanc. */}
      {fichier === undefined ? <Text style={TYPO.note}>Chargement…</Text>
        : fichier === null ? <Text style={TYPO.corps}>La composition de l'Assemblée n'a pas pu être lue sur cet appareil. La page du Parlement dit pourquoi.</Text>
        : <Hemicycle />}
      <EnClair mot="groupe parlementaire" texte="Un groupe, ce n'est pas un parti ?" />
    </Widget>
  );
}

/* ---------- le tour guidé (onboarding web) ---------- */

const ETAPES = [
  { icone: "business-outline", titre: "1. Qui décide chez vous", corps: "Votre maire, vos conseillers, votre député, vos sénateurs : leurs noms et ce qu'ils votent, d'après les sources officielles." },
  { icone: "wallet-outline", titre: "2. Où va votre argent", corps: "Le budget de votre commune, ramené à un habitant : salaires, investissements, autres dépenses." },
  { icone: "document-text-outline", titre: "3. D'où viennent les chiffres", corps: "Chaque chiffre dit sa source et sa date. Repère ne donne pas d'avis : il montre, vous jugez." },
] as const;

function TourGuide() {
  const { passer } = useProfil();
  const [i, setI] = useState(0);
  const e = ETAPES[i];
  return (
    <View testID="tour-guide" style={{ flexDirection: "row", alignItems: "center", gap: PAS * 6, padding: PAS * 6, borderRadius: RAYON.carte, backgroundColor: couleurs.carte, ...OMBRE }}>
      <Ionicons name={e.icone} size={40} color={couleurs.encre} accessible={false} importantForAccessibility="no" />
      <View style={{ flex: 1, gap: PAS }}>
        <Text style={TYPO.etiquette}>Comment ça marche · {i + 1} sur 3</Text>
        <Text style={TYPO.section} {...niveauTitre(2)}>{e.titre}</Text>
        <Text style={TYPO.corps}>{e.corps}</Text>
      </View>
      <View style={{ gap: PAS * 2 }}>
        <Pressable onPress={() => (i < 2 ? setI(i + 1) : passer())} accessibilityRole="button" testID="tour-suivant"
          style={({ pressed }) => [{ minHeight: CIBLE, paddingHorizontal: PAS * 6, borderRadius: RAYON.bloc, alignItems: "center", justifyContent: "center", backgroundColor: couleurs.encre }, pressed && enfonce(true)]}>
          <Text style={[TYPO.corps, { color: couleurs.sol, fontFamily: POLICE.texteMoyen }]}>{i < 2 ? "Suivant" : "C'est parti"}</Text>
        </Pressable>
        <Pressable onPress={passer} accessibilityRole="button" testID="tour-passer"
          style={({ pressed }) => [{ minHeight: CIBLE, alignItems: "center", justifyContent: "center" }, pressed && enfonce(true)]}>
          <Text style={[TYPO.note, { color: couleurs.sourd }]}>Passer</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ---------- la grille ---------- */

export function TableauDeBord({ communes, ouvrir }: { communes: [string, string, ...unknown[]][]; ouvrir: (insee: string, nom: string) => void }) {
  const { profil } = useProfil();
  const { large } = useBureau();
  /* Deux tiers / un tiers à partir de 1280 px ; moitié / moitié entre 1024 et 1280. */
  const ligne = { flexDirection: "row" as const, gap: PAS * 6, alignItems: "stretch" as const };
  const gauche = { flex: large ? 2 : 1 }, droite = { flex: 1 };
  return (
    <View testID="tableau-de-bord" style={{ gap: PAS * 6, marginTop: PAS * 2 }}>
      {!profil ? <TourGuide /> : null}
      <View style={ligne}>
        <View style={gauche}><DernierScrutin /></View>
        <View style={droite}><MotDuJour /></View>
      </View>
      <View style={ligne}>
        <View style={{ flex: 1 }}><Budget /></View>
        <View style={{ flex: 1 }}><Agenda /></View>
      </View>
      <View style={ligne}>
        <View style={gauche}><HemicycleWidget /></View>
        <View style={droite}><CarteIdf communes={communes} ouvrir={ouvrir} /></View>
      </View>
    </View>
  );
}
