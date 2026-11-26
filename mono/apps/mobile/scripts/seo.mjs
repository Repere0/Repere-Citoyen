/* RÉFÉRENCEMENT (porteur, 26/11/2026 : « meta description sur les pages principales, sitemap.xml, robots.txt »).
 *
 * L'application est une page unique : un seul index.html sert tous les écrans. Google exécute le JavaScript, mais
 * pas les aperçus de lien (WhatsApp, réseaux) : on écrit donc, au build, une copie de index.html PAR ÉCRAN PRINCIPAL
 * avec son titre et sa description (Cloudflare Pages sert /finances depuis finances.html). Le même JavaScript démarre
 * ensuite : rien ne change pour le lecteur.
 *
 * PAS de page par commune : la commune vit après le « # » pour que le serveur ne sache jamais laquelle est lue
 * (invariant 2). Le titre propre à la commune est posé dans le navigateur (lib/meta.ts), pas indexable à part.
 *
 * INDEXATION SEULEMENT EN PRODUCTION : sans ADRESSE_SITE (aperçus de branche, builds locaux), robots.txt interdit
 * tout. Un aperçu indexé ferait concurrence au vrai site avec des pages non relues. */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const PAGES = [
  { chemin: "finances", titre: "Où va l'argent de ma commune", description: "Le budget de votre commune d'Île-de-France : dépenses, recettes, dette, projets. Chiffres officiels de l'OFGL, sourcés et datés." },
  { chemin: "qui-decide", titre: "Qui décide chez moi", description: "Maire, conseil municipal, intercommunalité, département, région, député : qui décide quoi pour votre commune d'Île-de-France." },
  { chemin: "chez-vous", titre: "Ma commune", description: "Ce qui se passe chez vous : budget, élus, projets et votes, avec leurs sources officielles." },
  { chemin: "scrutins", titre: "Les votes du Parlement", description: "Les scrutins de l'Assemblée nationale et du Sénat : ce qui a été voté, par qui, avec le lien vers le texte officiel." },
  { chemin: "a-venir", titre: "Le calendrier", description: "Les séances du Parlement et les rendez-vous de la vie publique, semaine par semaine, d'après les agendas officiels." },
  { chemin: "presidentielle-2027", titre: "Présidentielle 2027", description: "Les dates, les règles et les étapes de l'élection présidentielle de 2027, d'après le service public et le Conseil constitutionnel." },
  { chemin: "dictionnaire", titre: "Dictionnaire citoyen", description: "Les mots de la vie publique expliqués simplement : 49.3, navette parlementaire, motion de censure, budget communal…" },
  { chemin: "quiz", titre: "Quiz civique", description: "Testez votre culture civique : une définition, quatre mots, un seul juste. Rien n'est collecté." },
  { chemin: "soutenir", titre: "Soutenir Repère", description: "Repère est indépendant, sans publicité ni traceur. Comment le faire connaître et y contribuer." },
];

const echapper = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* index.html -> la page d'un écran : titre, description, og:title, og:description remplacés. Échoue si une balise manque :
   on ne publie pas une page qui garderait la description de l'accueil en croyant l'avoir changée. */
export function pageEcran(html, { titre, description }, nomSite = "Repère") {
  const t = `${titre} · ${nomSite}`;
  const remplacer = (motif, par, quoi) => { if (!motif.test(html)) throw new Error(`seo : ${quoi} introuvable dans index.html`); html = html.replace(motif, par); };
  remplacer(/<title>[^<]*<\/title>/, `<title>${echapper(t)}</title>`, "<title>");
  remplacer(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${echapper(description)}" />`, "meta description");
  remplacer(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${echapper(t)}" />`, "og:title");
  remplacer(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${echapper(description)}" />`, "og:description");
  return html;
}

export function robots(adresse) {
  if (!adresse) return "# Aperçu ou build local : rien à indexer.\nUser-agent: *\nDisallow: /\n";
  return `User-agent: *\nAllow: /\nDisallow: /data/\n\nSitemap: ${adresse.replace(/\/$/, "")}/sitemap.xml\n`;
}

export function sitemap(adresse, jour) {
  const base = adresse.replace(/\/$/, "");
  const url = c => `  <url><loc>${echapper(`${base}/${c}`)}</loc><lastmod>${jour}</lastmod></url>`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${["", ...PAGES.map(p => p.chemin)].map(url).join("\n")}\n</urlset>\n`;
}

/* Au build. `adresse` : process.env.ADRESSE_SITE (production seulement). `jour` : AAAA-MM-JJ, heure de Paris. */
export function ecrireSeo(dist, { adresse = process.env.ADRESSE_SITE || "", jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date()) } = {}) {
  const index = readFileSync(join(dist, "index.html"), "utf8");
  for (const p of PAGES) writeFileSync(join(dist, `${p.chemin}.html`), pageEcran(index, p));
  writeFileSync(join(dist, "robots.txt"), robots(adresse));
  if (adresse) writeFileSync(join(dist, "sitemap.xml"), sitemap(adresse, jour));
  return { pages: PAGES.length, indexable: !!adresse };
}
