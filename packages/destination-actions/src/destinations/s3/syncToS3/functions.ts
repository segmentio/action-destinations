import { PayloadValidationError } from '@segment/actions-core'
import type { Features, StatsContext } from '@segment/actions-core'
import { processHashing } from '../../../lib/hashing-utils'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { Client } from './client'
import { RawMapping, ColumnHeader, HashAlgorithm, Normalization, ColumnTransform } from './types'
import { S3_HASHING_FEATURE_FLAG } from '../constants'
import { SUPPORTED_HASH_ALGORITHMS, SUPPORTED_NORMALIZATIONS } from './constants'

export async function send(
  payloads: Payload[],
  settings: Settings,
  rawMapping: RawMapping,
  features?: Features,
  statsContext?: StatsContext,
  signal?: AbortSignal
) {
  const delimiter = payloads[0]?.delimiter
  const actionColName = payloads[0]?.audience_action_column_name
  const batchColName = payloads[0]?.batch_size_column_name
  // Opt-in: only an explicit true enables header quoting. Missing/false keeps the legacy header output.
  const sanitizeHeaders = payloads[0]?.sanitize_headers === true

  const headers: ColumnHeader[] = Object.entries(rawMapping.columns)
    .filter(([_, value]) => value !== '')
    .map(([column]) => {
      return { cleanName: clean(delimiter, column, sanitizeHeaders), originalName: column }
    })

  if (actionColName) {
    headers.push({ cleanName: clean(delimiter, actionColName, sanitizeHeaders), originalName: actionColName })
  }

  if (batchColName) {
    headers.push({ cleanName: clean(delimiter, batchColName, sanitizeHeaders), originalName: batchColName })
  }

  const configuredColumnTransforms = payloads[0]?.columns_to_transform ?? []
  const flagEnabled = Boolean(features && features[S3_HASHING_FEATURE_FLAG])

  if (!flagEnabled && configuredColumnTransforms.length > 0) {
    throw new PayloadValidationError(
      'Column hashing and normalization is currently not enabled for your Segment workspace. Remove the columns to hash / normalize or contact Segment by emailing friends@segment.com to enable the feature.'
    )
  }

  const columnTransforms = flagEnabled
    ? resolveColumnTransforms(configuredColumnTransforms, new Set(headers.map((h) => h.originalName)))
    : new Map<string, ColumnTransform>()

  const fileContent = generateFile(
    payloads,
    headers,
    delimiter,
    actionColName,
    batchColName,
    columnTransforms,
    sanitizeHeaders
  )

  const s3Client = new Client(
    settings.s3_aws_region,
    settings.iam_role_arn,
    settings.iam_external_id,
    statsContext,
    features
  )

  await s3Client.uploadS3(
    settings,
    fileContent,
    payloads[0]?.filename_prefix ?? '',
    payloads[0]?.s3_aws_folder_name ?? '',
    payloads[0]?.file_extension,
    signal
  )
}

export function clean(delimiter: string, str?: string, minimalQuoting = false) {
  if (!str) {
    return ''
  }
  // With minimal quoting the name is kept intact; generateFile quotes the header cell when needed.
  if (minimalQuoting) {
    return str
  }
  return delimiter === 'tab' ? str : str.replace(delimiter, '')
}

// Quote a header cell only if it contains the delimiter, a double quote or a line break (RFC 4180 / QUOTE_MINIMAL).
export function quoteHeaderIfNeeded(str: string, delimiter: string): string {
  const delimiterChar = delimiter === 'tab' ? '\t' : delimiter
  const needsQuoting = /["\r\n]/.test(str) || (delimiterChar !== '' && str.includes(delimiterChar))
  return needsQuoting ? encodeString(str) : str
}

export function getNormalizer(normalize?: Normalization): ((value: string) => string) | undefined {
  switch (normalize) {
    case 'lowercase':
      return (value: string) => value.toLowerCase()
    case 'trim':
      return (value: string) => value.trim()
    case 'lowercase_trim':
      return (value: string) => value.trim().toLowerCase()
    default:
      return undefined
  }
}

function processField(value: unknown | undefined, transform?: ColumnTransform): string {
  const str =
    value === undefined || value === null
      ? ''
      : typeof value === 'object'
      ? String(JSON.stringify(value))
      : String(value)

  if (str === '' || !transform) {
    return encodeString(str)
  }

  const normalizer = getNormalizer(transform.normalize)

  if (transform.algorithm) {
    return encodeString(processHashing(str, transform.algorithm, 'hex', normalizer))
  }

  return encodeString(normalizer ? normalizer(str) : str)
}

export function generateFile(
  payloads: Payload[],
  headers: ColumnHeader[],
  delimiter: string,
  actionColName?: string,
  batchColName?: string,
  columnTransforms: Map<string, ColumnTransform> = new Map(),
  sanitizeHeaders = false
): Buffer {
  const joiner = delimiter === 'tab' ? '\t' : delimiter
  const rows = payloads.map((payload, index) => {
    const isLastRow = index === payloads.length - 1
    const row = headers.map((header): string => {
      if (header.originalName === actionColName) {
        return processField(getAudienceAction(payload), columnTransforms.get(header.originalName))
      }
      if (header.originalName === batchColName) {
        return processField(payloads.length, columnTransforms.get(header.originalName))
      }
      return processField(payload.columns[header.originalName], columnTransforms.get(header.originalName))
    })

    return Buffer.from(`${row.join(delimiter === 'tab' ? '\t' : delimiter)}${isLastRow ? '' : '\n'}`)
  })

  return Buffer.concat([
    Buffer.from(
      `${headers
        .map((header) => (sanitizeHeaders ? quoteHeaderIfNeeded(header.cleanName, delimiter) : header.cleanName))
        .join(joiner)}\n`
    ),
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

export function resolveColumnTransforms(
  entries: NonNullable<Payload['columns_to_transform']>,
  validColumnNames: Set<string>
): Map<string, ColumnTransform> {
  const columnTransforms = new Map<string, ColumnTransform>()

  for (const entry of entries) {
    const columnName = String(entry.column_name ?? '').trim()
    const hashAlgorithm = String(entry.hash_algorithm ?? '').trim()
    const normalize = String(entry.normalize ?? 'none').trim() || 'none'

    if (!columnName) {
      throw new PayloadValidationError('columns_to_transform: column_name is required.')
    }

    let algorithm: HashAlgorithm | undefined
    if (hashAlgorithm && hashAlgorithm !== 'none') {
      algorithm = SUPPORTED_HASH_ALGORITHMS.find((a) => a === hashAlgorithm)
      if (!algorithm) {
        throw new PayloadValidationError(
          `columns_to_transform: unsupported hash_algorithm "${hashAlgorithm}". Supported: ${[
            'none',
            ...SUPPORTED_HASH_ALGORITHMS
          ].join(', ')}`
        )
      }
    }

    if (!SUPPORTED_NORMALIZATIONS.includes(normalize as Normalization)) {
      throw new PayloadValidationError(
        `columns_to_transform: unsupported normalize "${normalize}". Supported: ${SUPPORTED_NORMALIZATIONS.join(', ')}`
      )
    }

    if (columnTransforms.has(columnName)) {
      throw new PayloadValidationError(`columns_to_transform: duplicate column_name "${columnName}".`)
    }
    columnTransforms.set(columnName, { algorithm, normalize: normalize as Normalization })
  }

  const invalidColumns = [...columnTransforms.keys()].filter((col) => !validColumnNames.has(col))
  if (invalidColumns.length > 0) {
    throw new PayloadValidationError(
      `columns_to_transform contains columns that do not exist: ${invalidColumns.join(', ')}`
    )
  }

  return columnTransforms
}
