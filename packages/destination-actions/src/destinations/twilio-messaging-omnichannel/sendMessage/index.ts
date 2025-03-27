import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields } from './fields'
import { IntegrationError } from '@segment/actions-core/*'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Message',
  description: 'This operation creates and sends out messages to the specified recipients.',
  fields,
  perform: (request, { payload }) => {
    let requestPayload = {}
    let fromPayload = {}
    const from = payload.from
    if (from.from === 'MessageAddressSender') {
      if (from.address === undefined || null) {
        throw new IntegrationError('For Message Address Sender address must have a value.', 'MISSING_VALUE', 400)
      }
      if (from.channel === undefined || null) {
        throw new IntegrationError('For Message Address Sender channel must have a value.', 'MISSING_VALUE', 400)
      }
      fromPayload = {
        address: from.address,
        channel: from.channel
      }
    }
    if (from.from === 'AgentIdSender') {
      if (!from.agent_id) {
        throw new IntegrationError('For Agent ID Sender, agent_id must have a value.', 'MISSING_VALUE', 400)
      }
      fromPayload = {
        agent_id: from.agent_id
      }
    }
    if (from.from === 'AgentPoolIdSender') {
      if (!from.agent_id) {
        throw new IntegrationError('For Agent Pool ID Sender, Agent Pool ID must have a value.', 'MISSING_VALUE', 400)
      }
      fromPayload = {
        agent_pool_id: from.agent_pool_id
      }
    }

    requestPayload = {
      from: fromPayload,
      to: [payload.to],
      content: payload.content,
      channels: payload.channels,
      use_domain: payload.use_domain,
      tags: payload.tags
    }

    console.log(requestPayload)

    return request(`https://comms.twilio.com/preview/Messages`, {
      method: 'POST',
      json: requestPayload
    })
  }
}

export default action
