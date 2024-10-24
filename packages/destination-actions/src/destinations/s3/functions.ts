import { Payload } from './syncToS3/generated-types'
import { Settings } from './generated-types'
import { Client } from './client'
import { RawMapping, ColumnHeader } from './types'
import { IntegrationError } from '@segment/actions-core'

export async function send(payloads: Payload[], settings: Settings, rawMapping: RawMapping) {
  const batchSize = payloads[0] && typeof payloads[0].batch_size === 'number' ? payloads[0].batch_size : 0
  const delimiter = payloads[0]?.delimiter
  const actionColName = payloads[0]?.audience_action_column_name
  const batchColName = payloads[0]?.batch_size_column_name

  const maxBatchSize = 10_000
  if (batchSize > maxBatchSize) {
    throw new IntegrationError(`Batch size cannot exceed ${maxBatchSize}`, 'Invalid Payload', 400)
  }

  const headers: ColumnHeader[] = Object.entries(rawMapping.columns)
    .filter(([_, value]) => value !== '')
    .map(([column]) => {
      return { cleanName: clean(delimiter, column), originalName: column }
    })

  if (actionColName) {
    headers.push({ cleanName: clean(delimiter, actionColName), originalName: actionColName })
  }

  if (batchColName) {
    headers.push({ cleanName: clean(delimiter, batchColName), originalName: batchColName })
  }

  const fileContent = generateFile(payloads, headers, delimiter, actionColName, batchColName)

  const s3Client = new Client(settings.s3_aws_region, settings.iam_role_arn, settings.iam_external_id)

  await s3Client.uploadS3(
    settings,
    fileContent,
    payloads[0]?.filename_prefix ?? '',
    payloads[0]?.s3_aws_folder_name ?? '',
    payloads[0]?.file_extension
  )
}

export function clean(delimiter: string, str?: string) {
  if (!str) {
    return ''
  }
  return delimiter === 'tab' ? str : str.replace(delimiter, '')
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

export function generateFile(
  payloads: Payload[],
  headers: ColumnHeader[],
  delimiter: string,
  actionColName?: string,
  batchColName?: string
): string {
  const rows: string[] = []
  rows.push(`${headers.map((header) => header.cleanName).join(delimiter === 'tab' ? '\t' : delimiter)}\n`)

  payloads.forEach((payload, index) => {
    const isLastRow = index === payloads.length - 1
    const row: string[] = []
    headers.forEach((header) => {
      if (header.originalName === actionColName) {
        processField(row, getAudienceAction(payload))
      } else if (header.originalName === batchColName) {
        processField(row, payloads.length)
      } else {
        processField(row, payload.columns[header.originalName])
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
