// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The domain of the Company (used to link the Workspace)
   */
  domain: string
  /**
   * The name of the Workspace
   */
  name: string
  /**
   * Additional attributes to either set or update on the Attio Company Record. The keys on the left should be Attio Attribute IDs or Slugs, and the values on the right are Segment attributes or custom text.
   */
  company_attributes?: {
    [k: string]: unknown
  }
  /**
   * Additional attributes to either set or update on the Attio Workspace Record. The keys on the left should be Attio Attribute IDs or Slugs, and the values on the right are Segment attributes or custom text.
   */
  workspace_attributes?: {
    [k: string]: unknown
  }
}
