// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * If true, Segment will attempt to update an existing custom object record in HubSpot and if no record is found, Segment will create a new custom object record. If false, Segment will only attempt to update an existing record and never create a new record. This is set to true by default.
   */
  createNewCustomRecord?: boolean
  /**
   * The unique field(s) used to search for an existing record in HubSpot to update. The fields provided here are then used to search. If a custom object is still not found, a new one is created.
   */
  customObjectSearchFields?: {
    [k: string]: unknown
  }
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
  /**
   * The unique field(s) used to search for an existing custom record in HubSpot to get toObjectId so that segment will associate the record with this record. If a Record is not found on the basis of data provided here in key:value format will skip the association.
   */
  searchFieldsToAssociateCustomObjects?: {
    [k: string]: unknown
  }
  /**
   * The CRM object schema to use for associating a record. This can be a standard object (i.e. tickets, deals, contacts, companies) or ***fullyQualifiedName*** of a custom object. Schema for the Custom Objects must be predefined in HubSpot. More information on Custom Objects and *fullyQualifiedName* in [HubSpot documentation](https://developers.hubspot.com/docs/api/crm/crm-custom-objects#retrieve-existing-custom-objects).
   */
  toObjectType?: string
  /**
   * Type of Association between two objectType
   */
  associationLabel?: string
}
