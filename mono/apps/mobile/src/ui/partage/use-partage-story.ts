/* Capture la carte story (9:16) puis la partage par la chaîne unique de partager.ts.
 *
 * Téléphone : react-native-view-shot (fichier temporaire 1080 x 1920).
 * Web (23/11/2026, audit C2) : html2canvas-pro, appelé directement avec l'échelle qui donne 1080 px de large quel
 * que soit l'écran (la redimension de view-shot étirait une image de 360 px sur un ordinateur : floue).
 * Safari exige que le partage suive de près le geste : si la capture a été trop longue, il refuse (NotAllowedError).
 * L'image est alors gardée, et le second appui la partage tout de suite (« Image prête »). */
import { useRef, useState, type ComponentRef } from "react";
import { Platform, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { partager as partagerChaine, type Resultat } from "./partager";

const LARGEUR = 1080, HAUTEUR = 1920;

async function captureWeb(el: HTMLElement): Promise<string> {
  const html2canvas = (await import("html2canvas-pro")).default;
  const largeur = el.getBoundingClientRect().width || 360;
  const toile = await html2canvas(el, { scale: LARGEUR / largeur, backgroundColor: null, useCORS: true, logging: false });
  return toile.toDataURL("image/png");
}

export function usePartageStory(repli: string, lien?: string) {
  const carte = useRef<ComponentRef<typeof View>>(null);
  const prete = useRef<string | null>(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const partager = async () => {
    const image = async () => {
      if (prete.current) return prete.current;
      if (Platform.OS === "web") return captureWeb(carte.current as unknown as HTMLElement);
      return captureRef(carte, { format: "png", quality: 1, result: "tmpfile", width: LARGEUR, height: HAUTEUR });
    };
    let uri: string | null = null;
    const r = await partagerChaine({ texte: repli, lien, image: async () => (uri = await image()) });
    if (r === "refuse" && uri) { prete.current = uri; setResultat("refuse"); return; }
    prete.current = null;
    setResultat(r);
  };
  return { carte, partager, resultat };
}
