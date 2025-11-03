import { KEYS } from './constants'

export type AttributionKey = typeof KEYS[number]

export type AttributionValues = Record<AttributionKey, string | null>
