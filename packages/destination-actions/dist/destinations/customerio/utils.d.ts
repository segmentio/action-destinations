export declare const trackApiEndpoint: (
  accountRegion?: string | undefined
) => 'https://track-eu.customer.io' | 'https://track.customer.io'
export declare enum AccountRegion {
  US = 'US \uD83C\uDDFA\uD83C\uDDF8',
  EU = 'EU \uD83C\uDDEA\uD83C\uDDFA'
}
export declare const convertValidTimestamp: <Value = unknown>(value: Value) => number | Value
export declare const convertAttributeTimestamps: (payload: Record<string, unknown>) => Record<string, unknown>
