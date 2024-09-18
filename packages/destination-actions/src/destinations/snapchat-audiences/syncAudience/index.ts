import type { ActionDefinition } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createHash } from 'crypto'

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
    mobile_id_type: {
      label: 'Mobile Identifier Type',
      description: 'Select the type of mobile identifier to use as External ID',
      type: 'string',
      required: true,
      choices: [
        { value: 'none', label: 'Not using Mobile ID' },
        { value: 'ios.id', label: 'iOS Device ID' },
        { value: 'android.id', label: 'Android Device ID' },
        { value: 'advertisingId', label: 'Advertising ID (idfa)' }
      ],
      default: 'none'
    },
    segment_audience_key: {
      label: 'Audience Key',
      description: 'Segment Audience Key',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    traits_or_props: {
      label: 'Segment Profile Traits or Properties',
      description: 'Segment Profile Traits or Properties',
      type: 'object',
      unsafe_hidden: true,
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
        }
      }
    },
    email: {
      label: 'Email',
      description: "User's email address",
      type: 'string',
      format: 'email',
      required: false,
      unsafe_hidden: true,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    }
  },
  perform: async (
    request,
    { payload: { traits_or_props, mobile_id_type, segment_audience_key, email, external_audience_id, schema_type } }
  ) => {
    const response = validateAndExtractIdentifier(schema_type, traits_or_props, mobile_id_type, email)
    if (!response.found) return new PayloadValidationError(response.message)

    const { externalId } = response

    return request(`https://adsapi.snapchat.com/v1/segments/${external_audience_id}/users`, {
      method: 'post',
      json: {
        data: {
          users: [
            {
              schema: [`${schema_type}`],
              data: [['userabc123']] // assuming this is just a placeholder
            }
          ]
        }
      }
    })
  }
}

export default action

type IdentifierResult = { found: true; externalId: string } | { found: false; message: string }

const validateAndExtractIdentifier = (
  schemaType: string,
  traitsOrProps: { [key: string]: any },
  mobileIdType: string,
  email: string | undefined
): IdentifierResult => {
  if (schemaType === 'EMAIL_SHA256') {
    return email ? { found: true, externalId: email } : { found: false, message: 'Email not present in payload' }
  }

  if (schemaType === 'PHONE_SHA256') {
    const phone = traitsOrProps.phone || traitsOrProps.phone_number
    return phone ? { found: true, externalId: phone } : { found: false, message: 'Phone number not present in payload' }
  }

  if (schemaType === 'MOBILE_AD_ID_SHA256') {
    return traitsOrProps[mobileIdType]
      ? { found: true, externalId: traitsOrProps[mobileIdType] }
      : { found: false, message: `${mobileIdType} not present in payload` }
  }

  return { found: false, message: 'Schema type not recognized' }
}


const hash = (value: string | undefined): string | undefined => {
  if (value === undefined) return

  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}

const isHashedEmail = (email: string): boolean => new RegExp(/[0-9abcdef]{64}/gi).test(email)

// checks if email is already hashed
const hashEmailSafe = (email: string | undefined): string | undefined =>
  isHashedEmail(String(email)) ? email : hash(email)
