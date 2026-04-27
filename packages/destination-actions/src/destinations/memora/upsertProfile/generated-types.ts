// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Enable batching of requests to Memora. Batches can contain up to 1000 profiles.
   */
  enable_batching?: boolean
  /**
   * Maximum number of profiles to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
  /**
   * The Memora Store ID to use for this profile. This should be a valid Memora Store associated with your Twilio account.
   */
  memora_store: string
  /**
   * Profile identifiers from all trait groups. At runtime, each event must contain at least one identifier with a non-null value, and at least two total non-null fields across identifiers and traits combined. Events with sparse data (e.g., only one identifier present) will be rejected. These fields are dynamically loaded from the selected Memora Store. When manually entering keys, use the format "TraitGroupName.$.traitName" (e.g., "Contact.$.email", "Contact.$.phone").
   */
  profile_identifiers: {
    [k: string]: unknown
  }
  /**
   * Traits for the profile from all trait groups. While this field is optional in the mapping configuration, at runtime each event must have at least two total non-null fields across identifiers and traits combined. If you map only one identifier, you must also map at least one trait that will have a value for your events. These fields are dynamically loaded from the selected Memora Store. When manually entering keys, use the format "TraitGroupName.$.traitName" (e.g., "Contact.$.firstName", "PurchaseHistory.$.lastPurchaseDate").
   */
  profile_traits?: {
    [k: string]: unknown
  }
}
