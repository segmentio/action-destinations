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
   * Identity sent in the `ECID` namespace of `identityMap`. Select `ECID` in Primary Identity to make it the primary identity.
   */
  ecid?: string
  /**
   * Identity sent in the `PID` namespace of `identityMap`. Select `PID` in Primary Identity to make it the primary identity. Send Event and Upsert Profile must send the same PID for Customer Journey Analytics to join profiles to events.
   */
  pid?: string
  /**
   * Additional identities for `identityMap`. Each namespace must exist in AEP Identity Service. Choose the primary identity in the Primary Identity field below.
   */
  customIdentities?: {
    /**
     * Identity namespace code, for example `ECI` or `Email`. Choices come from the identity namespaces in your sandbox, so enter the IMS Organization ID and Sandbox Name as values first. The code is case-sensitive.
     */
    namespace: string
    /**
     * Identity value.
     */
    value: string
  }[]
  /**
   * The identity sent with `primary: true` in `identityMap`. AEP allows exactly one. Choose from the identities mapped above: `PID`, `ECID` or a custom namespace. The event is rejected if the chosen identity has no value.
   */
  primaryIdentity: string
  /**
   * XDM fields to send. Each key is a dotted XDM path (for example `commerce.order.priceTotal`) and each value is the Segment field or constant to write there. Paths must exist in your schema. Use Individual Profile paths such as `person.name.firstName`, or tenant fields such as `_<tenant>.customerTier`.
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
