// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
<<<<<<< HEAD
   * The CRM object schema to use for creating a record. This can be a standard object (i.e. tickets, deals) or ***fullyQualifiedName*** of a custom object. Custom objects and their schema must be predefined in HubSpot.
=======
   * The CRM object schema to use for creating a record. This can be a standard object (i.e. tickets, deals) or ***fullyQualifiedName*** of a custom object. Schema for the Custom Objects must be predefined in HubSpot. More information on Custom Objects and *fullyQualifiedName* in [HubSpot documentation](https://developers.hubspot.com/docs/cms/data/crm-objects#getting-a-custom-object-type-s-details).
>>>>>>> CONMAN-199
   */
  objectType: string
  /**
   * Properties to send to HubSpot. Please make sure to include the object’s required properties. Any custom properties must be predefined in HubSpot. More information in [HubSpot documentation](https://knowledge.hubspot.com/crm-setup/manage-your-properties#create-custom-properties).
   */
  properties: {
    [k: string]: unknown
  }
}
