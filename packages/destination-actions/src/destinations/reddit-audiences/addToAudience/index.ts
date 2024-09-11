import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { audienceSync } from '../functions'


const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Add to Audience',
  description: 'Add users to a Reddit Custom Audience List.',
  fields: {
    audience_id: {
      type: 'string',
      required: true,
      label: 'Audience ID',
      dynamic: true,
      description:
        'The Reddit Audience ID to add users to. You can find this in your Reddit Audience Manager page.'
    },
    email: {
      type: 'string',
      required: false,
      label: 'User Email',
      description:
        "The user's email address.",
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    maid: {
      type: 'string',
      required: false,
      label: 'Mobile Advertising ID (IDFA, AAID)',
      description:
        "The user's mobile advertising ID (IDFA or AAID)",
      default: {
        '@path': '$.context.device.advertisingId'
      }
    },
    send_email: {
      type: 'boolean',
      label: 'Send Email',
      description:
        "Send emails to Reddit to add to the Custom Audience List.",
      default: true
    },
    send_maid: {
      type: 'boolean',
      label: 'Send Mobile Advertising ID',
      description:
        "Send Mobile Advertising IDs (IDFA / AAID) to Reddit to add to the Custom Audience List.",
      default: true
    },
    enable_batching: {
      type: 'boolean',
      label: 'Enable Batching',
      description:
        'Enable batching of requests.',
      required: true,
      default: true,
      unsafe_hidden: true
    }
  },
  dynamicFields: {
    audience_id: async (request: RequestClient, data: Settings) => {
      let token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpzS3dsMnlsV0VtMjVmcXhwTU40cWY4MXE2OWFFdWFyMnpLMUdhVGxjdWNZIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyIiwiZXhwIjoxNzI2MDgwNDk2Ljg5MjU5OSwiaWF0IjoxNzI1OTk0MDk2Ljg5MjU5OSwianRpIjoiVjVFbkJWZFdERVpRSzJMWThnaWFxZGlJTU43MW1BIiwiY2lkIjoiOWtYLUJWQlFTVWlZWEx4QmZGdzcyZyIsImxpZCI6InQyXzN4OWkyMnQwIiwiYWlkIjoidDJfM3g5aTIydDAiLCJsY2EiOjE1NjAyMDQyNTg0MzMsInNjcCI6ImVKeUtWaXBLVFV4UjBsRktUQ21Hc2pJeWkwdnlpeW9oWXFrcG1TVVFWbkotWGxscVVYRm1mbDZ4VWl3Z0FBRF9fd0NaRXc0IiwicmNpZCI6IjFRc3Q1ZFJnM1lrZkFHb3VJYnp2a3RzOGN6el9pOHU1Y3p3Z05vV2pHWmciLCJmbG8iOjN9.NsnheRfU2KBYROnc6WGXhY28G_0tZgzhlPPk2L-7bntuJ5tAqgNGqSJ_yojUczf40lollUYlpEN1-bN8mEH5g6UZdD_Y9fK0QcgVMtQ4F_Q-D4ph7JlQDuMOF6fpZim3jD8N0UXst100hOE0GEVbrKOmGovNY_wQuqBduo8Z4a-kuqWKN4pJjs4juYp6-c1B1ILu2M87VhaJwsvs1aIM8q3deOadJlIsW2hcPBYKWBAeALnsffDbc_4_7Qltp3TkkfgagKD631WePF8xSrwkJyBqUvPBGqA5S4P6VT_pZL3UNpb_BeUsfgxcGOWm6LDXEMjmV5gEzH4FHtnQQB3Pbw'
      const list_url = `https://ads-api.reddit.com/api/v3/ad_accounts/${data.settings.ad_account_id}/custom_audiences`
      const audience_list = await request(list_url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
      const responseBody = await audience_list.json()
      const audiences = responseBody.data.map(item => ({
        id: item.id,
        name: item.name
      }))
      const choices = audiences.map((audiences) => {
        return { value: audiences.id, label: audiences.name }
      })
      return {
        choices: choices
      }
    }
  },
  perform: (request, { payload }) => {
    const action: string = 'ADD'
    return audienceSync(request, [payload], action)
  },
  performBatch: (request, { payload }) => {
    const action: string = 'ADD'
    return audienceSync(request, payload, action)
  }
}

export default action
