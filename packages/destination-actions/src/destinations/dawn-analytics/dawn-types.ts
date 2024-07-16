export type DawnEvent = {
  event: string
  userId: string
  properties: { [k: string]: unknown }
}
