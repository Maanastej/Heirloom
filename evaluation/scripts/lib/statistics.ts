// Math utility to calculate 95% Confidence Interval for a Proportion
// Formula: p +/- Z * sqrt( (p * (1-p)) / n )
// Z for 95% is ~1.96

export function calculateProportionCI(proportion: number, sampleSize: number): { lower: number, upper: number, margin: number } {
  if (sampleSize <= 0) return { lower: 0, upper: 0, margin: 0 };
  if (proportion < 0) proportion = 0;
  if (proportion > 1) proportion = 1;
  
  const z = 1.96;
  const margin = z * Math.sqrt((proportion * (1 - proportion)) / sampleSize);
  
  return {
    lower: Math.max(0, proportion - margin),
    upper: Math.min(1, proportion + margin),
    margin
  };
}

// Math utility to calculate 95% Confidence Interval for a Continuous Mean (e.g. 1-5 score)
// We need the standard deviation. If we only have the mean and sample size, we can't perfectly compute it.
// However, since we are doing aggregate means (e.g. personalization), we'll approximate the CI
// assuming a bounded variance for a 1-5 scale if raw arrays aren't provided. 
// Max variance for 1-5 is 4. Standard deviation is roughly ~1.

export function calculateMeanCI(mean: number, sampleSize: number, assumedStdDev: number = 1.0): { lower: number, upper: number, margin: number } {
  if (sampleSize <= 0) return { lower: 0, upper: 0, margin: 0 };
  
  const z = 1.96;
  const standardError = assumedStdDev / Math.sqrt(sampleSize);
  const margin = z * standardError;
  
  return {
    lower: Math.max(1, mean - margin), // assuming 1 is min score
    upper: Math.min(5, mean + margin), // assuming 5 is max score
    margin
  };
}

export function formatCI(value: number, margin: number, isPercent = true): string {
  if (isPercent) {
    return `${(value * 100).toFixed(1)}% ± ${(margin * 100).toFixed(1)}%`;
  }
  return `${value.toFixed(2)} ± ${margin.toFixed(2)}`;
}
