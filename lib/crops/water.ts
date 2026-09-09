/**
 * Crop coefficients (Kc), FAO-56.
 *
 * Reference evapotranspiration describes a standard grass surface. A mature
 * arecanut canopy transpires more than grass; a young pepper vine less. Kc is
 * the multiplier between the two, and without it the water figure would be
 * wrong for every crop in the registry.
 *
 * These are mid-season values, which is the right approximation for a perennial
 * standing all year. Seasonal crops move through Kc stages the app does not yet
 * model, so their figure is closest to correct at peak canopy and overstates
 * demand for a young crop. Worth fixing when there is a reason to.
 */
export const CROP_KC: Record<string, number> = {
  arecanut: 0.95,
  coconut: 0.9,
  oil_palm: 1.0,
  banana: 1.1,
  cocoa: 1.0,
  coffee: 0.95,
  black_pepper: 0.8,
  cardamom: 0.9,
  rubber: 0.95,
  paddy: 1.15,
  sugarcane: 1.25,
  tomato: 1.0,
  brinjal: 1.0,
  green_chilli: 1.0,
  onion: 1.0,
  potato: 1.05,
  cotton: 1.15,
  maize: 1.15,
  wheat: 1.05,
  groundnut: 1.05,
  turmeric: 1.05,
  ginger: 1.05,
  grapes: 0.8,
  mango: 0.85,
  papaya: 1.0,
  cashew: 0.85,
};

/** A crop with no measured coefficient gets a middling one, not zero. */
export const kcFor = (cropId: string): number => CROP_KC[cropId] ?? 0.9;

/** Litres in one millimetre of water over one acre. */
export const LITRES_PER_MM_PER_ACRE = 4047;

/**
 * Not all rain reaches the roots — some runs off, some evaporates off the
 * canopy before it lands. A flat 80% is the usual field approximation and is
 * honest enough at this resolution.
 */
export const RAIN_EFFECTIVENESS = 0.8;
