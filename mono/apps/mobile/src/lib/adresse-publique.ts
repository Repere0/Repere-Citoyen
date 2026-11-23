/* L'ADRESSE PUBLIQUE DE REPÈRE (23/11/2026, décision du porteur : « repere-citoyen.fr » en attendant l'achat du domaine).
 *
 * UNE seule source : app.json, expo.extra.adressePublique (lue aussi par scripts/pwa.mjs pour og:url et og:image).
 * Sur le web, un lien partagé prend l'adresse RÉELLE de la page (window.location.origin) : il marche donc avant
 * que le domaine soit acheté et branché. Sur téléphone (pas d'adresse de page), on prend l'adresse publique.
 * Jamais « repere:// » : ce schéma ne s'ouvre que si l'application native est installée.
 * La commune, quand il y en a une, va APRÈS le « # » : le navigateur ne l'envoie jamais au serveur (invariant 2). */
import Constants from "expo-constants";
import { Platform } from "react-native";

export const ADRESSE_PUBLIQUE: string =
  ((Constants.expoConfig?.extra as { adressePublique?: string } | undefined)?.adressePublique || "https://repere-citoyen.fr").replace(/\/$/, "");

/* « https://…/argent » ou « https://…/argent#melun ». `chemin` sans « / » initial ; `slug` déjà calculé (jamais un code INSEE). */
export function lienPublic(chemin: string = "", slug?: string | null): string {
  const base = Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin ? window.location.origin : ADRESSE_PUBLIQUE;
  const c = chemin.replace(/^\/+/, "");
  return `${base}/${c}${slug ? "#" + slug : ""}`;
}
