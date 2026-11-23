/* LE PARTAGE, UNE SEULE CHAÎNE DE REPLI (23/11/2026, audit pré-bêta C2/C3).
 *
 * Mesuré avant ce correctif : sur le web, la capture échouait toujours (html2canvas-pro absent), le téléphone
 * recevait un texte sans image ni lien, et sur ordinateur (pas de navigator.share) le clic ne faisait RIEN :
 * l'erreur du second Share.share n'était pas rattrapée. Ici, chaque cas finit par un résultat dit à l'écran :
 *   1. téléphone (iOS, Android natifs) : l'image capturée, puis la feuille de partage ; sinon le texte seul ;
 *   2. web avec partage de fichier (Safari iOS, Chrome Android) : l'image PNG + le texte + le lien ;
 *   3. web avec partage de texte seulement : le texte + le lien ;
 *   4. web sans partage (ordinateur) : le PNG est téléchargé et le texte copié.
 * « annule » : le lecteur a fermé la feuille de partage ; ce n'est pas une panne, on ne dit rien.
 * « refuse » : Safari a refusé parce que le geste a expiré pendant la capture ; un second appui suffit. */
import { Platform, Share } from "react-native";

export type Resultat = "partage" | "annule" | "refuse" | "telecharge" | "copie" | "telecharge-copie" | "impossible";

export const MESSAGE_RESULTAT: Record<Resultat, string> = {
  partage: "",
  annule: "",
  refuse: "Image prête : touchez à nouveau pour la partager.",
  telecharge: "Image téléchargée.",
  copie: "Texte et lien copiés.",
  "telecharge-copie": "Image téléchargée, texte et lien copiés.",
  impossible: "Le partage n'est pas possible sur cet appareil.",
};

const estAnnulation = (e: unknown) => (e as { name?: string })?.name === "AbortError";

async function copier(texte: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(texte); return true; } catch { return false; }
}

function telecharger(dataUrl: string, nom: string): boolean {
  try {
    const a = document.createElement("a");
    a.href = dataUrl; a.download = nom; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
    return true;
  } catch { return false; }
}

/* Décodage à la main, sans fetch : la politique de sécurité publiée (connect-src 'self', scripts/cloudflare.mjs)
   refuse un fetch d'adresse data:. */
async function fichierDepuis(dataUrl: string, nom: string): Promise<File | null> {
  try {
    const [entete, b64] = dataUrl.split(",");
    const type = /data:([^;]+)/.exec(entete)?.[1] || "image/png";
    const bin = atob(b64);
    const octets = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) octets[i] = bin.charCodeAt(i);
    return new File([octets], nom, { type });
  } catch { return null; }
}

/* `image` : une fonction qui rend l'adresse de l'image (fichier temporaire sur téléphone, data: sur le web),
   ou qui échoue. `texte` ne contient pas le lien ; `lien` est ajouté là où la plateforme l'accepte. */
export async function partager({ image, texte, lien, nomFichier = "repere.png" }: {
  image?: () => Promise<string>; texte: string; lien?: string; nomFichier?: string;
}): Promise<Resultat> {
  const message = lien ? `${texte}\n${lien}` : texte;
  let uri: string | null = null;
  if (image) { try { uri = await image(); } catch { uri = null; } }

  if (Platform.OS !== "web") {
    try {
      await Share.share(uri ? { url: uri, message } : { message });
      return "partage";
    } catch (e) { return estAnnulation(e) ? "annule" : "impossible"; }
  }

  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const fichier = uri ? await fichierDepuis(uri, nomFichier) : null;
  if (nav?.share) {
    try {
      if (fichier && nav.canShare?.({ files: [fichier] })) {
        await nav.share({ files: [fichier], text: message });
        return "partage";
      }
      await nav.share(lien ? { text: texte, url: lien } : { text: texte });
      return "partage";
    } catch (e) {
      if (estAnnulation(e)) return "annule";
      /* Safari : le geste a expiré pendant la capture. L'appelant garde l'image et redemande un appui. */
      if ((e as { name?: string })?.name === "NotAllowedError") return "refuse";
      /* Autre refus : repli ordinateur. */
    }
  }
  const t = uri ? telecharger(uri, nomFichier) : false;
  const c = await copier(message);
  return t && c ? "telecharge-copie" : t ? "telecharge" : c ? "copie" : "impossible";
}
