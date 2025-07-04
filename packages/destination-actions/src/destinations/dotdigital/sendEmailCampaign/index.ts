import { ActionDefinition, DynamicFieldResponse, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DDCampaignApi, DDContactApi } from '../api'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Email Campaign',
  description: 'Sends a marketing email to a contact.',
  defaultSubscription: 'type = "track" and event = "Send Email Campaign"',
  fields: {
    email: {
      label: 'Email',
      description: "If the contact does not exist in your Dotdigital account, the campaign won't be sent.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      },
      required: true,
    },
    campaignId: {
      label: 'Campaign',
      description: `The campaign to email to a contact.`,
      type: 'number',
      required: true,
      disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment'],
      dynamic: true
    },
    sendDate: {
      label: 'Send Date',
      description: `The campaign will be sent immediately if the send date is left blank.`,
      type: 'datetime',
      required: false,
    },
    sendTimeOptimised: {
      label: 'Send Time Optimised',
      description: `Send the campaign at the most appropriate time based upon their previous opens.`,
      type: 'boolean',
      required: false,
      default: false,
    },
  },
  dynamicFields: {
    campaignId: async (request: RequestClient, { settings }): Promise<DynamicFieldResponse> => {
      return new DDCampaignApi(settings, request).getCampaigns()
    },
  },
  perform: async (request, { settings, payload }) => {
    const contactApi = new DDContactApi(settings, request)
    const contactResponse = await contactApi.getContact('email', payload.email)
    const campaignApi = new DDCampaignApi(settings, request)
    return await campaignApi.sendCampaign(payload.campaignId, contactResponse.contactId, payload.sendDate, payload.sendTimeOptimised)
  }
}

export default action
