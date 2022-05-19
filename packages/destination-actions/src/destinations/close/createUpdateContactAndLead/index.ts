import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update Contact and Lead',
  description:
    'Create or Update Contact and/or Lead. At first, Close will try to find ' +
    'Lead via Lead Company ID. If Lead is not found, Close will try to find ' +
    'a Contact either via Contact User ID or via Contact Email. If Contact is ' +
    'not found, Close will create a new Lead and Contact. It will also create ' +
    'a new Lead and Contact if Contact is found but exists under a Lead with ' +
    'different Lead Company ID. If the Action does not specify Lead Company ' +
    'ID, Close will update the Contact and also the Contact’s Lead. It might ' +
    'happen that Close will find multiple Contacts with the same Contact User ' +
    'ID or Contact Email. In such case, Close will update up to 10 Contacts, ' +
    'ordered by creation date.',
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
      description: 'Description of the Lead.',
      type: 'string',
      required: false
    },
    lead_status_id: {
      label: 'Lead Status ID',
      description: 'ID of the Lead Status (`stat_xxxx`). You can get it in Close in the Statuses & Pipelines page.',
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
        'Used to lookup Contact if Contact User ID is not set. If the Contact already has different email address, this value will be appended.',
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
    },
    allow_creating_new_leads: {
      label: 'Allow creating new Leads',
      description: 'Whether the integration is allowed to create new Leads.',
      type: 'boolean',
      default: true
    },
    allow_updating_existing_leads: {
      label: 'Allow updating existing Leads',
      description: 'Whether the integration is allowed to update existing Leads.',
      type: 'boolean',
      default: true
    },
    allow_creating_new_contacts: {
      label: 'Allow creating new Contacts',
      description: 'Whether the integration is allowed to create new Contacts.',
      type: 'boolean',
      default: true
    },
    allow_updating_existing_contacts: {
      label: 'Allow updating existing Contacts',
      description: 'Whether the integration is allowed to update existing Contacts.',
      type: 'boolean',
      default: true
    },
    allow_creating_duplicate_contacts: {
      label: 'Allow creating duplicate Contacts under different Lead',
      description:
        'Whether the integration is allowed to create duplicate Contact (same email or Contact User ID) under a different Lead (different Lead Company ID).',
      type: 'boolean',
      default: true
    }
  },

  perform: (request, data) => {
    const settings = {
      contact_custom_field_id_for_user_id: data.settings.contact_custom_field_id_for_user_id,
      lead_custom_field_id_for_company_id: data.settings.lead_custom_field_id_for_company_id,
      allow_creating_new_leads: data.payload.allow_creating_new_leads,
      allow_updating_existing_leads: data.payload.allow_updating_existing_leads,
      allow_creating_new_contacts: data.payload.allow_creating_new_contacts,
      allow_updating_existing_contacts: data.payload.allow_updating_existing_contacts,
      allow_creating_duplicate_contacts: data.payload.allow_creating_duplicate_contacts
    }
    const action_payload = { ...data.payload }
    // Following fields are defined on action, but are sent as settings to
    // Close API.
    delete action_payload.allow_creating_new_leads
    delete action_payload.allow_updating_existing_leads
    delete action_payload.allow_creating_new_contacts
    delete action_payload.allow_updating_existing_contacts
    delete action_payload.allow_creating_duplicate_contacts

    return request('https://services.close.com/webhooks/segment/actions/create-update-contact-and-lead/', {
      method: 'post',
      json: { action_payload, settings }
    })
  }
}

export default action
