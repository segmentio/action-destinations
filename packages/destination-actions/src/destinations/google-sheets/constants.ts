export const CONSTANTS = {
  /**
   * Based on benchmarks found while testing so we dont reach the timeout limit.
   */
  MAX_CELLS: 300000,

  /**
   * The maximum number of cells that can be written to a sheet in a single request.
   */
  MAX_CELLS_CANARY: 1_000_000
}
