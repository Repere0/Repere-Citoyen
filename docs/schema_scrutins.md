# Schema reel du fichier des scrutins de l'Assemblee nationale

Produit par `outils/echantillon_scrutins.py` a partir du fichier telecharge
par la collecte quotidienne. **Ce document est engendre : ne le modifie pas a la main.**

- Fichiers dans l'archive : **10123**
- Fichiers ouverts pour le tirage : **3000** (pas de 3)
- Fichiers decrits : **3000** — tous ceux qui ont ete ouverts
- Cles distinctes trouvees : **152**
- Fichier montre en entier plus bas : `json/VTANR5L17V3588.json` (le plus riche de l'echantillon)

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
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants` | vide | 30459 |  |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours` | vide | 19553 |  |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres` | vide | 16517 |  |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions` | vide | 30910 |  |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant[]` | liste | 1166 | de 2 a 10 entrees |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant[].acteurRef` | texte | 3761 | PA795050 · PA795958 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant[].mandatRef` | texte | 3761 | PM843272 · PM843422 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant[].parDelegation` | texte | 3761 | false |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant[].numPlace` | texte | 3761 | 322 · 323 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant[].causePositionVote` | texte | 3761 | MG · PSE |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours.votant[]` | liste | 13488 | de 2 a 123 entrees |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours.votant[].acteurRef` | texte | 183098 | PA794906 · PA796070 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours.votant[].mandatRef` | texte | 183098 | PM843284 · PM843746 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours.votant[].parDelegation` | texte | 183098 | false · true |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours.votant[].numPlace` | texte/vide | 183098 | 544 · 638 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant.acteurRef` | texte | 4375 | PA227089 · PA721908 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant.mandatRef` | texte | 4375 | PM843131 · PM843467 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant.parDelegation` | texte | 4375 | false · true |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant.numPlace` | texte/vide | 4375 | 395 · 402 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.nonVotants.votant.causePositionVote` | texte | 4375 | MG · PAN |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours.votant.acteurRef` | texte | 2959 | PA793796 · PA794530 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours.votant.mandatRef` | texte | 2959 | PM842723 · PM840327 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours.votant.parDelegation` | texte | 2959 | false · true |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.pours.votant.numPlace` | texte | 2959 | 485 · 051 |
| `scrutin.miseAuPoint.nonVotants[]` | liste/vide | 8847 | 2 entree(s) |
| `scrutin.miseAuPoint.pours` | vide | 2762 |  |
| `scrutin.miseAuPoint.abstentions[]` | liste/vide | 8936 | 2 entree(s) |
| `scrutin.miseAuPoint.nonVotantsVolontaires[]` | liste/vide | 8997 | 2 entree(s) |
| `scrutin.miseAuPoint.contres` | vide | 2756 |  |
| `scrutin.miseAuPoint.dysfonctionnement.nonVotants` | vide | 3000 |  |
| `scrutin.miseAuPoint.dysfonctionnement.pour` | vide | 2974 |  |
| `scrutin.miseAuPoint.dysfonctionnement.contre` | vide | 2980 |  |
| `scrutin.miseAuPoint.dysfonctionnement.abstentions` | vide | 2994 |  |
| `scrutin.miseAuPoint.dysfonctionnement.nonVotantsVolontaires` | vide | 2991 |  |
| `scrutin.lieuVote` | texte | 3000 | Salons · Hémicycle |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres.votant[]` | liste | 16552 | de 2 a 120 entrees |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres.votant[].acteurRef` | texte | 206301 | PA795950 · PA794798 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres.votant[].mandatRef` | texte | 206301 | PM843419 · PM843188 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres.votant[].parDelegation` | texte | 206301 | false · true |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres.votant[].numPlace` | texte/vide | 206301 | 259 · 365 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions.votant.acteurRef` | texte | 2365 | PA721202 · PA841419 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions.votant.mandatRef` | texte | 2365 | PM840435 · PM843005 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions.votant.parDelegation` | texte | 2365 | false · true |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions.votant.numPlace` | texte | 2365 | 549 · 496 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres.votant.acteurRef` | texte | 2931 | PA346782 · PA841381 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres.votant.mandatRef` | texte | 2931 | PM840426 · PM842966 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres.votant.parDelegation` | texte | 2931 | false · true |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.contres.votant.numPlace` | texte | 2931 | 172 · 463 |
| `scrutin.objet.dossierLegislatif.libelle` | texte | 1096 | La relance et la décentralisation du logement · Retrouver la confiance et l’équilibre dans les rapports locatifs |
| `scrutin.objet.dossierLegislatif.dossierRef` | texte | 1096 | DLR5L17N54608 · DLR5L17N53069 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions.votant[]` | liste | 2725 | de 2 a 102 entrees |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions.votant[].acteurRef` | texte | 22829 | PA642847 · PA266797 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions.votant[].mandatRef` | texte | 22829 | PM843056 · PM843071 |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions.votant[].parDelegation` | texte | 22829 | false · true |
| `scrutin.ventilationVotes.organe.groupes.groupe[].vote.decompteNominatif.abstentions.votant[].numPlace` | texte/vide | 22829 | 165 · 169 |
| `scrutin.miseAuPoint.contres.votant[]` | liste | 71 | de 2 a 41 entrees |
| `scrutin.miseAuPoint.contres.votant[].acteurRef` | texte | 266 | PA841665 · PA841381 |
| `scrutin.miseAuPoint.contres.votant[].mandatRef` | texte | 266 | PM843227 · PM842966 |
| `scrutin.miseAuPoint.contres.votant[].parDelegation` | texte | 266 | false |
| `scrutin.miseAuPoint.contres.votant[].numPlace` | texte | 266 | 487 · 463 |
| `scrutin.miseAuPoint.dysfonctionnement.contre.votant.acteurRef` | texte | 20 | PA2940 · PA342384 |
| `scrutin.miseAuPoint.dysfonctionnement.contre.votant.mandatRef` | texte | 20 | PM842531 · PM842771 |
| `scrutin.miseAuPoint.dysfonctionnement.contre.votant.parDelegation` | texte | 20 | false |
| `scrutin.miseAuPoint.dysfonctionnement.contre.votant.numPlace` | texte | 20 | 495 · 637 |
| `scrutin.miseAuPoint.dysfonctionnement.nonVotantsVolontaires.votant.acteurRef` | texte | 9 | PA841575 · PA793342 |
| `scrutin.miseAuPoint.dysfonctionnement.nonVotantsVolontaires.votant.mandatRef` | texte | 9 | PM843143 · PM842345 |
| `scrutin.miseAuPoint.dysfonctionnement.nonVotantsVolontaires.votant.parDelegation` | texte | 9 | false |
| `scrutin.miseAuPoint.dysfonctionnement.nonVotantsVolontaires.votant.numPlace` | texte | 9 | 134 · 204 |
| `scrutin.miseAuPoint.pours.votant[]` | liste | 93 | de 2 a 33 entrees |
| `scrutin.miseAuPoint.pours.votant[].acteurRef` | texte | 312 | PA720822 · PA795966 |
| `scrutin.miseAuPoint.pours.votant[].mandatRef` | texte | 312 | PM840318 · PM843530 |
| `scrutin.miseAuPoint.pours.votant[].parDelegation` | texte | 312 | false |
| `scrutin.miseAuPoint.pours.votant[].numPlace` | texte | 312 | 045 · 076 |
| `scrutin.miseAuPoint.abstentions[].votant[]` | liste | 16 | de 2 a 3 entrees |
| `scrutin.miseAuPoint.abstentions[].votant[].acteurRef` | texte | 35 | PA841315 · PA609332 |
| `scrutin.miseAuPoint.abstentions[].votant[].mandatRef` | texte | 35 | PM842906 · PM840396 |
| `scrutin.miseAuPoint.abstentions[].votant[].parDelegation` | texte | 35 | false |
| `scrutin.miseAuPoint.abstentions[].votant[].numPlace` | texte | 35 | 565 · 421 |
| `scrutin.miseAuPoint.abstentions[].votant.acteurRef` | texte | 48 | PA840801 · PA840997 |
| `scrutin.miseAuPoint.abstentions[].votant.mandatRef` | texte | 48 | PM842471 · PM842612 |
| `scrutin.miseAuPoint.abstentions[].votant.parDelegation` | texte | 48 | false |
| `scrutin.miseAuPoint.abstentions[].votant.numPlace` | texte | 48 | 014 · 533 |
| `scrutin.miseAuPoint.nonVotants[].votant.acteurRef` | texte | 145 | PA795982 · PA722150 |
| `scrutin.miseAuPoint.nonVotants[].votant.mandatRef` | texte | 145 | PM840432 · PM843590 |
| `scrutin.miseAuPoint.nonVotants[].votant.parDelegation` | texte | 145 | false |
| `scrutin.miseAuPoint.nonVotants[].votant.numPlace` | texte | 145 | 558 · 486 |
| `scrutin.miseAuPoint.pours.votant.acteurRef` | texte | 145 | PA841947 · PA795026 |
| `scrutin.miseAuPoint.pours.votant.mandatRef` | texte | 145 | PM843503 · PM843368 |
| `scrutin.miseAuPoint.pours.votant.parDelegation` | texte | 145 | false |
| `scrutin.miseAuPoint.pours.votant.numPlace` | texte | 145 | 559 · 224 |
| `scrutin.miseAuPoint.contres.votant.acteurRef` | texte | 173 | PA720066 · PA842255 |
| `scrutin.miseAuPoint.contres.votant.mandatRef` | texte | 173 | PM842933 · PM843770 |
| `scrutin.miseAuPoint.contres.votant.parDelegation` | texte | 173 | false |
| `scrutin.miseAuPoint.contres.votant.numPlace` | texte | 173 | 260 · 066 |
| `scrutin.miseAuPoint.nonVotants[].votant[]` | liste | 8 | 2 entree(s) |
| `scrutin.miseAuPoint.nonVotants[].votant[].acteurRef` | texte | 16 | PA793322 · PA722150 |
| `scrutin.miseAuPoint.nonVotants[].votant[].mandatRef` | texte | 16 | PM840246 · PM843590 |
| `scrutin.miseAuPoint.nonVotants[].votant[].parDelegation` | texte | 16 | false |
| `scrutin.miseAuPoint.nonVotants[].votant[].numPlace` | texte | 16 | 093 · 486 |
| `scrutin.miseAuPoint.dysfonctionnement.pour.votant.acteurRef` | texte | 26 | PA342384 · PA840869 |
| `scrutin.miseAuPoint.dysfonctionnement.pour.votant.mandatRef` | texte | 26 | PM842771 · PM842522 |
| `scrutin.miseAuPoint.dysfonctionnement.pour.votant.parDelegation` | texte | 26 | false |
| `scrutin.miseAuPoint.dysfonctionnement.pour.votant.numPlace` | texte | 26 | 637 · 047 |
| `scrutin.miseAuPoint.dysfonctionnement.abstentions.votant.acteurRef` | texte | 6 | PA840869 · PA794786 |
| `scrutin.miseAuPoint.dysfonctionnement.abstentions.votant.mandatRef` | texte | 6 | PM842522 · PM843242 |
| `scrutin.miseAuPoint.dysfonctionnement.abstentions.votant.parDelegation` | texte | 6 | false |
| `scrutin.miseAuPoint.dysfonctionnement.abstentions.votant.numPlace` | texte | 6 | 047 · 547 |
| `scrutin.miseAuPoint.nonVotantsVolontaires[].votant.acteurRef` | texte | 3 | PA794894 · PA793262 |
| `scrutin.miseAuPoint.nonVotantsVolontaires[].votant.mandatRef` | texte | 3 | PM840351 · PM842438 |
| `scrutin.miseAuPoint.nonVotantsVolontaires[].votant.parDelegation` | texte | 3 | false |
| `scrutin.miseAuPoint.nonVotantsVolontaires[].votant.numPlace` | texte | 3 | 138 · 571 |

## Cles vues UNE SEULE FOIS

Ce sont les cas particuliers : elles n'existent que dans certains fichiers.
C'est exactement ce que l'ancien tirage — les soixante premiers par ordre
alphabetique — ratait par construction. Une ingestion doit les traiter
comme facultatives.

_Aucune : toutes les cles apparaissent au moins deux fois._

## Un fichier entier, listes tronquees a trois entrees

```json
{
  "scrutin": {
    "@xmlns": "http://schemas.assemblee-nationale.fr/referentiel",
    "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    "uid": "VTANR5L17V3588",
    "numero": "3588",
    "organeRef": "PO838901",
    "legislature": "17",
    "sessionRef": "SCR5A2026O1",
    "seanceRef": "RUANR5L17S2026IDS29881",
    "dateScrutin": "2025-11-08",
    "quantiemeJourSeance": "2",
    "typeVote": {
      "codeTypeVote": "SPO",
      "libelleTypeVote": "scrutin public ordinaire",
      "typeMajorite": "Majorité absolue des suffrages exprimés"
    },
    "sort": {
      "code": "rejeté",
      "libelle": "L'Assemblée nationale n'a pas adopté"
    },
    "titre": "l'amendement n° 1661 de M. Bentz à l'article 14 du projet de loi de financement de la sécurité sociale pour 2026 (première lecture).",
    "demandeur": {
      "texte": "Présidente du groupe \"Rassemblement National\"",
      "referenceLegislative": null
    },
    "objet": {
      "libelle": "l'amendement n° 1661 de M. Bentz à l'article 14 du projet de loi de financement de la sécurité sociale pour 2026 (première lecture).",
      "dossierLegislatif": null,
      "referenceLegislative": null
    },
    "modePublicationDesVotes": "DecompteNominatif",
    "syntheseVote": {
      "nombreVotants": "307",
      "suffragesExprimes": "295",
      "nbrSuffragesRequis": "148",
      "annonce": "L'Assemblée nationale n'a pas adopté",
      "decompte": {
        "nonVotants": "15",
        "pour": "85",
        "contre": "210",
        "abstentions": "12",
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
                "positionMajoritaire": "pour",
                "decompteVoix": {
                  "nonVotants": "1",
                  "pour": "72",
                  "contre": "1",
                  "abstentions": "0",
                  "nonVotantsVolontaires": "0"
                },
                "decompteNominatif": {
                  "nonVotants": {
                    "votant": {
                      "acteurRef": "PA794354",
                      "mandatRef": "PM842960",
                      "parDelegation": "false",
                      "numPlace": "100",
                      "causePositionVote": "PSE"
                    }
                  },
                  "pours": {
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
                        "acteurRef": "PA842279",
                        "mandatRef": "PM843779",
                        "parDelegation": "false",
                        "numPlace": "026"
                      },
                      "... (72 entrees au total, tronque)"
                    ]
                  },
                  "contres": {
                    "votant": {
                      "acteurRef": "PA794734",
                      "mandatRef": "PM843146",
                      "parDelegation": "false",
                      "numPlace": "008"
                    }
                  },
                  "abstentions": null
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
                  "pour": "0",
                  "contre": "55",
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
                  "pours": null,
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
                      "... (55 entrees au total, tronque)"
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
                "positionMajoritaire": "contre",
                "decompteVoix": {
                  "nonVotants": "0",
                  "pour": "1",
                  "contre": "34",
                  "abstentions": "0",
                  "nonVotantsVolontaires": "0"
                },
                "decompteNominatif": {
                  "nonVotants": null,
                  "pours": {
                    "votant": {
                      "acteurRef": "PA795136",
                      "mandatRef": "PM843353",
                      "parDelegation": "false",
                      "numPlace": "599"
                    }
                  },
                  "contres": {
                    "votant": [
                      {
                        "acteurRef": "PA793262",
                        "mandatRef": "PM842438",
                        "parDelegation": "true",
                        "numPlace": "571"
                      },
                      {
                        "acteurRef": "PA794906",
                        "mandatRef": "PM843284",
                        "parDelegation": "false",
                        "numPlace": "544"
                      },
                      {
                        "acteurRef": "PA794138",
                        "mandatRef": "PM842909",
                        "parDelegation": "false",
                        "numPlace": "526"
                      },
                      "... (34 entrees au total, tronque)"
                    ]
                  },
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
        null
      ],
      "pours": {
        "votant": {
          "acteurRef": "PA794734",
          "mandatRef": "PM843146",
          "parDelegation": "false",
          "numPlace": "008"
        }
      },
      "abstentions": [
        null,
        {
          "votant": {
            "acteurRef": "PA722390",
            "mandatRef": "PM843317",
            "parDelegation": "false",
            "numPlace": "181"
          }
        }
      ],
      "nonVotantsVolontaires": [
        null,
        null
      ],
      "contres": {
        "votant": {
          "acteurRef": "PA795136",
          "mandatRef": "PM843353",
          "parDelegation": "false",
          "numPlace": "599"
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
