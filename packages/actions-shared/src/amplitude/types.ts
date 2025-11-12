import { AMPLITUDE_ATTRIBUTION_KEYS } from '../amplitude/constants'

export type AmplitudeAttributionKey = typeof AMPLITUDE_ATTRIBUTION_KEYS[number]

export type AmplitudeSetOnceAttributionKey = `initial_${AmplitudeAttributionKey}`

export type AmplitudeAttributionValues = Record<AmplitudeAttributionKey, string | null>

export type AmplitudeSetOnceAttributionValues = Record<AmplitudeSetOnceAttributionKey, string | null>