/* PREMIER LANCEMENT (13/11/2026, ADR 0009) : sans profil gardé, l'accueil laisse la place à la question du prénom.
 * Un test qui part de l'accueil comme un lecteur répond donc d'abord « Passer », comme lui. Aucune clé n'est écrite
 * ici à la main : c'est le bouton de l'application qui garde les réglages par défaut. */
export async function passerBienvenue(page) {
  /* 14/11/2026 : plus de redirection. La barrière du prénom est posée par-dessus l'application, à la même adresse. */
  await page.getByTestId("barriere-bienvenue").waitFor({ state: "visible", timeout: 2500 }).catch(() => {});
  if (!(await page.getByTestId("barriere-bienvenue").isVisible().catch(() => false))) return false;
  /* 28/11/2026 (hotfix H2) : la bienvenue ne se pose plus qu'à la demande, et n'a plus qu'un écran : le prénom. */
  await page.getByRole("button", { name: /^Passer, sans/ }).click();
  await page.getByTestId("barriere-bienvenue").waitFor({ state: "detached", timeout: 10000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  return true;
}
