/* TITRE ET DESCRIPTION DE LA PAGE, DANS LE NAVIGATEUR (porteur, 26/11/2026 : « Découvrez le budget de Melun »).
 * Sur le web seulement. L'onglet du navigateur et les moteurs qui exécutent le JavaScript voient le nom de la commune ;
 * le serveur, jamais (la commune reste après le « # », invariant 2). Les pages par écran du build (scripts/seo.mjs)
 * donnent la description générique aux aperçus de lien, qui ne lisent pas le JavaScript. */
import { useEffect } from "react";
import { Platform } from "react-native";

export function poserMeta(titre: string, description: string) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  document.title = `${titre} · Repère`;
  let m = document.querySelector('meta[name="description"]');
  if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
  m.setAttribute("content", description);
}

export function useMeta(titre: string | null, description: string | null) {
  useEffect(() => { if (titre && description) poserMeta(titre, description); }, [titre, description]);
}
