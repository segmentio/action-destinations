import { Payload } from './syncToS3/generated-types'
import { Settings } from './generated-types'
import { Client } from './client'
import { RawMapping } from './types'
import { IntegrationError } from '@segment/actions-core'

export async function send(payloads: Payload[], settings: Settings, rawMapping: RawMapping) {
  const batchSize = payloads[0] && typeof payloads[0].batch_size === 'number' ? payloads[0].batch_size : 0

  if (batchSize > 5000) {
    throw new IntegrationError('Batch size cannot exceed 5000', 'Invalid Payload', 400)
  }

  const headers = Object.keys(rawMapping.columns).map((column) => {
    // return snakeCase(column)
    return column
  })

  const actionColName = payloads[0]?.audience_action_column_name
  const actionColNameSnakeCase = snakeCase(actionColName)
  const batchColName = payloads[0]?.batch_size_column_name
  const batchColNameSnakeCase = snakeCase(batchColName)

  if (actionColNameSnakeCase) {
    headers.push(actionColNameSnakeCase)
  }
  if (batchColNameSnakeCase) {
    headers.push(batchColNameSnakeCase)
  }

  const delimiter = payloads[0]?.delimiter

  const fileContent = generateFile(payloads, headers, delimiter, actionColNameSnakeCase, batchColNameSnakeCase)

  const s3Client = new Client(settings.s3_aws_region, settings.iam_role_arn, settings.iam_external_id)

  await s3Client.uploadS3(
    settings,
    fileContent,
    payloads[0]?.filename_prefix ?? '',
    payloads[0]?.s3_aws_folder_name ?? '',
    payloads[0]?.file_extension
  )
}

export function snakeCase(str?: string) {
  if (!str) {
    return ''
  }
  // Replace each uppercase letter with an underscore followed by the letter (except at the start)
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2') // Add underscore between lowercase and uppercase letters
    .toLowerCase()
}

function processField(row: string[], value: unknown | undefined) {
  row.push(
    encodeString(
      value === undefined || value === null
        ? ''
        : typeof value === 'object'
        ? String(JSON.stringify(value))
        : String(value)
    )
  )
}

function generateFile(
  payloads: Payload[],
  headers: string[],
  delimiter: string,
  actionColName?: string,
  batchColName?: string
): string {
  const rows: string[] = []
  rows.push(`${headers.join(delimiter === 'tab' ? '\t' : delimiter)}\n`)
  payloads.forEach((payload, index) => {
    const isLastRow = index === payloads.length - 1
    const row: string[] = []

    headers.forEach((header) => {
      if (header === actionColName) {
        processField(row, getAudienceAction(payload))
      } else if (header === batchColName) {
        processField(row, payloads.length)
      } else {
        processField(row, payload.columns[header])
      }
    })

    rows.push(`${row.join(delimiter === 'tab' ? '\t' : delimiter)}${isLastRow ? '' : '\n'}`)
  })

  return rows.join('')
}

export function encodeString(str: string) {
  return `"${String(str).replace(/"/g, '""')}"`
}

export function getAudienceAction(payload: Payload): boolean | undefined {
  if (!payload.traits_or_props || !payload.computation_key) {
    return undefined
  }

  return (payload?.traits_or_props as Record<string, boolean> | undefined)?.[payload.computation_key] ?? undefined
}

export { generateFile }
