import type { ActionDefinition } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_BASE, safeObject } from '../api'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description:
    'Create or update a person in GainTrace and attach them to a company. Safe to call repeatedly: GainTrace matches on external ID, then email, and updates rather than duplicating.',
  // Narrowed on purpose. A person in GainTrace always belongs to a company, so
  // an identify with no group association cannot be stored. Filtering here means
  // those calls are reported as filtered rather than failing delivery.
  defaultSubscription: 'type = "identify" and context.groupId != null',
  fields: {
    userId: {
      label: 'User ID',
      description:
        "The customer's own identifier for this person, used as the stable match key in GainTrace. Required unless an Email is provided.",
      type: 'string',
      // Preferred, because an email address can change while an id does not.
      // Conditionally required rather than always required so an identify call
      // carrying only an email still works, which is how Planhat matches too.
      required: {
        conditions: [{ fieldKey: 'email', operator: 'is', value: undefined }]
      },
      default: { '@path': '$.userId' }
    },
    accountExternalId: {
      label: 'Company ID',
      description:
        "The customer's own identifier for the company this person belongs to, normally the Segment group ID. GainTrace creates the company if it has not seen it yet.",
      type: 'string',
      required: true,
      default: { '@path': '$.context.groupId' }
    },
    email: {
      label: 'Email',
      description: 'The email address of the person. Used as a secondary match key.',
      type: 'string',
      format: 'email',
      default: { '@path': '$.traits.email' }
    },
    name: {
      label: 'Name',
      description: 'The full name of the person. Falls back to the email local part when absent.',
      type: 'string',
      default: { '@path': '$.traits.name' }
    },
    phone: {
      label: 'Phone',
      description: 'The phone number of the person.',
      type: 'string',
      default: { '@path': '$.traits.phone' }
    },
    role: {
      label: 'Role',
      description: 'The job title or role of the person.',
      type: 'string',
      default: { '@path': '$.traits.title' }
    },
    traits: {
      label: 'Traits',
      description:
        'All other traits to store on the person. Segment Engage computed traits and audience membership arrive here and are merged with existing traits rather than replacing them.',
      type: 'object',
      additionalProperties: true,
      defaultObjectUI: 'keyvalue',
      default: { '@path': '$.traits' }
    }
  },
  perform: (request, { payload }) => {
    if (!payload.userId && !payload.email) {
      throw new PayloadValidationError('Either a User ID or an email address is required to identify a person.')
    }
    return request(`${API_BASE}/contacts`, {
      method: 'POST',
      json: {
        upsert: true,
        externalId: payload.userId,
        accountExternalId: payload.accountExternalId,
        ...(payload.email ? { email: payload.email } : {}),
        ...(payload.name ? { name: payload.name } : {}),
        ...(payload.phone ? { phone: payload.phone } : {}),
        ...(payload.role ? { role: payload.role } : {}),
        ...(safeObject(payload.traits) ? { traits: safeObject(payload.traits) } : {})
      }
    })
  }
}

export default action
