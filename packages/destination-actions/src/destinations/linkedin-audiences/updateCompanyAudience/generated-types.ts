// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The company identifiers to add to or remove from the LinkedIn DMP Company Segment. At least one of 'Company Domain' or 'LinkedIn Company ID' is required. When both are provided, both are sent to LinkedIn to improve the match rate.
   */
  identifiers: {
    /**
     * The company's website domain to send to LinkedIn, e.g. 'microsoft.com'.
     */
    companyDomain?: string
    /**
     * The company's LinkedIn organization ID or organization URN, e.g. '1035' or 'urn:li:organization:1035'. A bare ID is automatically converted to a URN before being sent to LinkedIn.
     */
    linkedInCompanyId?: string
  }
  /**
   * Whether the company should be added to or removed from the LinkedIn DMP Company Segment.
   */
  dmp_company_action: string
  /**
   * Choose "Engage or Reverse ETL" when the Audience is configured in Engage or Reverse ETL. If connecting from a Connections Source, for example a node.js Source, select Connections, then provide a name for your Segment.
   */
  audience_source: string
  /**
   * The name of the LinkedIn DMP Company Segment to sync to. Used only when Audience Source is "Connections". If a segment with this name does not already exist, it will be created in LinkedIn.
   */
  segment_name?: string
  /**
   * The computation key used to identify the LinkedIn DMP Company Segment. Used only when Audience Source is "Engage or Reverse ETL".
   */
  computation_key?: string
  /**
   * Enable batching of requests to the LinkedIn DMP Company Segment.
   */
  enable_batching?: boolean
  /**
   * Maximum number of companies to include in each batch. LinkedIn accepts up to 5000 per request.
   */
  batch_size?: number
  /**
   * The keys to use for batching the events.
   */
  batch_keys?: string[]
}
