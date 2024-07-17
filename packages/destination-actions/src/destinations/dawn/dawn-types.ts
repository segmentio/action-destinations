export type DawnEvent = {
  event: string
  user_id: string
  properties: { [k: string]: unknown }
}

export type DawnIdentifyUser = {
  user_id: string
  traits: { [k: string]: unknown }
}
