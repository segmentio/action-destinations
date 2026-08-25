export type Wingify = {
  event: (
    event: string,
    properties: { [k: string]: unknown } | undefined,
    wingifyMeta: { [k: string]: unknown } | undefined
  ) => void
  visitor: (attributes: { [k: string]: unknown }, wingifyMeta: { [k: string]: unknown } | undefined) => void
  push: (args: (string | { [k: string]: unknown } | undefined)[]) => void
}
