// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your Close API key.
   */
  api_key: string
  /**
   * Enter the ID of a Contact Custom Field that'll be used to store User ID. You'll need to create this Contact Custom Field in Close first, and then the integration will use this field to store the User ID when creating new contacts, and/or will be used as a lookup key when updating existing Contacts. If this field is not filled out, it will only lookup and de-dupe based on email.
   */
  contact_custom_field_id_for_user_id?: string
}
