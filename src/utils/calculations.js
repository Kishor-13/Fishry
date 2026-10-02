/**
 * Pure calculation functions for aquaculture formulas
 */

export function calculateSurvivingFish(stocked, survivalPercent) {
  const s = Number(stocked);
  const p = Number(survivalPercent);
  if (isNaN(s) || isNaN(p) || s <= 0 || p <= 0) return 0;
  return (s * p) / 100;
}

export function calculateBiomass(survivingFish, averageWeightG) {
  const fish = Number(survivingFish);
  const weight = Number(averageWeightG);
  if (isNaN(fish) || isNaN(weight) || fish <= 0 || weight <= 0) return 0;
  return (fish * weight) / 1000; // in kg
}

export function calculateDailyFeed(biomassKg, feedingRatePercent) {
  const bio = Number(biomassKg);
  const rate = Number(feedingRatePercent);
  if (isNaN(bio) || isNaN(rate) || bio <= 0 || rate <= 0) return 0;
  return (bio * rate) / 100; // in kg
}

export function calculateMorningFeed(dailyFeedKg) {
  const daily = Number(dailyFeedKg);
  if (isNaN(daily) || daily <= 0) return 0;
  return daily * 0.5; // 50% split
}

export function calculateEveningFeed(dailyFeedKg) {
  const daily = Number(dailyFeedKg);
  if (isNaN(daily) || daily <= 0) return 0;
  return daily * 0.5; // 50% split
}

export function calculateFeedCost(dailyFeedKg, pricePerKg) {
  const daily = Number(dailyFeedKg);
  const price = Number(pricePerKg);
  if (isNaN(daily) || isNaN(price) || daily <= 0 || price < 0) return 0;
  return daily * price;
}

export function calculateFcr(totalFeedKg, initialBiomassKg, finalBiomassKg) {
  const feed = Number(totalFeedKg);
  const init = Number(initialBiomassKg);
  const final = Number(finalBiomassKg);

  if (isNaN(feed) || isNaN(init) || isNaN(final) || feed <= 0 || init < 0 || final <= 0) {
    return { isValid: false, error: 'INVALID_INPUTS' };
  }

  const netGain = final - init;
  if (netGain <= 0) {
    return { isValid: false, error: 'NO_POSITIVE_GAIN', netGain };
  }

  const fcr = feed / netGain;
  return { isValid: true, fcr, netGain, feedGiven: feed };
}
