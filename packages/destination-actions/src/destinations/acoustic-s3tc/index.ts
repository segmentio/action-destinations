import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import { Settings } from './generated-types'
import receiveEvents from './receiveEvents/index'

const mod = `
Last-Modified: 08.22.2023 09.14.43
`
//August 2023, refactor for S3Cache

/** Used in the quick setup dialog for Mapping */
const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Calls',
    subscribe: 'type = "track"',
    partnerAction: 'receiveEvents',
    mapping: {
      ...defaultValues(receiveEvents.fields),
      email: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    type: 'automatic'
  },
  {
    name: 'Identify Calls',
    subscribe: 'type = "identify"',
    partnerAction: 'receiveEvents',
    mapping: {
      ...defaultValues(receiveEvents.fields),
      email: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    type: 'automatic'
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Acoustic (Actions)',
  slug: 'actions-acoustic',
  mode: 'cloud',
  description: 'Send Segment Track and Identify Event Data to Acoustic Connect',
  authentication: {
    scheme: 'custom',
    fields: {
      fileNamePrefix: {
        label: 'File Name Prefix',
        description: `Prefix to all Stored File Names`,
        type: 'string',
        required: false,
        default: 'customer_org_'
      },
      s3_access_key: {
        label: 'S3 Access Key',
        description: 'Write permission to the S3 bucket.',
        type: 'string'
      },
      s3_secret: {
        label: 'S3 Secret',
        description: 'Write permission to the S3 bucket.',
        type: 'password'
      },
      s3_bucket: {
        label: 'S3 Bucket Access Point',
        description: 'An Access Point created as access to the S3 bucket.',
        default: 's3://arn:aws:s3:us-east-1:777957353822:accesspoint/tricklercache-access',
        type: 'string'
      },
      s3_region: {
        label: 'S3 Region',
        description: 'See S3 definition, should be eg: us-east-1, us-east-2',
        default: 'us-east-1',
        type: 'string'
      },
      version: {
        label: `Version:`,
        description: `\n${mod}\n`,
        default: 'Version 1.7',
        type: 'string',
        required: false
      }
    }
  },
  presets,
  actions: {
    receiveEvents
  }
}
export default destination
