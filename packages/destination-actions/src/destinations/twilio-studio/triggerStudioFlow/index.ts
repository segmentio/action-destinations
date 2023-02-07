import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  shouldSendToStudio,
  getToAddressField,
  STUDIO_BASE_URL,
  DEFAULT_COOLING_OFF_PERIOD,
  TwilioError
} from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Trigger Studio Flow',
  description:
    'Trigger a Flow in Twilio Studio to initiate an outbound call or message. The Flow will execute via the REST API trigger.',
  fields: {
    flowSid: {
      label: 'Flow SID',
      description: 'The Flow SID, starting with FW, for the Studio Flow to trigger.',
      type: 'string',
      required: true
    },
    from: {
      label: 'From Phone Number',
      description:
        'The Twilio phone number to initiate calls or messages from during the Flow Execution. Use [E.164](https://www.twilio.com/docs/glossary/what-e164) format (+1xxxxxxxxxx).',
      type: 'string',
      required: true
    },
    coolingOffPeriod: {
      label: 'Cooling-off Period (in seconds)',
      description:
        'The amount of time during which the Flow can only be triggered once per Flow SID - User ID combination. Default is 60 seconds.',
      type: 'number',
      default: 60
    },
    userId: {
      label: 'User ID',
      description: 'A Distinct User ID',
      type: 'hidden',
      default: { '@path': '$.userId' }
    },
    anonymousId: {
      label: 'Anonymous ID',
      description: 'A Distinct External ID',
      type: 'hidden',
      default: { '@path': '$.anonymousId' }
    },
    eventType: {
      label: 'Event type',
      type: 'hidden',
      description: 'The type of the event being performed.',
      required: true,
      default: {
        '@path': '$.type'
      }
    }
  },
  perform: async (request, { settings, payload, stateContext }) => {
    if (payload.eventType !== 'identify') {
      throw new IntegrationError(
        'Unable to trigger Studio Flow. Only Identify Events are allowed!',
        `Incompatible Event Type: ${payload.eventType}`,
        400
      )
    }
    if (!payload.userId && !payload.anonymousId) {
      throw new IntegrationError(
        'Unable to trigger Studio Flow. No User identifier found for this Segment profile!',
        `No userId found in the Segment Event`,
        400
      )
    }
    if (
      stateContext &&
      !shouldSendToStudio(
        `${payload.flowSid}_${payload.userId || payload.anonymousId}`,
        stateContext,
        payload.coolingOffPeriod!
      )
    ) {
      throw new IntegrationError(
        `Unable to trigger Studio Flow. Only 1 request allowed per Flow SID - User ID combination in ${
          payload.coolingOffPeriod || DEFAULT_COOLING_OFF_PERIOD
        } seconds`,
        'Cooling off Period',
        400
      )
    }
    const toAddress = await getToAddressField(request, settings, payload)
    if (!toAddress) {
      throw new IntegrationError(
        'Unable to trigger Studio Flow. No Contact Address Found!',
        'Trigger Studio Flow no contact address found failure',
        400
      )
    }
    const url = `${STUDIO_BASE_URL}/v2/Flows/${payload.flowSid}/Executions`
    const parametersMap = JSON.stringify({ source: 'studio_segment_destination' })
    try {
      await request(url, {
        method: 'post',
        body: new URLSearchParams({
          From: payload.from,
          To: toAddress,
          Parameters: parametersMap
        })
      })
    } catch (err) {
      const error = err as TwilioError
      const errData = error.response.data
      throw new IntegrationError(
        `Unable to trigger Studio Flow. ${errData?.message}`,
        `Twilio Error Code: ${errData?.code}`,
        errData?.status
      )
    }
  }
}

export default action
