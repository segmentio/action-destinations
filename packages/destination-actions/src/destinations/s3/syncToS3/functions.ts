import { PayloadValidationError } from '@segment/actions-core'
import type { Features } from '@segment/actions-core'
import { processHashing } from '../../../lib/hashing-utils'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { Client } from './client'
import { RawMapping, ColumnHeader, HashAlgorithm } from './types'
import { S3_HASHING_FEATURE_FLAG } from '../constants'

export async function send(
  payloads: Payload[],
  settings: Settings,
  rawMapping: RawMapping,
  features?: Features,
  signal?: AbortSignal
) {
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

  const configuredColumnsToHash = payloads[0]?.columns_to_hash ?? []
  const flagEnabled = Boolean(features && features[S3_HASHING_FEATURE_FLAG])

  if (!flagEnabled && configuredColumnsToHash.length > 0) {
    throw new PayloadValidationError(
      'Column hashing is currently not enabled for your Segment workspace. Remove the columns to hash or contact Segment by emailing friends@segment.com to enable the feature.'
    )
  }

  const columnsToHash = flagEnabled
    ? validateColumnsToHash(configuredColumnsToHash, new Set(headers.map((h) => h.originalName)))
    : new Map<string, HashAlgorithm>()

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

function processField(value: unknown | undefined, hashAlgorithm?: HashAlgorithm): string {
  const str =
    value === undefined || value === null
      ? ''
      : typeof value === 'object'
      ? String(JSON.stringify(value))
      : String(value)

  if (hashAlgorithm && str !== '') {
    return encodeString(processHashing(str, hashAlgorithm, 'hex'))
  }

  return encodeString(str)
}

export function generateFile(
  payloads: Payload[],
  headers: ColumnHeader[],
  delimiter: string,
  actionColName?: string,
  batchColName?: string,
  columnsToHash: Map<string, HashAlgorithm> = new Map()
): Buffer {
  const rows = payloads.map((payload, index) => {
    const isLastRow = index === payloads.length - 1
    const row = headers.map((header): string => {
      if (header.originalName === actionColName) {
        return processField(getAudienceAction(payload), columnsToHash.get(header.originalName))
      }
      if (header.originalName === batchColName) {
        return processField(payloads.length, columnsToHash.get(header.originalName))
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

const SUPPORTED_HASH_ALGORITHMS: HashAlgorithm[] = ['sha256']

export function validateColumnsToHash(
  entries: NonNullable<Payload['columns_to_hash']>,
  validColumnNames: Set<string>
): Map<string, HashAlgorithm> {
  const columnsToHash = new Map<string, HashAlgorithm>()

  for (const entry of entries) {
    const columnName = String(entry.column_name ?? '')
    const hashAlgorithm = String(entry.hash_algorithm ?? '')

    if (!columnName) {
      throw new PayloadValidationError('columns_to_hash: column_name is required.')
    }
    if (!hashAlgorithm) {
      throw new PayloadValidationError('columns_to_hash: hash_algorithm is required.')
    }
    const algorithm = SUPPORTED_HASH_ALGORITHMS.find((a) => a === hashAlgorithm)
    if (!algorithm) {
      throw new PayloadValidationError(
        `columns_to_hash: unsupported hash_algorithm "${hashAlgorithm}". Supported: ${SUPPORTED_HASH_ALGORITHMS.join(
          ', '
        )}`
      )
    }
    if (columnsToHash.has(columnName)) {
      throw new PayloadValidationError(`columns_to_hash: duplicate column_name "${columnName}".`)
    }
    columnsToHash.set(columnName, algorithm)
  }

  const invalidColumns = [...columnsToHash.keys()].filter((col) => !validColumnNames.has(col))
  if (invalidColumns.length > 0) {
    throw new PayloadValidationError(`columns_to_hash contains columns that do not exist: ${invalidColumns.join(', ')}`)
  }

  return columnsToHash
}
