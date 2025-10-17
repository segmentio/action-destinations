// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The company identifier to add or remove from the LinkedIn Company Segment. At least one of Company Domain or LinkedIn Company ID is required.
   */
  identifiers: {
    /**
     * The company domain to send to LinkedIn. e.g. 'microsoft.com'
     */
    companyDomain?: string
    /**
     * The LinkedIn Company ID to send to LinkedIn.
     */
    linkedInCompanyId?: string
  }
  /**
   * Specifies if the company should be added or removed from the LinkedIn DMP Company Segment.
   */
  action?: string
  /**
   * [Hidden] Segment's friendly name for the Audience
   */
  computation_key: string
  /**
   * [Hidden] A computed object for track and identify events. This field should not need to be edited.
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * [Hidden] The computation class for the audience. Used to filter out non Audience payloads.
   */
  computation_class: string
  /**
   * [Hidden] Enable batching of requests to the LinkedIn DMP Segment.
   */
  enable_batching?: boolean
  /**
   * [Hidden] Batch key used to ensure a batch contains payloads from a single Audience only.
   */
  batch_keys: string[]
}
