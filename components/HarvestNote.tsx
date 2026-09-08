import type { Economics } from "@/lib/types";

/**
 * Says why there is no profit figure, in the farmer's terms.
 *
 * Order matters: "your crop is not ready yet" is the answer a farmer who has
 * just planted needs, and it beats any explanation about missing price data.
 */
export function harvestNote(econ: Economics): string {
  if (!econ.bearing) {
    if (econ.firstHarvestOn) {
      const when = /^\d{4}$/.test(econ.firstHarvestOn)
        ? econ.firstHarvestOn
        : new Date(econ.firstHarvestOn).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          });
      return `Your crop is still growing. First harvest expected around ${when}.`;
    }
    return "Tell us when you planted, and we can work out when your first harvest is due.";
  }
  if (!econ.yieldKnown) {
    return "This crop has no harvest estimate yet, so revenue and profit cannot be worked out.";
  }
  return "No mandi price for this crop today, so the harvest cannot be valued yet.";
}
