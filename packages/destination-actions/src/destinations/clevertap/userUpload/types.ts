export type ClevertapEvent = {
  type: string,
  source: string,
  profileData: object | undefined,
  identity?: string,
  ts : string | undefined
}
