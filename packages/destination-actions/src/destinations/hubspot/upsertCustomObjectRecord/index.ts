import type { ActionDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// List of HubSpot defined Objects that segment has OAuth Scope to access
const hubspotDefinedObjects: string[] = ['deals', 'tickets']

// HubSpot validation rule suggests Custom Object type must start with a letter and can only contain letters, numbers, underscores, and hyphens.
// HubSpot appends a workspace specific prefix like "p1122334455_" during the Custom Object creation
// Examples of valid fullyQualifiedName: p22334455_TestObject, p22695334_TE_ST-obj5
const customObjectExpression = new RegExp('^[a-zA-Z0-9]+_[a-zA-Z][a-zA-Z0-9_-]+$')

// slug name - upsertCustomObjectRecord. We will be introducing upsert logic soon.
// To avoid slug name changes in future, naming it as upsertCustomObjectRecord straight away.
const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Custom Object Record',
  description: 'Create records in any HubSpot standard or custom object.',
  fields: {
    objectType: {
      label: 'Object Type',
      description:
        'The CRM object schema to use for creating a record. This can be a standard object (i.e. tickets, deals) or ***fullyQualifiedName*** of a custom object. Schema for the Custom Objects must be predefined in HubSpot. More information on Custom Objects and *fullyQualifiedName* in [HubSpot documentation](https://developers.hubspot.com/docs/api/crm/crm-custom-objects#retrieve-existing-custom-objects).',
      type: 'string',
      required: true
    },
    properties: {
      label: 'Properties',
      description:
        'Properties to send to HubSpot. Please make sure to include the object’s required properties. Any custom properties must be predefined in HubSpot. More information in [HubSpot documentation](https://knowledge.hubspot.com/crm-setup/manage-your-properties#create-custom-properties).',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only',
      allowNull: false
    }
  },
  perform: async (request, { payload }) => {
    // Check if Custom Object is in valid format or is a Segment-supported HubSpot object.
    if (!customObjectExpression.test(payload.objectType) && !hubspotDefinedObjects.includes(payload.objectType)) {
      throw new IntegrationError(
        'Custom Object is not in valid format. Please make sure that you are using either a valid format of object’s fullyQualifiedName (eg: p11223344_myobject) or a supported HubSpot defined object (i.e.: deals, tickets).',
        'Custom Object is not in valid format',
        400
      )
    }

    return request(`https://api.hubapi.com/crm/v3/objects/${payload.objectType}`, {
      method: 'POST',
      json: {
        properties: { ...payload.properties }
      }
    })
  }
}

export default action
