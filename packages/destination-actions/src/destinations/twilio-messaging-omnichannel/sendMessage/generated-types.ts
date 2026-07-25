// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Defines the fields applicable based on the selected sender type.
   */
  from?: {
    /**
     * The type of sender.
     */
    from?: string
    /**
     * The identifier within a channel address space for an actor.
     */
    address?: string
    /**
     * The channels available for the Message entity.
     */
    channel?: string
    /**
     * A reference to an Agent.
     */
    agent_id?: string
    /**
     * A reference to an Agent Pool.
     */
    agent_pool_id?: string
  }

  /**
   * An array of recipient objects to send the message(s) to.
   */
  to: {
    /**
     * The identifier within a channel address space for an actor (e.g. phone number).
     */
    address: string
    /**
     * The channels available for the Message entity.
     */
    channel: string
    /**
     * To personalize content for each recipient, supply variables here with values to substitute into any Liquid templated content string or pre-stored Content template.
     */
    variables?: {
      [k: string]: unknown
    }
  }

  /**
   * Defines the fields applicable based on the selected content type.
   */
  content: {
    /**
     * The type of message content.
     */
    content_type?: string
    /**
     * A simple string or templated content.
     */
    text?: string
    /**
     * Optional title prepended to the message.
     */
    title?: string
    /**
     * Default values for use within the templated content field text and title.
     */
    default_variables?: {
      [k: string]: unknown
    }
    /**
     * A reference to a Content template.
     */
    content_id?: string
  }
  /**
   * A list of eligible channels to constrain Messages to; leave undefined to send across all available channels.
   */
  channels?: string
  /**
   * The Domain to use for wrapping links for click-tracked links and shortened links.
   */
  use_domain?: {
    /**
     * A fully qualified domain name (FQDN) that you have registered with your DNS provider.
     */
    domain_name?: string
  }
  /**
   * Custom metadata in the form of key-value pairs. Maximum size of a tag key is 128 characters. Maximum size of a tag value is 256 characters. There can be a maximum of 10 key-value pairs.
   */
  tags?: {
    [k: string]: unknown
  }
}
