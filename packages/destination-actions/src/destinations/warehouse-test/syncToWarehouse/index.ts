import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../fields'
import { Client } from '../client'
import zlib from 'zlib'

async function send(payloads: Payload[], settings: Settings) {
  const fileContent = generateFile(payloads)
  const gzipped = zlib.gzipSync(fileContent)

  // TODO should get these from chamber
  const s3Client = new Client(settings.s3_aws_region, settings.iam_role_arn, settings.iam_external_id)

  await s3Client.uploadS3(settings, gzipped)
}

function generateFile(payloads: Payload[]): Buffer {
  const buffers = payloads.map((payload, index) => {
    const isLastEvent = index === payloads.length - 1
    const event = JSON.stringify(payload.columns)

    return Buffer.from(`${event}${isLastEvent ? '' : '\n'}`)
  })

  return Buffer.concat(buffers)
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync to Warehouse',
  description: 'Syncs Segment event data to your DWH.',
  fields: commonFields,
  perform: async (_, data) => {
    const { payload, settings } = data
    return send([payload], settings)
  },
  performBatch: async (_, data) => {
    const { payload, settings } = data
    return send(payload, settings)
  }
}

export default action
