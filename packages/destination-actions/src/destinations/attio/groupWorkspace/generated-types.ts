// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The domain of the Company (used to link the Workspace)
   */
  domain: string
  /**
   * The ID of the Workspace
   */
  workspace_id: string
  /**
   * Additional attributes to either set or update on the Attio Company Record. The values on the left should be Segment attributes or custom text, and the values on the right are Attio Attribute IDs or Slugs. For example: traits.name → name
   */
  company_attributes?: {
    [k: string]: unknown
  }
  /**
   * Additional attributes to either set or update on the Attio Workspace Record. The values on the left should be Segment attributes or custom text, and the values on the right are Attio Attribute IDs or Slugs. For example: traits.name → name
   */
  workspace_attributes?: {
    [k: string]: unknown
  }
}
