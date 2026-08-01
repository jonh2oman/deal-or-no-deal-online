/**
 * Gander Flight Control / Banker Offer Calculator
 * Calculates fair algorithmic offers based on remaining expected value & round progression.
 */

class FlightControllerBanker {
  /**
   * Calculates the Banker Offer based on remaining prize objects
   * @param {Array<{id: number, name: string, numValue: number}>} remainingPrizes 
   * @param {number} currentRound 
   * @returns {{ offerAmount: number, formattedOffer: string, ev: number, percentage: number }}
   */
  static calculateOffer(remainingPrizes, currentRound) {
    if (!remainingPrizes || remainingPrizes.length === 0) {
      return { offerAmount: 0, formattedOffer: "$0", ev: 0, percentage: 0 };
    }

    // Sum up numerical values
    const totalEV = remainingPrizes.reduce((sum, p) => sum + (p.numValue || 0), 0);
    const averageEV = totalEV / remainingPrizes.length;

    // Multiplier scales with round progression to build tension
    let multiplier = 0.70;
    if (currentRound === 2) multiplier = 0.78;
    else if (currentRound === 3) multiplier = 0.84;
    else if (currentRound === 4) multiplier = 0.90;
    else if (currentRound >= 5) multiplier = 0.94;

    // Small atmospheric variance (+/- 2%) to mimic human flight controller decision-making
    const variance = (Math.random() * 0.04) - 0.02;
    multiplier = Math.min(0.98, Math.max(0.65, multiplier + variance));

    const targetValue = averageEV * multiplier;

    // Find the remaining in-play prize closest to targetValue
    let closestPrize = remainingPrizes[0];
    let minDiff = Math.abs((closestPrize.numValue || 0) - targetValue);

    for (let i = 1; i < remainingPrizes.length; i++) {
      const p = remainingPrizes[i];
      const diff = Math.abs((p.numValue || 0) - targetValue);
      if (diff < minDiff) {
        minDiff = diff;
        closestPrize = p;
      }
    }

    const offerAmount = closestPrize.numValue;
    const formattedOffer = closestPrize.name;

    return {
      offerAmount,
      formattedOffer,
      prizeName: closestPrize.name,
      ev: Math.round(averageEV * 100) / 100,
      percentage: Math.round(multiplier * 100)
    };
  }
}
