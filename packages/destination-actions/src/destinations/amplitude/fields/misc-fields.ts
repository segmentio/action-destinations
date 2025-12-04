import { InputField } from '@segment/actions-core'

export const time: InputField = {
    label: 'Timestamp',
    type: 'datetime',
    description: 'The timestamp of the event. If time is not sent with the event, it will be set to the request upload time.',
    default: {
        '@path': '$.timestamp'
    }
}

export const min_id_length: InputField = {
    label: 'Minimum ID Length',
    description: 'Amplitude has a default minimum id length of 5 characters for user_id and device_id fields. This field allows the minimum to be overridden to allow shorter id lengths.',
    allowNull: true,
    type: 'integer'
}

export const device_id: InputField = {
    label: 'Device ID',
    type: 'string',
    description: 'A device-specific identifier, such as the Identifier for Vendor on iOS. Required unless user ID is present. If a device ID is not sent with the event, it will be set to a hashed version of the user ID.',
    default: {
        '@if': {
            exists: { '@path': '$.context.device.id' },
            then: { '@path': '$.context.device.id' },
            else: { '@path': '$.anonymousId' }
        }
    }
}

export const insert_id: InputField = {
  label: 'Insert ID',
  type: 'string',
  description:
    'Amplitude will deduplicate subsequent events sent with this ID we have already seen before within the past 7 days. Amplitude recommends generating a UUID or using some combination of device ID, user ID, event type, event ID, and time.'
}

export const utm_properties: InputField = {
    label: 'UTM Properties',
    type: 'object',
    description: 'UTM Tracking Properties',
    properties: {
        utm_source: {
            label: 'UTM Source',
            type: 'string'
        },
        utm_medium: {
            label: 'UTM Medium',
            type: 'string'
        },
        utm_campaign: {
            label: 'UTM Campaign',
            type: 'string'
        },
        utm_term: {
            label: 'UTM Term',
            type: 'string'
        },
        utm_content: {
            label: 'UTM Content',
            type: 'string'
        }
    },
    default: {
        utm_source: { '@path': '$.context.campaign.source' },
        utm_medium: { '@path': '$.context.campaign.medium' },
        utm_campaign: { '@path': '$.context.campaign.name' },
        utm_term: { '@path': '$.context.campaign.term' },
        utm_content: { '@path': '$.context.campaign.content' }
    }
}

export const referrer: InputField = {
    label: 'Referrer',
    type: 'string',
    description:
    'The referrer of the web request. Sent to Amplitude as both last touch “referrer” and first touch “initial_referrer”',
    default: {
    '@path': '$.context.page.referrer'
    }
}