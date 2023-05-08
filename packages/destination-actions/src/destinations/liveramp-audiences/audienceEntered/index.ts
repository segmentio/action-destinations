import { ActionDefinition, InvalidAuthenticationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import generateS3RequestOptions from '../../../lib/AWS/s3'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Audience Entered',
  description: '',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    audience_key: {
      label: 'Audience Key',
      description: 'Identifies the user within the target audience.',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    },
    identifier_data: {
      label: 'Identifier Data',
      description: `Additional information pertaining to the user.`,
      type: 'object',
      required: false,
      defaultObjectUI: 'object',
      default: { '@path': '$.context.traits' }
    },
    delimiter: {
      label: 'Delimeter',
      description: `Character used to separate tokens in the resulting file.`,
      type: 'string',
      required: true,
      default: ','
    },
    audience_name: {
      label: 'Audience name',
      description: `Name of the audience the user has entered.`,
      type: 'string',
      required: true,
      default: { '@path': '$.properties.audience_key' }
    }
  },
  perform: async (request, { settings, payload }) => {
    // TODO: validate
    // if (settings.upload_mode == 'S3') {
    //   if (!settings.s3_aws_access_key) {
    //     throw new InvalidAuthenticationError('Selected S3 upload mode, but missing AWS Access Key')
    //   }
    // } else if (settings.upload_mode == 'SFTP') {
    //   if (!settings.sftp_password) {
    //     throw new InvalidAuthenticationError('Selected SFTP upload mode, but missing password')
    //   }
    // } else {
    //   throw new PayloadValidationError(`Unrecognized upload mode: ${settings.upload_mode}`)
    // }

    // TODO: format
    // escape delimeters

    // row format: liveramp_audience_key,[identifier_data],segment_audience_name
    const headers = ['audience_key']
    const rows = []
    if (payload.identifier_data) {
      for (const identifier of Object.getOwnPropertyNames(payload.identifier_data)) {
        headers.push(identifier)
      }
    }
    rows.push(headers.join(payload.delimiter))

    const row = []
    row.push(payload.audience_key)
    if (payload.identifier_data) {
      for (const identifier of Object.getOwnPropertyNames(payload.identifier_data)) {
        row.push(payload.identifier_data[identifier] as string)
      }
    }
    rows.push(row.join(payload.delimiter))
    const fileContent = rows.join('\n')

    // TODO: handle multiple emails
    const method = 'PUT'
    const opts = await generateS3RequestOptions(
      'rhall-test-bucket',
      'us-west-2',
      '/my_audience.csv',
      method,
      fileContent,
      settings.s3_aws_access_key,
      settings.s3_aws_secret_key
    )
    if (!opts.headers || !opts.method || !opts.host || !opts.path) {
      throw new InvalidAuthenticationError('Unable to generate signature header for AWS S3 request.')
    }
    // upload
    return await request(`https://${opts.host}${opts.path}`, {
      headers: opts.headers as Record<string, string>,
      method,
      body: opts.body
    })
  }
}

export default action
