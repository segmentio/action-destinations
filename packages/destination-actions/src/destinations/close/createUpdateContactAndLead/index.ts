import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update Contact and Lead',
  description:
    'Create or Update Contact and/or Lead. At first Close will try to find ' +
    'Lead via Lead Company ID. If Lead is not found, Close will try to find ' +
    'a Contact either via Contact User ID or via Contact Email. If Contact is ' +
    'not found, Close will create a new Lead and Contact. It will also create ' +
    'a new Lead and Contact if Contact is found but exists under a Lead with ' +
    'different Lead Company ID. In case that Close finds find multiple ' +
    'Contacts with the same Contact User ID or Contact Email, Close will ' +
    'update up to 10 Contacts, ordered by creation date.',
  defaultSubscription: 'type = "identify"',
  fields: {
    lead_name: {
      label: 'Lead Name',
      description: 'The name of the Lead.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.company.name'
      }
    },
    lead_external_id: {
      label: 'Lead Company ID',
      description:
        'Your ID that identifies the Lead. Lead Custom Field ID for Company must be defined in the global integration settings.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.company.id'
      }
    },
    lead_description: {
      label: 'Lead Description',
      description: 'Description of the Lead',
      type: 'string',
      required: false
    },
    lead_status_id: {
      label: 'Lead Status ID',
      description: 'ID of the Lead Status (`stat_xxxx`). You can get it in Close in Statuses & Pipelines page.',
      type: 'string',
      required: false
    },
    lead_custom_fields: {
      label: 'Lead Custom Fields',
      description: 'Custom Fields to set on the Lead. Key should be Custom Field ID (`cf_xxxx`).',
      type: 'object',
      required: false
    },
    contact_name: {
      label: 'Contact Name',
      description: 'The name of the Contact.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.name'
      }
    },
    contact_email: {
      label: 'Contact Email',
      description:
        'Can be used for looking up the Contact. If the Contact already has different email address, this value will be appended.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.email'
      }
    },
    contact_phone: {
      label: 'Contact Phone',
      description: 'If the Contact already has different phone number, this value will be appended.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.phone'
      }
    },
    contact_url: {
      label: 'Contact URL',
      description: 'If the Contact already has different URL, this value will be appended.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.website'
      }
    },
    contact_title: {
      label: 'Contact Title',
      description: 'The title of the Contact.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.title'
      }
    },
    contact_external_id: {
      label: 'Contact User ID',
      description:
        'Your ID that identifies the Contact. Contact Custom Field ID for User ID must be defined in the global integration settings.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    contact_custom_fields: {
      label: 'Contact Custom Fields',
      description: 'Custom Fields to set on the Contact. Key should be Custom Field ID (`cf_xxxx`).',
      type: 'object',
      required: false
    }
  },

  perform: (request, data) => {
    const settings = {
      contact_custom_field_id_for_user_id: data.settings.contact_custom_field_id_for_user_id,
      lead_custom_field_id_for_company_id: data.settings.lead_custom_field_id_for_company_id
    }
    return request('https://services.close.com/webhooks/segment/actions/create-update-contact-and-lead/', {
      method: 'post',
      json: { action_payload: data.payload, settings }
    })
  }
}

export default action
