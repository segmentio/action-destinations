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
  action: string
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
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveInputs {
  /**
   * Select an existing LinkedIn DMP Company Segment to sync to. If provided, a new audience will not be created.
   */
  existing_audience_id?: string
  /**
   * The name of the LinkedIn DMP Company Segment to create. Only used when an existing audience is not selected above.
   */
  segment_creation_name?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveOutputs {
  /**
   * The ID of the LinkedIn DMP Company Segment that companies will be synced to.
   */
  id?: string
  /**
   * The name of the LinkedIn DMP Company Segment that companies will be synced to.
   */
  name?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface OnMappingSaveInputs {
  /**
   * Select an existing LinkedIn DMP Company Segment to sync to. If provided, a new audience will not be created.
   */
  existing_audience_id?: string
  /**
   * The name of the LinkedIn DMP Company Segment to create. Only used when an existing audience is not selected above.
   */
  segment_creation_name?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface OnMappingSaveOutputs {
  /**
   * The ID of the LinkedIn DMP Company Segment that companies will be synced to.
   */
  id?: string
  /**
   * The name of the LinkedIn DMP Company Segment that companies will be synced to.
   */
  name?: string
}
