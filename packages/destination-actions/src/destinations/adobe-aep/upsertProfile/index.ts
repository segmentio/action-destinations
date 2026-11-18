import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { batchFields, commonFields, identityFields, xdmMappingDescription } from '../fields'
import { send } from '../utils'
import { getIdentityNamespaces, getPrimaryIdentityChoices, getSchemas, getXdmPaths } from '../dynamic-fields'
import { INDIVIDUAL_PROFILE_CLASS } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Profile',
  description:
    'Send Identify traits to an AEP profile dataset as XDM Individual Profile records, so Customer Journey Analytics can join profiles to events on the Person ID. Use the same PID as Send Event.',
  defaultSubscription: 'type = "identify"',
  fields: {
    ...commonFields,
    ...identityFields,
    xdmMapping: {
      label: 'XDM Mapping',
      description: `${xdmMappingDescription} Use Individual Profile paths such as \`person.name.firstName\`, or tenant fields such as \`_<tenant>.customerTier\`.`,
      type: 'object',
      required: true,
      dynamic: true,
      defaultObjectUI: 'keyvalue',
      additionalProperties: true,
      default: {
        'person.name.firstName': { '@path': '$.traits.first_name' },
        'person.name.lastName': { '@path': '$.traits.last_name' },
        'personalEmail.address': { '@path': '$.traits.email' }
      }
    },
    ...batchFields
  },
  dynamicFields: {
    xdmMapping: {
      __keys__: (request, { payload, settings, auth }) => getXdmPaths(request, payload, 'profile', { settings, auth })
    },
    schemaRefId: (request, { payload, settings, auth }) =>
      getSchemas(request, payload, INDIVIDUAL_PROFILE_CLASS, { settings, auth }),
    customIdentities: {
      namespace: (request, { payload, settings, auth }) => getIdentityNamespaces(request, payload, { settings, auth })
    },
    primaryIdentity: (_request, { payload }) => getPrimaryIdentityChoices(payload)
  },
  perform: (request, { payload }) => {
    return send(request, [payload], 'profile', false)
  },
  performBatch: (request, { payload }) => {
    return send(request, payload, 'profile', true)
  }
}

export default action
