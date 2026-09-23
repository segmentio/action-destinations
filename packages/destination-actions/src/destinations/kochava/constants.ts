export const BASE_URL = 'https://control.kochava.com'

export const TRACK_ENDPOINT = `${BASE_URL}/track/json`

// Kochava multiplexes install vs event tracking through the top-level `action` field
// on the same /track/json endpoint.
export const KochavaAction = {
  Install: 'install',
  Event: 'event'
} as const

export type KochavaActionType = typeof KochavaAction[keyof typeof KochavaAction]

// The device identifier keys Kochava recognises inside the `device_ids` object.
export const DEVICE_ID_KEYS = ['idfa', 'idfv', 'adid', 'android_id'] as const
