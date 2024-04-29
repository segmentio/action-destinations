import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HubspotClient } from './hubspot-api'
import { RequestClient } from '@segment/actions-core'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Object',
  description: 'Upsert a record of any Object type to HubSpot, and optionally assocate it with another record of any Object type.',
  fields: {
    objectCreation: {
      label: 'Object Creation',
      description: "If set to true, Segment will attempt to create a new Custom Object Type in Hubspot. The name of the Object Type will be taken from the 'Object Type' field.",
      type: 'boolean',
      required: false
    },
    objectType: {
      label: 'Object Type',
      description:'The type of Hubspot Object to create, update or upsert the record to.',
      type: 'string',
      required: true,
      dynamic: true
    },
    recordCreation: {
      label: 'Record Creation',
      description: 'Specify whether to create, update or upsert a record.',
      type: 'string',
      choices: [
        {label: 'Create', value: 'create'},
        {label: 'Update', value: 'update'},
        {label: 'Upsert', value: 'upsert'}
      ],
      default: 'upsert'
    },
    idCreation: {
      label: 'Identifier Creation',
      description: "Specify if Segment should create the 'Object Identifier Field' automatically on the Object if it does not already exist in Hubspot.",
      type: 'string',
      choices: [
        {label: 'Create', value: 'create'},
        {label: 'Do not create', value: 'do_not_create'}
      ],
      default: 'do_not_create'
    },
    idField: {
      label: 'Object ID Field',
      description: "The unique field Segment will use as an identifier when creating, updating or upserting a record of 'Object Type'.",
      type: 'string',
      required: true,
      dynamic: true
    },
    propertyCreation: {
      label: 'Property Creation',
      description: 'Specify if Segment should create a Property automatically on the Object if it does not already exist in Hubspot.',
      type: 'string',
      choices: [
        {label: 'Create', value: 'create'},
        {label: 'Do not create', value: 'do_not_create'}
      ],
      default: 'do_not_create'
    },
    stringProperties: {
      label: 'String Properties',
      description: 'String Properties to send to HubSpot.',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only',
      allowNull: false
    },
    numericProperties: {
      label: 'Number Properties',
      description: 'Number Properties to send to HubSpot.',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only',
      allowNull: false
    },
    booleanProperties: {
      label: 'Boolean Properties',
      description: 'Boolean Properties to send to HubSpot.',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only',
      allowNull: false
    },
    dateProperties: {
      label: 'Datetime Properties',
      description: 'Datetime Properties to send to HubSpot.',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only',
      allowNull: false
    },
    toIdField: {
      label: 'To Object ID Field',
      description: "The unique field Segment will use as an identifier when associating the record to another record.",
      type: 'string',
      required: true,
      dynamic: true
    },
    toObjectType: {
      label: 'To Object Type',
      description:'The type of Hubspot Object to associate the record to.',
      type: 'string',
      dynamic: true
    },
    associationLabel: {
      label: 'Association Label',
      description: 'The type of Association between the two records',
      type: 'string',
      dynamic: true
    }
  },
  dynamicFields: {
    objectType: async (request: RequestClient) => {
      const client = new HubspotClient(request)
      return await client.getObjectTypes()
    }
  },
  perform: async (request, { payload }) => {
    return '';
  }
}

export default action
