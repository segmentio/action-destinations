export type VWO = {
  event: (
    event: string,
    properties: { [k: string]: unknown } | undefined,
    vwoMeta: { [k: string]: unknown } | undefined
  ) => void
  visitor: (attributes: { [k: string]: unknown }, vwoMeta: { [k: string]: unknown } | undefined) => void
  push: (args: (string | { [k: string]: unknown } | undefined)[]) => void
}
