/* LE HUB DES OUTILS CITOYENS (porteur, 27/11/2026). Fonctions pures, éprouvées par tests/outils.test.mjs ; l'écran
 * est app/(onglets)/outils.tsx, la liste src/lib/outils-citoyens.json (embarquée : lisible hors ligne, aucune
 * requête vers ces services tant que le lecteur ne touche pas un lien).
 *
 * « TÉLÉCHARGER L'APP » : sur iPhone ou iPad, l'App Store ; sur Android, le Play Store ; ailleurs (ordinateur), ou si
 * le magasin de cet appareil n'a pas l'application, le site officiel. Aucun logo : ce sont des marques de l'État et
 * des caisses, et Repère ne leur est pas affilié ; le nom est écrit en toutes lettres. */

export type Outil = {
  id: string; nom: string; categorie: string; description_simple: string; url_web: string;
  nom_app?: string; app_store_url: string | null; play_store_url: string | null;
};
export type Systeme = "ios" | "android" | null;

/* `ios` vient de estIos (lib/installation.ts, seule règle de l'iPhone et de l'iPad dans l'application) : l'écran
   le calcule et le passe ici, pour que ce module reste lisible par les tests de Node sans dépendance. */
export function systemeMobile(ua: string, ios: boolean): Systeme {
  if (ios) return "ios";
  if (/Android/i.test(ua)) return "android";
  return null;
}

export const aUneApp = (o: Outil) => Boolean(o.app_store_url || o.play_store_url);

/* Où mène « Télécharger l'app », et ce que le lecteur doit savoir avant d'y aller. */
export function lienApp(o: Outil, systeme: Systeme): { url: string; vers: string } {
  if (systeme === "ios" && o.app_store_url) return { url: o.app_store_url, vers: "l'App Store" };
  if (systeme === "android" && o.play_store_url) return { url: o.play_store_url, vers: "le Play Store" };
  return { url: o.url_web, vers: "le site officiel" };
}

const plier = (s: string) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[\u2019']/g, " ");

/* Recherche sur le nom, la description et la catégorie, sans tenir compte des accents ni des majuscules :
   « impot », « Impôts » et « IMPÔTS » trouvent impots.gouv. Chaque mot tapé doit se trouver quelque part. */
export function filtrerOutils(outils: Outil[], recherche: string): Outil[] {
  const mots = plier(recherche).split(/\s+/).filter(Boolean);
  if (!mots.length) return outils;
  return outils.filter(o => {
    const t = plier(`${o.nom} ${o.description_simple} ${o.categorie} ${o.nom_app || ""}`);
    return mots.every(m => t.includes(m));
  });
}

/* Les catégories dans l'ordre FIXE du fichier (aucune valeur attachée à cet ordre), chacune avec ses services par ordre alphabétique ;
   une catégorie vide après recherche n'est pas montrée. */
export function parCategorie(outils: Outil[], ordre: string[]): { categorie: string; outils: Outil[] }[] {
  return ordre
    .map(categorie => ({ categorie, outils: outils.filter(o => o.categorie === categorie).sort((a, b) => a.nom.localeCompare(b.nom, "fr")) }))
    .filter(g => g.outils.length > 0);
}
