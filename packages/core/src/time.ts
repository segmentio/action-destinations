/**
 * Gets hrtime for logging/metrics.
 */
export function time(): bigint {
  return process.hrtime.bigint()
}

/**
 * Calculates the duration in decimal milliseconds for logging/metrics purposes.
 */
export function duration(start: bigint, stop: bigint): number {
  return Number(stop - start) / 1000000
}
