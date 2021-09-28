/**
 * Calculates the duration in decimal milliseconds for logging/metrics purposes.
 */
export function duration(start: number, stop: number): number {
  return Number(stop - start) / 1000000
}
