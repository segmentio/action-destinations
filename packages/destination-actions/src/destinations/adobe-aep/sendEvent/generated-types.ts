// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Your Adobe IMS Organization ID, ending in `@AdobeOrg`. Must be the organization that owns the streaming connection.
   */
  imsOrgId: string
  /**
   * Name of the AEP sandbox that holds the streaming connection, schema and dataset (for example `prod`).
   */
  sandboxName: string
  /**
   * The ID at the end of your HTTP API streaming endpoint URL, `https://dcs.adobedc.net/collection/<inlet ID>`. Find it in AEP under Sources → HTTP API.
   */
  inletId: string
  /**
   * The `$id` of the XDM schema used by the dataset, for example `https://ns.adobe.com/<tenant>/schemas/<id>`.
   */
  schemaRefId: string
  /**
   * Content type and version of the XDM schema.
   */
  schemaRefContentType: string
  /**
   * ID of the AEP dataset to write to. Its schema must match the Schema ID above.
   */
  datasetId: string
  /**
   * ID of the dataflow attached to the HTTP API streaming connection.
   */
  flowId: string
  /**
   * Optional source label sent in the message header. AEP fills in the source if left empty.
   */
  sourceName?: string
  /**
   * Unique ID for the event. Sent as the SHA-256 hash of this value in `_id`, so retries of the same event share an `_id`.
   */
  eventId: string
  /**
   * When the event happened. Sent in `timestamp` as ISO 8601.
   */
  timestamp: string | number
  /**
   * Identity sent in the `ECID` namespace of `identityMap`. Primary only when no PID or custom identity is present.
   */
  ecid?: string
  /**
   * Identity sent in the `PID` namespace of `identityMap`. Primary by default. Send Event and Upsert Profile must send the same PID for Customer Journey Analytics to join profiles to events.
   */
  pid?: string
  /**
   * Additional identities for `identityMap`. Each namespace must exist in AEP Identity Service. The first entry marked primary becomes the primary identity.
   */
  customIdentities?: {
    /**
     * Identity namespace code, for example `ECI` or `Email`.
     */
    namespace: string
    /**
     * Identity value.
     */
    value: string
    /**
     * Whether this identity should be the primary identity.
     */
    primary?: boolean
  }[]
  /**
   * XDM fields to send. Each key is a dotted XDM path (for example `commerce.order.priceTotal`) and each value is the Segment field or constant to write there. Paths must exist in your schema. To keep existing Adobe Analytics reports working, map to `_experience.analytics.customDimensions.eVars.eVarN` or `.props.propN` (strings only). These require the Adobe Analytics ExperienceEvent Full Extension field group.
   */
  xdmMapping: {
    [k: string]: unknown
  }
  /**
   * When enabled, events are sent to the AEP batch streaming endpoint in groups.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events per request. Actual batch sizes may be smaller.
   */
  batch_size?: number
  /**
   * Maximum size of a request in bytes. AEP rejects requests over 1 MB.
   */
  batch_bytes?: number
  /**
   * Fields used to group events into batches. Every request targets one organization, sandbox and inlet.
   */
  batch_keys?: string[]
}
