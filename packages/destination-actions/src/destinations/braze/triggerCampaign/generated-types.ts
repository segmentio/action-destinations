// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the Braze campaign to trigger. The campaign must be an API-triggered campaign created in Braze.
   */
  campaign_id: string
  /**
   * Optional string to identify the send. This can be used for send level analytics, or to cancel a send.
   */
  send_id?: string
  /**
   * Optional data that will be used to personalize the campaign message. Personalization key-value pairs that will apply to all users in this request.
   */
  trigger_properties?: {
    [k: string]: unknown
  }
  /**
   * Must be set to true when sending a message to an entire segment that a campaign targets.
   */
  broadcast?: boolean
  /**
   * An array of user identifiers to send the campaign to.
   */
  recipients?: {
    /**
     * External identifier of user to receive message.
     */
    external_user_id?: string
    /**
     * User alias object to identify the user.
     */
    user_alias?: {
      alias_name?: string
      alias_label?: string
    }
    /**
     * Email address of user to receive message.
     */
    email?: string
    /**
     * Prioritization array; required when using email.
     */
    prioritization?: string[]
    /**
     * Properties that will override the default trigger_properties for a specific user.
     */
    trigger_properties?: {
      [k: string]: unknown
    }
    /**
     * Whether the message should only send to users who already exist in Braze.
     */
    send_to_existing_only?: boolean
    /**
     * Customer attributes that can be updated for the user before the message is sent.
     */
    attributes?: {
      [k: string]: unknown
    }
    /**
     * Custom events that can be performed for the user before the message is sent.
     */
    custom_events?: {
      /**
       * The name of the custom event.
       */
      name: string
      /**
       * Time when the event occurred (ISO 8601 format).
       */
      time?: string
      /**
       * Properties of the custom event.
       */
      properties?: {
        [k: string]: unknown
      }
    }[]
    /**
     * Purchase events that can be recorded for the user before the message is sent.
     */
    purchases?: {
      /**
       * The product identifier.
       */
      product_id: string
      /**
       * The currency code (ISO 4217) of the purchase.
       */
      currency: string
      /**
       * The price of the product.
       */
      price: number
      /**
       * The quantity of the product being purchased.
       */
      quantity?: number
      /**
       * Time when the purchase occurred (ISO 8601 format).
       */
      time?: string
      /**
       * Properties of the purchase.
       */
      properties?: {
        [k: string]: unknown
      }
    }[]
  }[]
  /**
   * A standard audience object to specify the users to send the campaign to.
   */
  audience?: {
    [k: string]: unknown
  }
  /**
   * The ID of the segment to send the campaign to.
   */
  segment_id?: string
  /**
   * The ID of the Connected Audience to send the campaign to.
   */
  audience_id?: string
  /**
   * Attachments to send along with the campaign. Limited to 2MB per file.
   */
  attachments?: {
    /**
     * The name of the file to be attached.
     */
    file_name: string
    /**
     * The URL of the file to be attached.
     */
    url: string
  }[]
}
