import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import { Settings } from './generated-types'
import receiveEvents from './receiveEvents/index'

const mod = `
Last-Modified: 09.13.2023 12.30.43
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
  name: 'Acoustic S3TC',
  slug: 'actions-acoustic-s3tc',
  mode: 'cloud',
  description: 'Acoustic S3TC - Provide Segment Track and Identify Event Data to Acoustic Connect',
  authentication: {
    scheme: 'custom',
    fields: {
      fileNamePrefix: {
        label: 'Customer Prefix',
        description: `Use your Org name but replace any spaces with an underscore, eg., AcmeCustomer_Prod`,
        type: 'string',
        required: true,
        default: 'customer_org_'
      },
      // s3_access_key: {
      //   label: 'S3 Access Key',
      //   description: 'Write permission to the S3 bucket.',
      //   type: 'string'
      // },
      // s3_secret: {
      //   label: 'S3 Secret',
      //   description: 'Write permission to the S3 bucket.',
      //   type: 'password'
      // },
      s3_bucket_access: {
        label: 'S3 Bucket Access Point',
        description: 'The Access Point created for your access to the S3 Bucket.',
        default: 's3://arn:aws:s3:us-east-1:777957353822:accesspoint/tricklercache-access',
        type: 'string'
      },
      s3_region: {
        label: 'S3 Region',
        description: 'Should always be us-east-1 unless directed by Acoustic otherwise. ',
        default: 'us-east-1',
        type: 'string'
      },
      version: {
        label: `Version:`,
        description: `\n${mod}\n`,
        default: 'Version 2.3',
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
