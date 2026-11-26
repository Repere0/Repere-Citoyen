/* Textes officiels pour les résumés : sans réseau ni pdftotext (injectés). */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { dossiersDesScrutins, documentInitial, exposeDesMotifs, preparer, URL_PDF } from "../scripts/textes-officiels.mjs";

const PHRASE = "Le présent projet de loi vise à protéger les communes de montagne et leurs habitants. ";
const PDF = `ASSEMBLÉE NATIONALE\n\nPROJET DE LOI\n\nEXPOSÉ DES MOTIFS\n\nMesdames, Messieurs,\n\n${PHRASE.repeat(6)}\n\n– 3 –\n\nPROJET DE LOI\n\nArticle 1er\n\nLe code est modifié.`;

const doc = (uid, provenance, date, type = "PRJL") => ({ uid, dossierRef: "DLR5L17N1", provenance,
  classification: { type: { code: type } }, cycleDeVie: { chrono: { dateDepot: date } } });

test("dossiers des scrutins : sans doublon, refs invalides écartées", () => {
  const l = dossiersDesScrutins({ scrutins: [{ n: 1, dr: "DLR5L17N1", dl: "A" }, { n: 2, dr: "DLR5L17N1" }, { n: 3, dr: "x" }, { n: 4 }] });
  assert.deepEqual(l, [{ dossier: "DLR5L17N1", titre: "A", scrutins: ["1", "2"] }]);
});

test("document initial : texte déposé le plus ancien, jamais un rapport", () => {
  const d = documentInitial([doc("B", "Texte Déposé", "2026-03-01"), doc("A", "Texte Déposé", "2026-01-01"),
    doc("R", "Texte Déposé", "2025-01-01", "RAPP"), doc("C", "Commission", "2025-06-01")]);
  assert.equal(d.uid, "A");
  assert.equal(documentInitial([doc("C", "Commission", "2025-06-01")]), null);
});

test("exposé des motifs : du titre au dispositif, numéros de page ôtés", () => {
  const e = exposeDesMotifs(PDF);
  assert.ok(e.startsWith("Mesdames, Messieurs,"));
  assert.ok(!/Article 1er|– 3 –/.test(e));
  assert.equal(exposeDesMotifs("PROJET DE LOI\nArticle 1er\nTexte sans exposé."), null);
  assert.ok(exposeDesMotifs(PDF, 300).length <= 300);
});

test("preparer : écrit le lot, écarte et dit pourquoi", async () => {
  const t = fs.mkdtempSync(path.join(os.tmpdir(), "to-"));
  const archive = path.join(t, "archive", "json", "document");
  fs.mkdirSync(archive, { recursive: true });
  fs.writeFileSync(path.join(archive, "A.json"), JSON.stringify({ document: doc("PRJLANR5L17B0001", "Texte Déposé", "2026-01-01") }));
  const urls = [];
  const fetchImpl = async u => { urls.push(u); return { ok: true, arrayBuffer: async () => new ArrayBuffer(4) }; };
  const { lots, ecartes } = await preparer({ archive: path.join(t, "archive"), sortie: path.join(t, "sortie"), fetchImpl, pdftotext: () => PDF,
    catalogue: { scrutins: [{ n: 9, dr: "DLR5L17N1", dl: "Montagne" }, { n: 10, dr: "DLR5L17N2", dl: "Autre" }] } });
  assert.deepEqual(urls, [URL_PDF("PRJLANR5L17B0001")]);
  assert.equal(lots.length, 1);
  assert.equal(lots[0].document, "PRJLANR5L17B0001");
  assert.ok(fs.readFileSync(lots[0].texte, "utf8").includes("communes de montagne"));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(t, "sortie", "lots.json"), "utf8")), lots);
  assert.equal(ecartes.length, 1);
  assert.match(ecartes[0].raison, /aucun projet/);
});
