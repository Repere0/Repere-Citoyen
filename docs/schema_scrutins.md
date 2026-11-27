# Schema reel du fichier des scrutins de l'Assemblee nationale

Produit par `outils/echantillon_scrutins.py` a partir du fichier telecharge
par la collecte quotidienne. **Ce document est engendre : ne le modifie pas a la main.**

- Fichiers dans l'archive : **10175**
- Fichiers ouverts pour le tirage : **3000** (pas de 3)
- Fichiers decrits : **3000** — tous ceux qui ont ete ouverts
- Cles distinctes trouvees : **158**
- Fichier montre en entier plus bas : `json/VTANR5L17V3421.json` (le plus riche de l'echantillon)

## Arborescence des cles

`vu` = nombre d'OCCURRENCES de la cle, tous fichiers confondus — pas un
nombre de fichiers : une cle situee dans une liste est comptee une fois par
element. Une cle vue beaucoup moins souvent que les autres est un cas
particulier, et l'ingestion doit la traiter comme facultative. Les cles vues
une seule fois sont reprises a part, plus bas.

| chemin | type | vu | exemples |
|---|---|---|---|
| `scrutin.@xmlns` | texte | 3000 | http://schemas.assemblee-nationale.fr/referentiel |
| `scrutin.@xmlns:xsi` | texte | 3000 | http://www.w3.org/2001/XMLSchema-instance |
| `scrutin.uid` | texte | 3000 | VTANR5L17V1 · VTANR5L17V1000 |
| `scrutin.numero` | texte | 3000 | 1 · 1000 |
| `scrutin.organeRef` | texte | 3000 | PO838901 |
| `scrutin.legislature` | texte | 3000 | 17 |
| `scrutin.sessionRef` | texte | 3000 | SCR5A2025O1 · SCR5A2027O1 |
| `scrutin.seanceRef` | texte | 3000 | RUANR5L17S2025IDS28596 · RUANR5L17S2025IDS29165 |
| `scrutin.dateScrutin` | texte | 3000 | 2024-10-08 · 2025-03-13 |
| `scrutin.quantiemeJourSeance` | texte | 3000 | 1 · 2 |
| `scrutin.typeVote.codeTypeVote` | texte | 3000 | MOC · SPO |
| `scrutin.typeVote.libelleTypeVote` | texte | 3000 | motion de censure · scrutin public ordinaire |
| `scrutin.typeVote.typeMajorite` | texte | 3000 | Majorité requise pour une motion de censure · Majorité absolue des suffrages exprimés |
| `scrutin.sort.code` | texte | 3000 | rejeté · adopté |
| `scrutin.sort.libelle` | texte | 3000 | L'Assemblée nationale n'a pas adopté · l'Assemblée nationale a adopté |
| `scrutin.titre` | texte | 3000 | la motion de censure déposée en application de l'article 49, alinéa 2, de la Constituti... · l'amendement n° 29 de Mme Pirès Beaune à l'article 2 de la proposition de loi visant à ... |
| `scrutin.demandeur.texte` | texte/vide | 3000 | Président du groupe "Socialistes et apparentés" · Présidente du groupe "La France insoumise - Nouveau Front Populaire" |
| `scrutin.demandeur.referenceLegislative` | vide | 3000 |  |
| `scrutin.objet.libelle` | texte | 3000 | la motion de censure déposée en application de l'article 49, alinéa 2, de la Constituti... · l'amendement n° 29 de Mme Pirès Beaune à l'article 2 de la proposition de loi visant à ... |
| `scrutin.objet.dossierLegislatif` | vide | 1904 |  |
| `scrutin.objet.referenceLegislative` | vide | 3000 |  |
| `scrutin.modePublicationDesVotes` | texte | 3000 | DecompteNominatif |
| `scrutin.syntheseVote.nombreVotants` | texte | 3000 | 197 · 41 |
| `scrutin.syntheseVote.suffragesExprimes` | texte | 3000 | 197 · 40 |
| `scrutin.syntheseVote.nbrSuffragesRequis` | texte | 3000 | 289 · 21 |
| `scrutin.syntheseVote.annonce` | texte | 3000 | L'Assemblée nationale n'a pas adopté · l'Assemblée nationale a adopté |
| `scrutin.syntheseVote.decompte.nonVotants` | texte | 3000 | 10 · 2 |
| `scrutin.syntheseVote.decompte.pour` | texte | 3000 | 197 · 26 |
| `scrutin.syntheseVote.decompte.contre` | texte | 3000 | 0 · 14 |
| `scrutin.syntheseVote.decompte.abstentions` | texte | 3000 | 0 · 1 |
| `scrutin.syntheseVote.decompte.nonVotantsVolontaires` | texte | 3000 | 0 |
| `scrutin.ventilationVotes.organe.organeRef` | texte | 3000 | PO838901 |
| `scrutin.ventilationVotes.organe.groupes.groupe[]` | liste | 3000 | 12 entree(s) |
| `scrutin.ventilationVotes.organe.groupes.groupe[].organeRef` | texte | 36000 | PO845401 · PO845407 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].nombreMembresGroupe` | texte | 36000 | 125 · 95 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.positionMajoritaire` | texte | 36000 | pour · contre |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteVoix.nonVotants` | texte | 36000 | 0 · 10 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteVoix.pour` | texte | 36000 | 0 · 72 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteVoix.contre` | texte | 36000 | 0 · 7 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteVoix.abstentions` | texte | 36000 | 0 · 1 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteVoix.nonVotantsVolontaires` | texte | 36000 | 0 · 1 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants` | vide | 30490 |  |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours` | vide | 19510 |  |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres` | vide | 16635 |  |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions` | vide | 31173 |  |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant[]` | liste | 1141 | de 2 a 10 entrees |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant[].acteurRef` | texte | 3676 | PA795050 · PA795958 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant[].mandatRef` | texte | 3676 | PM843272 · PM843422 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant[].parDelegation` | texte | 3676 | false |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant[].numPlace` | texte/vide | 3676 | 322 · 323 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant[].causePositionVote` | texte | 3676 | MG · PSE |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours.votant[]` | liste | 13424 | de 2 a 124 entrees |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours.votant[].acteurRef` | texte | 179654 | PA794906 · PA796070 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours.votant[].mandatRef` | texte | 179654 | PM843284 · PM843746 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours.votant[].parDelegation` | texte | 179654 | false · true |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours.votant[].numPlace` | texte/vide | 179654 | 544 · 638 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant.acteurRef` | texte | 4369 | PA227089 · PA721908 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant.mandatRef` | texte | 4369 | PM843131 · PM843467 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant.parDelegation` | texte | 4369 | false |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant.numPlace` | texte/vide | 4369 | 395 · 402 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant.causePositionVote` | texte | 4369 | MG · PAN |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours.votant.acteurRef` | texte | 3066 | PA793796 · PA794530 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours.votant.mandatRef` | texte | 3066 | PM842723 · PM840327 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours.votant.parDelegation` | texte | 3066 | false · true |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours.votant.numPlace` | texte | 3066 | 485 · 051 |
| `scrutin.miseAuPoint.nonVotants[]` | liste/vide | 8871 | 2 entree(s) |
| `scrutin.miseAuPoint.pours` | vide | 2771 |  |
| `scrutin.miseAuPoint.abstentions[]` | liste/vide | 8943 | 2 entree(s) |
| `scrutin.miseAuPoint.nonVotantsVolontaires[]` | liste/vide | 8999 | 2 entree(s) |
| `scrutin.miseAuPoint.contres` | vide | 2773 |  |
| `scrutin.miseAuPoint.dysfonctionnement.nonVotants` | vide | 3000 |  |
| `scrutin.miseAuPoint.dysfonctionnement.pour` | vide | 2973 |  |
| `scrutin.miseAuPoint.dysfonctionnement.contre` | vide | 2974 |  |
| `scrutin.miseAuPoint.dysfonctionnement.abstentions` | vide | 2998 |  |
| `scrutin.miseAuPoint.dysfonctionnement.nonVotantsVolontaires` | vide | 2990 |  |
| `scrutin.lieuVote` | texte | 3000 | Salons · Hémicycle |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres.votant[]` | liste | 16485 | de 2 a 123 entrees |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres.votant[].acteurRef` | texte | 204359 | PA795950 · PA794798 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres.votant[].mandatRef` | texte | 204359 | PM843419 · PM843188 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres.votant[].parDelegation` | texte | 204359 | false · true |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres.votant[].numPlace` | texte/vide | 204359 | 259 · 365 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions.votant.acteurRef` | texte | 2271 | PA721202 · PA841419 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions.votant.mandatRef` | texte | 2271 | PM840435 · PM843005 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions.votant.parDelegation` | texte | 2271 | false · true |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions.votant.numPlace` | texte | 2271 | 549 · 496 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres.votant.acteurRef` | texte | 2880 | PA346782 · PA841381 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres.votant.mandatRef` | texte | 2880 | PM840426 · PM842966 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres.votant.parDelegation` | texte | 2880 | false · true |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres.votant.numPlace` | texte | 2880 | 172 · 463 |
| `scrutin.objet.dossierLegislatif.libelle` | texte | 1096 | La relance et la décentralisation du logement · Retrouver la confiance et l’équilibre dans les rapports locatifs |
| `scrutin.objet.dossierLegislatif.dossierRef` | texte | 1096 | DLR5L17N54608 · DLR5L17N53069 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions.votant[]` | liste | 2556 | de 2 a 109 entrees |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions.votant[].acteurRef` | texte | 21602 | PA642847 · PA266797 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions.votant[].mandatRef` | texte | 21602 | PM843056 · PM843071 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions.votant[].parDelegation` | texte | 21602 | false · true |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions.votant[].numPlace` | texte | 21602 | 165 · 169 |
| `scrutin.miseAuPoint.contres.votant[]` | liste | 71 | de 2 a 9 entrees |
| `scrutin.miseAuPoint.contres.votant[].acteurRef` | texte | 196 | PA841665 · PA841381 |
| `scrutin.miseAuPoint.contres.votant[].mandatRef` | texte | 196 | PM843227 · PM842966 |
| `scrutin.miseAuPoint.contres.votant[].parDelegation` | texte | 196 | false |
| `scrutin.miseAuPoint.contres.votant[].numPlace` | texte | 196 | 487 · 463 |
| `scrutin.miseAuPoint.dysfonctionnement.contre.votant.acteurRef` | texte | 26 | PA2940 · PA342384 |
| `scrutin.miseAuPoint.dysfonctionnement.contre.votant.mandatRef` | texte | 26 | PM842531 · PM842771 |
| `scrutin.miseAuPoint.dysfonctionnement.contre.votant.parDelegation` | texte | 26 | false |
| `scrutin.miseAuPoint.dysfonctionnement.contre.votant.numPlace` | texte | 26 | 495 · 637 |
| `scrutin.miseAuPoint.dysfonctionnement.nonVotantsVolontaires.votant.acteurRef` | texte | 10 | PA841575 · PA793342 |
| `scrutin.miseAuPoint.dysfonctionnement.nonVotantsVolontaires.votant.mandatRef` | texte | 10 | PM843143 · PM842345 |
| `scrutin.miseAuPoint.dysfonctionnement.nonVotantsVolontaires.votant.parDelegation` | texte | 10 | false |
| `scrutin.miseAuPoint.dysfonctionnement.nonVotantsVolontaires.votant.numPlace` | texte | 10 | 134 · 204 |
| `scrutin.miseAuPoint.pours.votant[]` | liste | 83 | de 2 a 24 entrees |
| `scrutin.miseAuPoint.pours.votant[].acteurRef` | texte | 276 | PA720822 · PA795966 |
| `scrutin.miseAuPoint.pours.votant[].mandatRef` | texte | 276 | PM840318 · PM843530 |
| `scrutin.miseAuPoint.pours.votant[].parDelegation` | texte | 276 | false |
| `scrutin.miseAuPoint.pours.votant[].numPlace` | texte | 276 | 045 · 076 |
| `scrutin.miseAuPoint.abstentions[].votant[]` | liste | 22 | de 2 a 25 entrees |
| `scrutin.miseAuPoint.abstentions[].votant[].acteurRef` | texte | 82 | PA841315 · PA609332 |
| `scrutin.miseAuPoint.abstentions[].votant[].mandatRef` | texte | 82 | PM842906 · PM840396 |
| `scrutin.miseAuPoint.abstentions[].votant[].parDelegation` | texte | 82 | false |
| `scrutin.miseAuPoint.abstentions[].votant[].numPlace` | texte | 82 | 565 · 421 |
| `scrutin.miseAuPoint.abstentions[].votant.acteurRef` | texte | 35 | PA840801 · PA794418 |
| `scrutin.miseAuPoint.abstentions[].votant.mandatRef` | texte | 35 | PM842471 · PM840309 |
| `scrutin.miseAuPoint.abstentions[].votant.parDelegation` | texte | 35 | false |
| `scrutin.miseAuPoint.abstentions[].votant.numPlace` | texte | 35 | 014 · 025 |
| `scrutin.miseAuPoint.pours.votant.acteurRef` | texte | 146 | PA795164 · PA795588 |
| `scrutin.miseAuPoint.pours.votant.mandatRef` | texte | 146 | PM840444 · PM843557 |
| `scrutin.miseAuPoint.pours.votant.parDelegation` | texte | 146 | false |
| `scrutin.miseAuPoint.pours.votant.numPlace` | texte | 146 | 618 · 643 |
| `scrutin.miseAuPoint.contres.votant.acteurRef` | texte | 156 | PA342384 · PA720066 |
| `scrutin.miseAuPoint.contres.votant.mandatRef` | texte | 156 | PM842771 · PM842933 |
| `scrutin.miseAuPoint.contres.votant.parDelegation` | texte | 156 | false |
| `scrutin.miseAuPoint.contres.votant.numPlace` | texte | 156 | 637 · 260 |
| `scrutin.miseAuPoint.nonVotants[].votant.acteurRef` | texte | 124 | PA719578 · PA795422 |
| `scrutin.miseAuPoint.nonVotants[].votant.mandatRef` | texte | 124 | PM842618 · PM843599 |
| `scrutin.miseAuPoint.nonVotants[].votant.parDelegation` | texte | 124 | false |
| `scrutin.miseAuPoint.nonVotants[].votant.numPlace` | texte | 124 | 626 · 644 |
| `scrutin.miseAuPoint.dysfonctionnement.pour.votant.acteurRef` | texte | 26 | PA342384 · PA840869 |
| `scrutin.miseAuPoint.dysfonctionnement.pour.votant.mandatRef` | texte | 26 | PM842771 · PM842522 |
| `scrutin.miseAuPoint.dysfonctionnement.pour.votant.parDelegation` | texte | 26 | false |
| `scrutin.miseAuPoint.dysfonctionnement.pour.votant.numPlace` | texte | 26 | 637 · 047 |
| `scrutin.miseAuPoint.dysfonctionnement.pour.votant[]` | liste | 1 | 2 entree(s) |
| `scrutin.miseAuPoint.dysfonctionnement.pour.votant[].acteurRef` | texte | 2 | PA608264 · PA774958 |
| `scrutin.miseAuPoint.dysfonctionnement.pour.votant[].mandatRef` | texte | 2 | PM843179 · PM843389 |
| `scrutin.miseAuPoint.dysfonctionnement.pour.votant[].parDelegation` | texte | 2 | false |
| `scrutin.miseAuPoint.dysfonctionnement.pour.votant[].numPlace` | texte | 2 | 475 · 415 |
| `scrutin.miseAuPoint.nonVotants[].votant[]` | liste | 5 | 2 entree(s) |
| `scrutin.miseAuPoint.nonVotants[].votant[].acteurRef` | texte | 10 | PA842155 · PA720138 |
| `scrutin.miseAuPoint.nonVotants[].votant[].mandatRef` | texte | 10 | PM843674 · PM842846 |
| `scrutin.miseAuPoint.nonVotants[].votant[].parDelegation` | texte | 10 | false |
| `scrutin.miseAuPoint.nonVotants[].votant[].numPlace` | texte | 10 | 616 · 228 |
| `scrutin.miseAuPoint.dysfonctionnement.abstentions.votant.acteurRef` | texte | 2 | PA794786 · PA841075 |
| `scrutin.miseAuPoint.dysfonctionnement.abstentions.votant.mandatRef` | texte | 2 | PM843242 · PM842690 |
| `scrutin.miseAuPoint.dysfonctionnement.abstentions.votant.parDelegation` | texte | 2 | false |
| `scrutin.miseAuPoint.dysfonctionnement.abstentions.votant.numPlace` | texte | 2 | 547 · 018 |
| `scrutin.miseAuPoint.nonVotantsVolontaires[].votant[]` | liste | 1 | 2 entree(s) |
| `scrutin.miseAuPoint.nonVotantsVolontaires[].votant[].acteurRef` | texte | 2 | PA721410 · PA793342 |
| `scrutin.miseAuPoint.nonVotantsVolontaires[].votant[].mandatRef` | texte | 2 | PM843350 · PM842345 |
| `scrutin.miseAuPoint.nonVotantsVolontaires[].votant[].parDelegation` | texte | 2 | false |
| `scrutin.miseAuPoint.nonVotantsVolontaires[].votant[].numPlace` | texte | 2 | 174 · 204 |

## Cles vues UNE SEULE FOIS

Ce sont les cas particuliers : elles n'existent que dans certains fichiers.
C'est exactement ce que l'ancien tirage — les soixante premiers par ordre
alphabetique — ratait par construction. Une ingestion doit les traiter
comme facultatives.

- `scrutin.miseAuPoint.dysfonctionnement.pour.votant[]`
- `scrutin.miseAuPoint.nonVotantsVolontaires[].votant[]`

## Un fichier entier, listes tronquees a trois entrees

```json
{
  "scrutin": {
    "@xmlns": "http://schemas.assemblee-nationale.fr/referentiel",
    "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    "uid": "VTANR5L17V3421",
    "numero": "3421",
    "organeRef": "PO838901",
    "legislature": "17",
    "sessionRef": "SCR5A2026O1",
    "seanceRef": "RUANR5L17S2026IDS29864",
    "dateScrutin": "2025-11-05",
    "quantiemeJourSeance": "1",
    "typeVote": {
      "codeTypeVote": "SPO",
      "libelleTypeVote": "scrutin public ordinaire",
      "typeMajorite": "Majorité absolue des suffrages exprimés"
    },
    "sort": {
      "code": "rejeté",
      "libelle": "L'Assemblée nationale n'a pas adopté"
    },
    "titre": "l'amendement n° 15 de Mme Sylvie Bonnet et les amendements identiques suivants après l'article 5 du projet de loi de financement de la sécurité sociale pour 2026 (première lecture).",
    "demandeur": {
      "texte": "Présidente de séance",
      "referenceLegislative": null
    },
    "objet": {
      "libelle": "l'amendement n° 15 de Mme Sylvie Bonnet et les amendements identiques suivants après l'article 5 du projet de loi de financement de la sécurité sociale pour 2026 (première lecture).",
      "dossierLegislatif": null,
      "referenceLegislative": null
    },
    "modePublicationDesVotes": "DecompteNominatif",
    "syntheseVote": {
      "nombreVotants": "237",
      "suffragesExprimes": "223",
      "nbrSuffragesRequis": "112",
      "annonce": "L'Assemblée nationale n'a pas adopté",
      "decompte": {
        "nonVotants": "15",
        "pour": "94",
        "contre": "129",
        "abstentions": "14",
        "nonVotantsVolontaires": "0"
      }
    },
    "ventilationVotes": {
      "organe": {
        "organeRef": "PO838901",
        "groupes": {
          "groupe": [
            {
              "organeRef": "PO845401",
              "nombreMembresGroupe": "123",
              "vote": {
                "positionMajoritaire": "contre",
                "decompteVoix": {
                  "nonVotants": "0",
                  "pour": "1",
                  "contre": "48",
                  "abstentions": "2",
                  "nonVotantsVolontaires": "2"
                },
                "decompteNominatif": {
                  "nonVotants": null,
                  "pours": {
                    "votant": {
                      "acteurRef": "PA841825",
                      "mandatRef": "PM843392",
                      "parDelegation": "false",
                      "numPlace": "155"
                    }
                  },
                  "contres": {
                    "votant": [
                      {
                        "acteurRef": "PA841495",
                        "mandatRef": "PM843065",
                        "parDelegation": "false",
                        "numPlace": "010"
                      },
                      {
                        "acteurRef": "PA794562",
                        "mandatRef": "PM840339",
                        "parDelegation": "false",
                        "numPlace": "094"
                      },
                      {
                        "acteurRef": "PA793238",
                        "mandatRef": "PM842426",
                        "parDelegation": "false",
                        "numPlace": "073"
                      },
                      "... (48 entrees au total, tronque)"
                    ]
                  },
                  "abstentions": {
                    "votant": [
                      {
                        "acteurRef": "PA841645",
                        "mandatRef": "PM843200",
                        "parDelegation": "false",
                        "numPlace": "054"
                      },
                      {
                        "acteurRef": "PA793832",
                        "mandatRef": "PM842678",
                        "parDelegation": "false",
                        "numPlace": "126"
                      }
                    ]
                  }
                }
              }
            },
            {
              "organeRef": "PO845407",
              "nombreMembresGroupe": "92",
              "vote": {
                "positionMajoritaire": "contre",
                "decompteVoix": {
                  "nonVotants": "7",
                  "pour": "1",
                  "contre": "41",
                  "abstentions": "0",
                  "nonVotantsVolontaires": "0"
                },
                "decompteNominatif": {
                  "nonVotants": {
                    "votant": [
                      {
                        "acteurRef": "PA795950",
                        "mandatRef": "PM843419",
                        "parDelegation": "false",
                        "numPlace": "389",
                        "causePositionVote": "MG"
                      },
                      {
                        "acteurRef": "PA721908",
                        "mandatRef": "PM843467",
                        "parDelegation": "false",
                        "numPlace": "402",
                        "causePositionVote": "PAN"
                      },
                      {
                        "acteurRef": "PA795990",
                        "mandatRef": "PM856036",
                        "parDelegation": "false",
                        "numPlace": "322",
                        "causePositionVote": "MG"
                      },
                      "... (7 entrees au total, tronque)"
                    ]
                  },
                  "pours": {
                    "votant": {
                      "acteurRef": "PA719890",
                      "mandatRef": "PM842855",
                      "parDelegation": "false",
                      "numPlace": "257"
                    }
                  },
                  "contres": {
                    "votant": [
                      {
                        "acteurRef": "PA721158",
                        "mandatRef": "PM843806",
                        "parDelegation": "false",
                        "numPlace": "281"
                      },
                      {
                        "acteurRef": "PA722190",
                        "mandatRef": "PM843659",
                        "parDelegation": "false",
                        "numPlace": "267"
                      },
                      {
                        "acteurRef": "PA642695",
                        "mandatRef": "PM842594",
                        "parDelegation": "true",
                        "numPlace": "286"
                      },
                      "... (41 entrees au total, tronque)"
                    ]
                  },
                  "abstentions": null
                }
              }
            },
            {
              "organeRef": "PO845413",
              "nombreMembresGroupe": "71",
              "vote": {
                "positionMajoritaire": "pour",
                "decompteVoix": {
                  "nonVotants": "0",
                  "pour": "25",
                  "contre": "0",
                  "abstentions": "0",
                  "nonVotantsVolontaires": "0"
                },
                "decompteNominatif": {
                  "nonVotants": null,
                  "pours": {
                    "votant": [
                      {
                        "acteurRef": "PA795228",
                        "mandatRef": "PM840447",
                        "parDelegation": "false",
                        "numPlace": "627"
                      },
                      {
                        "acteurRef": "PA793262",
                        "mandatRef": "PM842438",
                        "parDelegation": "false",
                        "numPlace": "571"
                      },
                      {
                        "acteurRef": "PA794906",
                        "mandatRef": "PM843284",
                        "parDelegation": "false",
                        "numPlace": "544"
                      },
                      "... (25 entrees au total, tronque)"
                    ]
                  },
                  "contres": null,
                  "abstentions": null
                }
              }
            },
            "... (12 entrees au total, tronque)"
          ]
        }
      }
    },
    "miseAuPoint": {
      "nonVotants": [
        null,
        {
          "votant": {
            "acteurRef": "PA721296",
            "mandatRef": "PM843698",
            "parDelegation": "false",
            "numPlace": "313"
          }
        }
      ],
      "pours": {
        "votant": [
          {
            "acteurRef": "PA774954",
            "mandatRef": "PM842843",
            "parDelegation": "false",
            "numPlace": "183"
          },
          {
            "acteurRef": "PA721816",
            "mandatRef": "PM843551",
            "parDelegation": "false",
            "numPlace": "176"
          },
          {
            "acteurRef": "PA793394",
            "mandatRef": "PM842486",
            "parDelegation": "false",
            "numPlace": "453"
          },
          "... (5 entrees au total, tronque)"
        ]
      },
      "abstentions": [
        null,
        {
          "votant": [
            {
              "acteurRef": "PA841315",
              "mandatRef": "PM842906",
              "parDelegation": "false",
              "numPlace": "565"
            },
            {
              "acteurRef": "PA841243",
              "mandatRef": "PM842825",
              "parDelegation": "false",
              "numPlace": "566"
            }
          ]
        }
      ],
      "nonVotantsVolontaires": [
        null,
        null
      ],
      "contres": {
        "votant": {
          "acteurRef": "PA795402",
          "mandatRef": "PM873746",
          "parDelegation": "false",
          "numPlace": "312"
        }
      },
      "dysfonctionnement": {
        "nonVotants": null,
        "pour": null,
        "contre": null,
        "abstentions": null,
        "nonVotantsVolontaires": null
      }
    },
    "lieuVote": "Hémicycle"
  }
}
```
