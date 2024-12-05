import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Profile updates',
  description: 'Sync profile updates into Antavo',
  defaultSubscription: 'type = "identify"',
  fields: {
    customer: {
      label: 'Customer ID',
      description: 'User ID, selected in Antavo as customer identifier',
      type: 'string',
      required: true
    },
    account: {
      label: 'Account',
      description: 'Antavo Account ID — if the Multi Accounts extension is enabled',
      type: 'string',
      required: false,
      default: ''
    },
    data: {
      label: 'Data',
      description: 'Customer properties',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      required: true,
      additionalProperties: true,
      properties: {
        first_name: {
          label: 'First name',
          description: 'Customer\'s first name',
          type: 'string'
        },
        last_name: {
          label: 'Last name',
          description: 'Customer\'s last name',
          type: 'string'
        },
        email: {
          label: 'Email',
          description: 'Customer\'s email address',
          type: 'string'
        },
        birth_date: {
          label: 'Birthdate',
          description: 'Customer\'s birth date',
          type: 'string'
        },
        gender: {
          label: 'Gender',
          description: 'Customer\'s gender',
          type: 'string'
        },
        language: {
          label: 'Language',
          description: 'Customer\'s language',
          type: 'string'
        },
        phone: {
          label: 'Phone',
          description: 'Customer\'s phone number',
          type: 'string'
        },
        mobile_phone: {
          label: 'Mobile phone',
          description: 'Customer\'s mobile phone number',
          type: 'string'
        },
      },
      default: {
        first_name: '',
        last_name: '',
        email: '',
        birth_date: '',
        gender: '',
        language: '',
        phone: '',
        mobile_phone: '',
      }
    },
  },
  perform: (request, data) => {
    const url = `https://api.${data.settings.stack}.antavo.com/v1/webhook/segment`
    const payload = {
      ...data.payload,
      action: 'profile',
      api_key: data.settings.api_key
    }

    return request(url, {
      method: 'post',
      json: payload
    })
  }
}

export default action
