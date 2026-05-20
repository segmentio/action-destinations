import { createHash } from 'crypto'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { Client } from './client'
import { RawMapping, ColumnHeader } from './types'

export async function send(payloads: Payload[], settings: Settings, rawMapping: RawMapping, signal?: AbortSignal) {
  const delimiter = payloads[0]?.delimiter
  const actionColName = payloads[0]?.audience_action_column_name
  const batchColName = payloads[0]?.batch_size_column_name

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

  const columnsToHash = new Map<string, string>()
  for (const entry of payloads[0]?.columns_to_hash ?? []) {
    if (entry.column_name) {
      columnsToHash.set(entry.column_name, entry.hash_algorithm ?? 'sha256')
    }
  }

  const fileContent = generateFile(payloads, headers, delimiter, actionColName, batchColName, columnsToHash)

  const s3Client = new Client(settings.s3_aws_region, settings.iam_role_arn, settings.iam_external_id)

  await s3Client.uploadS3(
    settings,
    fileContent,
    payloads[0]?.filename_prefix ?? '',
    payloads[0]?.s3_aws_folder_name ?? '',
    payloads[0]?.file_extension,
    signal
  )
}

export function clean(delimiter: string, str?: string) {
  if (!str) {
    return ''
  }
  return delimiter === 'tab' ? str : str.replace(delimiter, '')
}

function processField(value: unknown | undefined, hashAlgorithm?: string): string {
  const str =
    value === undefined || value === null
      ? ''
      : typeof value === 'object'
      ? String(JSON.stringify(value))
      : String(value)

  if (hashAlgorithm && str !== '') {
    return encodeString(createHash(hashAlgorithm).update(str).digest('hex'))
  }

  return encodeString(str)
}

export function generateFile(
  payloads: Payload[],
  headers: ColumnHeader[],
  delimiter: string,
  actionColName?: string,
  batchColName?: string,
  columnsToHash: Map<string, string> = new Map()
): Buffer {
  const rows = payloads.map((payload, index) => {
    const isLastRow = index === payloads.length - 1
    const row = headers.map((header): string => {
      if (header.originalName === actionColName) {
        return processField(getAudienceAction(payload))
      }
      if (header.originalName === batchColName) {
        return processField(payloads.length)
      }
      return processField(payload.columns[header.originalName], columnsToHash.get(header.originalName))
    })

    return Buffer.from(`${row.join(delimiter === 'tab' ? '\t' : delimiter)}${isLastRow ? '' : '\n'}`)
  })

  return Buffer.concat([
    Buffer.from(`${headers.map((header) => header.cleanName).join(delimiter === 'tab' ? '\t' : delimiter)}\n`),
    ...rows
  ])
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
