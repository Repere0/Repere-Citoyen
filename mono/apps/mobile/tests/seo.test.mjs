/* Référencement (26/11/2026) : pages par écran, robots.txt fermé hors production, sitemap. */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PAGES, ecrireSeo, pageEcran, robots, sitemap } from "../scripts/seo.mjs";

const INDEX = `<html><head><title>Repère</title>\n<meta name="description" content="Qui décide chez vous.">\n<meta property="og:title" content="Repère" />\n<meta property="og:description" content="Qui décide chez vous." /></head><body></body></html>`;

test("une page par écran : titre, description et aperçu de lien propres, guillemets échappés", () => {
  const h = pageEcran(INDEX, { titre: "Où va l'argent", description: "Le budget \"officiel\"" });
  assert.match(h, /<title>Où va l'argent - Repère<\/title>/);
  assert.match(h, /<meta name="description" content="Le budget &quot;officiel&quot;" \/>/);
  assert.match(h, /og:description" content="Le budget &quot;officiel&quot;"/);
  assert.doesNotMatch(h, /Qui décide chez vous/);
  assert.throws(() => pageEcran("<html><title>x</title></html>", PAGES[0]), /meta description introuvable/);
});

test("robots.txt fermé sans adresse de production ; sitemap des écrans principaux", () => {
  assert.match(robots(""), /Disallow: \/\n/);
  assert.match(robots("https://repere-enq.pages.dev/"), /Allow: \/\nDisallow: \/data\/[\s\S]*Sitemap: https:\/\/repere-enq\.pages\.dev\/sitemap\.xml/);
  const x = sitemap("https://repere-enq.pages.dev", "2026-11-26");
  assert.equal((x.match(/<url>/g) || []).length, PAGES.length + 1);
  assert.match(x, /<loc>https:\/\/repere-enq\.pages\.dev\/finances<\/loc><lastmod>2026-11-26<\/lastmod>/);
  assert.doesNotMatch(x, /#|\d{5}/, "jamais une commune ni un code INSEE dans une adresse (invariant 2)");
});

test("au build : fichiers écrits ; un aperçu n'a pas de sitemap", () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "seo-"));
  fs.writeFileSync(path.join(d, "index.html"), INDEX);
  assert.deepEqual(ecrireSeo(d, { adresse: "", jour: "2026-11-26" }), { pages: PAGES.length, indexable: false });
  assert.ok(!fs.existsSync(path.join(d, "sitemap.xml")));
  assert.match(fs.readFileSync(path.join(d, "finances.html"), "utf8"), /<title>Où va l'argent de ma commune - Repère<\/title>/);
  ecrireSeo(d, { adresse: "https://repere-enq.pages.dev", jour: "2026-11-26" });
  assert.ok(fs.existsSync(path.join(d, "sitemap.xml")));
});
