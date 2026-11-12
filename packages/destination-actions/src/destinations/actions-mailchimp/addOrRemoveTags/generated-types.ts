// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The email address of the audience member whose tags will be updated. Used to identify the member (hashed for the API endpoint).
   */
  email: string
  /**
   * The Mailchimp Audience (List) ID the member belongs to. Defaults to the Audience ID configured in settings.
   */
  list_id?: string
  /**
   * Tags to apply or remove, each with a name and a status of "active" (add) or "inactive" (remove).
   */
  tags?: {
    /**
     * The name of the tag.
     */
    name: string
    /**
     * Whether to add ("active") or remove ("inactive") the tag.
     */
    status: string
  }[]
  /**
   * A convenience list of tag names to add (status "active"). Defaults to the event name.
   */
  tags_to_add?: string[]
  /**
   * A convenience list of tag names to remove (status "inactive").
   */
  tags_to_remove?: string[]
}
