import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Subscribe to Campaign',
  description: 'Subscribes a user to notifications',
  fields: {
    segmentLibrary: {
      label: 'Segment Library',
      description:
        'The Segment library used when the event was triggered. This Integration will only work with analytics.js or Mobile Segment libraries',
      type: 'hidden',
      default: { '@path': '$.context.library.name' }
    },
    platform: {
      label: 'User Device Platform',
      description: 'The platform of the device which generated the event e.g. "Android" or "iOS"',
      type: 'hidden',
      default: { '@path': '$.context.device.type' }
    },
    campaignId: {
      label: 'Campaign ID',
      description:
        'Create an ID for your campaign. For every campaign you activate using Ambee’s pollen and/or air quality action, you need to create a new ID. Note: a campaign ID must not contain spaces. Example:“companyabc_ambeepollen” is valid while “companyabc ambeepollen” is not valid',
      type: 'string'
    },
    userId: {
      label: 'User ID',
      description: 'The main user identifier to be sent to Ambee',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      },
      required: true
    },
    airQualitySubscription: {
      label: 'Air Quality Subscription',
      description:
        'Subscribe to Air quality notifications from Ambee. Please select the Air Quality (AQI) risk level you would like to receive notifications for',
      type: 'string',
      choices: [
        { label: 'Good', value: 'good' },
        { label: 'Moderate', value: 'moderate' },
        { label: 'Unhealthy for sensitive group', value: 'unhealthy_sensitive_group' },
        { label: 'Unhealthy', value: 'unhealthy' },
        { label: 'Very unhealthy', value: 'very_unhealthy' },
        { label: 'Hazardous', value: 'hazardous' }
      ],
      required: false
    },
    pollenSubscription: {
      label: 'Pollen Subscription',
      description:
        'Subscribe to Pollen level notifications from Ambee. Please select the Pollen risk level you would like to receive notifications for',
      type: 'string',
      choices: [
        { label: 'Low', value: 'low' },
        { label: 'Moderate', value: 'moderate' },
        { label: 'High', value: 'high' },
        { label: 'Very high', value: 'very_high' }
      ],
      required: false
    },
    ipAddress: {
      label: 'User IP Address',
      description:
        'Ambee uses the user’s IP address when determining who to send air quality and/or pollen notifications to.',
      type: 'string',
      default: { '@path': '$.context.ip' },
      required: true
    }
  },
  perform: (request, { settings, payload }) => {
    const platform = payload?.platform?.toLowerCase() ?? ''
    const library = payload?.segmentLibrary ?? ''

    if (library != 'analytics.js' && platform != 'ios' && platform != 'android')
      throw new PayloadValidationError(
        `Payload must be sent from the Segment analytics.js library or from a Segment Mobile library`
      )

    if (payload.segmentLibrary)
      return request('https://segment-api.ambeedata.com/v1/campaign-info', {
        method: 'post',
        json: {
          ...payload,
          email: settings.email
        }
      })
  }
}

export default action
