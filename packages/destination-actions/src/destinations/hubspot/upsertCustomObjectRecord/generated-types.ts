// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The CRM object schema to use for creating a record. This can be a standard object (i.e. tickets, deals) or ***fullyQualifiedName*** of a custom object. Schema for the Custom Objects must be predefined in HubSpot. More information on Custom Objects and *fullyQualifiedName* in [HubSpot documentation](https://developers.hubspot.com/docs/api/crm/crm-custom-objects#retrieve-existing-custom-objects).
   */
  objectType: string
  /**
   * Properties to send to HubSpot. On the left-hand side, input the internal name of the property as seen in your HubSpot account. On the right-hand side, map the Segment field that contains the value. Please make sure to include the object’s required properties. Any custom properties must be predefined in HubSpot. More information in [HubSpot documentation](https://knowledge.hubspot.com/crm-setup/manage-your-properties#create-custom-properties).
   */
  properties: {
    [k: string]: unknown
  }
}
