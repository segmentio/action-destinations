import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { batchFields, commonFields, identityFields, xdmMappingDescription } from '../fields'
import { send } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event',
  description:
    'Send Track, Page and Screen events to an AEP streaming connection as XDM ExperienceEvents. The schema must use the ExperienceEvent class and include the Identity Map field group.',
  defaultSubscription: 'type = "track" or type = "page" or type = "screen"',
  fields: {
    ...commonFields,
    sourceName: {
      label: 'Source Name',
      description: 'Optional source label sent in the message header. AEP fills in the source if left empty.',
      type: 'string',
      required: false
    },
    eventId: {
      label: 'Event ID',
      description:
        'Unique ID for the event. Sent as the SHA-256 hash of this value in `_id`, so retries of the same event share an `_id`.',
      type: 'string',
      required: true,
      default: { '@path': '$.messageId' }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'When the event happened. Sent in `timestamp` as ISO 8601.',
      type: 'datetime',
      required: true,
      default: { '@path': '$.timestamp' }
    },
    ...identityFields,
    xdmMapping: {
      label: 'XDM Mapping',
      description: `${xdmMappingDescription} To keep existing Adobe Analytics reports working, map to \`_experience.analytics.customDimensions.eVars.eVarN\` or \`.props.propN\` (strings only). These require the Adobe Analytics ExperienceEvent Full Extension field group.`,
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only',
      additionalProperties: true,
      default: {
        'web.webPageDetails.URL': { '@path': '$.context.page.url' },
        'web.webReferrer.URL': { '@path': '$.context.page.referrer' }
      }
    },
    ...batchFields
  },
  perform: (request, { payload }) => {
    return send(request, [payload], 'event', false)
  },
  performBatch: (request, { payload }) => {
    return send(request, payload, 'event', true)
  }
}

export default action
