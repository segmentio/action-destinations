import { uploadSFTP } from './client'
import { Settings } from './generated-types'
import { Payload } from './syncToSFTP/generated-types'
import { ColumnHeader, RawMapping } from './types'

async function send(payloads: Payload[], settings: Settings, rawMapping: RawMapping) {
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

  const fileContent = generateFile(payloads, headers, delimiter, actionColName, batchColName)
  const { filename_prefix, file_extension, sftp_folder_path } = payloads[0]
  const filename = createFilename(filename_prefix, file_extension)

  return uploadSFTP(settings, sftp_folder_path, filename, fileContent)
}

function clean(delimiter: string, str = '') {
  return delimiter === 'tab' ? str : str.replace(delimiter, '')
}

/**
 * Creates a filename based on the payload's filename prefix and timestamp suffix.
 */
function createFilename(filename_prefix: string, file_extension: string): string {
  const dateSuffix = new Date().toISOString().replace(/[:.]/g, '-')

  switch (true) {
    case filename_prefix.endsWith(`.${file_extension}`):
      return filename_prefix.replace(`.${file_extension}`, `__${dateSuffix}.${file_extension}`)
    case filename_prefix !== '':
      return `${filename_prefix}__${dateSuffix}.${file_extension}`
    default:
      return `${dateSuffix}.${file_extension}`
  }
}

/*
Generates the SFTP upload file with same pattern as S3 destination
*/
function generateFile(
  payloads: Payload[],
  headers: ColumnHeader[],
  delimiter: string,
  actionColName?: string,
  batchColName?: string
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
      return processField(payload.columns[header.originalName])
    })

    return Buffer.from(`${row.join(delimiter === 'tab' ? '\t' : delimiter)}${isLastRow ? '' : '\n'}`)
  })

  return Buffer.concat([
    Buffer.from(`${headers.map((header) => header.cleanName).join(delimiter === 'tab' ? '\t' : delimiter)}\n`),
    ...rows
  ])
}

function processField(value: unknown | undefined): string {
  return enquoteIdentifier(
    value === undefined || value === null
      ? ''
      : typeof value === 'object'
      ? String(JSON.stringify(value))
      : String(value)
  )
}

function getAudienceAction(payload: Payload): boolean | undefined {
  if (!payload.traits_or_props || !payload.computation_key) {
    return undefined
  }

  return (payload?.traits_or_props as Record<string, boolean> | undefined)?.[payload.computation_key] ?? undefined
}

/*
  To avoid collision with delimeters, we should surround identifiers with quotation marks.
  
  Examples:
  LCD TV -> "LCD TV"
  LCD TV,50" -> "LCD TV,50"""
*/
function enquoteIdentifier(identifier: string) {
  return `"${String(identifier).replace(/"/g, '""')}"`
}

export { clean, createFilename, enquoteIdentifier, generateFile, getAudienceAction, processField, send }
