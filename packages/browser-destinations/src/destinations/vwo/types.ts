export type VWO = {
  event: (event: string, properties: { [k: string]: unknown } | undefined) => void
}
