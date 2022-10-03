// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The CRM object schema to use for creating a record. This can be a standard object (i.e. tickets, deals) or ***fullyQualifiedName*** of a custom object. Custom objects and their schema must be predefined in HubSpot.
   */
  objectType: string
  /**
   * Properties to send to HubSpot. Please make sure to include the object’s required properties. Any custom properties must be predefined in HubSpot. More information in [HubSpot documentation](https://knowledge.hubspot.com/crm-setup/manage-your-properties#create-custom-properties).
   */
  properties: {
    [k: string]: unknown
  }
}
