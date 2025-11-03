import { AMPLITUDE_ATTRIBUTION_KEYS } from '../amplitude/constants'

export type AmplitudeAttributionKey = typeof AMPLITUDE_ATTRIBUTION_KEYS[number]

export type AmplitudeAttributionValues = Record<AmplitudeAttributionKey, string | null>

export type AmplitudeAttributionComparison = {
  old: Partial<AmplitudeAttributionValues>
  new: Partial<AmplitudeAttributionValues>
}