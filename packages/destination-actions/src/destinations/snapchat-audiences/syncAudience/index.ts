import type { ActionDefinition } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { validateAndExtractIdentifier } from './utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync Segment Engage Audiences to Snapchat',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    external_audience_id: {
      type: 'string',
      label: 'External Audience ID',
      description: 'Unique Audience Identifier returned by the createAudience() function call.',
      required: true,
      unsafe_hidden: true,
      default: {
        '@path': '$.context.personas.external_audience_id'
      }
    },
    schema_type: {
      type: 'string',
      choices: [
        { value: 'MOBILE_AD_ID_SHA256', label: 'Mobile ID' },
        { value: 'PHONE_SHA256', label: 'Phone' },
        { value: 'EMAIL_SHA256', label: 'Email' }
      ],
      label: 'External ID Type',
      required: true,
      description:
        'Choose the type of identifier to use when adding users to Snapchat. If selecting Mobile ID or Phone, ensure these identifiers are included as custom traits in the Audience settings page where the destination is connected.',
      default: 'EMAIL_SHA256'
    },
    phone: {
      label: 'Phone Number',
      description: "User's phone number",
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
      },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'schema_type',
            operator: 'is',
            value: 'PHONE_SHA256'
          }
        ]
      }
    },
    email: {
      label: 'Email',
      description: "User's email address",
      type: 'string',
      format: 'email',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.traits.email' }
        }
      },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'schema_type',
            operator: 'is',
            value: 'EMAIL_SHA256'
          }
        ]
      }
    },
    mobile_id_type: {
      label: 'Mobile Identifier Type',
      description: 'Select the type of mobile identifier to use as External ID',
      type: 'string',
      required: true,
      choices: [
        { value: 'deviceId', label: 'iOS/Android Device ID' },
        { value: 'advertisingId', label: 'Advertising ID (idfa)' }
      ],
      default: 'deviceId',
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'schema_type',
            operator: 'is',
            value: 'MOBILE_AD_ID_SHA256'
          }
        ]
      }
    },
    advertising_id: {
      label: 'Mobile Advertising ID',
      description:
        "User's mobile advertising ID. Ensure you have included either 'ios.idfa' or 'android.idfa' as identifiers in the 'Customized Setup' menu when connecting the destination to your audience.",
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.properties["ios.idfa"]' },
          then: { '@path': '$.properties["ios.idfa"]' },
          else: { '@path': '$.properties["android.idfa"]' }
        }
      },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'schema_type',
            operator: 'is',
            value: 'MOBILE_AD_ID_SHA256'
          },
          {
            fieldKey: 'mobile_id_type',
            operator: 'is',
            value: 'advertisingId'
          }
        ]
      }
    },
    mobile_device_id: {
      label: 'Mobile Device ID',
      description:
        "User's mobile device ID. Ensure you have included either 'ios.id' or 'android.id' as identifiers in the 'Customized Setup' menu when connecting the destination to your audience.",
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.properties["ios.id"]' },
          then: { '@path': '$.properties["ios.id"]' },
          else: { '@path': '$.properties["android.id"]' }
        }
      },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'schema_type',
            operator: 'is',
            value: 'MOBILE_AD_ID_SHA256'
          },
          {
            fieldKey: 'mobile_id_type',
            operator: 'is',
            value: 'deviceId'
          }
        ]
      }
    }
  },
  perform: async (request, { payload }) => {
    const { external_audience_id, schema_type } = payload
    const response = validateAndExtractIdentifier(
      payload.schema_type,
      payload.mobile_id_type,
      payload.email,
      payload.phone,
      payload.advertising_id,
      payload.mobile_device_id
    )
    if (!response.found) return new PayloadValidationError(response.message)
    const { externalId } = response

    return request(`https://adsapi.snapchat.com/v1/segments/${external_audience_id}/users`, {
      method: 'post',
      json: {
        data: {
          users: [
            {
              schema: [`${schema_type}`],
              data: [[`${externalId}`]]
            }
          ]
        }
      }
    })
  }
}

export default action
