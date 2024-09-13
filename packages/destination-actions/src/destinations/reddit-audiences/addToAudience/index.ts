import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { audienceSync, retrieveAccessToken } from '../functions'
import { AudienceResponse } from '../types'


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
    audience_id: async (request: RequestClient, { settings }: { settings: Settings }) => {
      const token = retrieveAccessToken();
      if (!token) {
        throw new Error('Access token is missing. Please refresh the token.');
      }
      const list_url = `https://ads-api.reddit.com/api/v3/ad_accounts/${settings.ad_account_id}/custom_audiences`
      const audience_list = await request<AudienceResponse>(list_url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
      const responseBody = await audience_list.data;
      const audiences = responseBody.data.map((item: any) => ({
        id: item.id,
        name: item.name
      }))
      const choices = audiences.map((audiences: any) => {
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
