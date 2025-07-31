import { ErrorCodes, JSONLikeObject, MultiStatusResponse } from '@segment/actions-core'
import { uploadSFTP } from './client'
import { Settings } from './generated-types'
import { Payload } from './syncEvents/generated-types'
import { ColumnHeader, RawMapping } from './types'

async function send(payloads: Payload[], settings: Settings, rawMapping: RawMapping) {
  const {
    delimiter,
    audience_action_column_name,
    batch_size_column_name,
    filename_prefix,
    file_extension,
    sftp_folder_path
  } = payloads[0]

  const headers: ColumnHeader[] = createHeaders(
    rawMapping,
    delimiter,
    audience_action_column_name,
    batch_size_column_name
  )

  const fileContent = generateFile(payloads, headers, delimiter, audience_action_column_name, batch_size_column_name)
  const filename = createFilename(filename_prefix, file_extension)

  const msResponse = new MultiStatusResponse()
  try {
    await uploadSFTP(settings, sftp_folder_path, filename, fileContent)
    // Set success response for each payload
    payloads.forEach((payload, index) => {
      msResponse.setSuccessResponseAtIndex(index, {
        status: 200,
        sent: payload as unknown as JSONLikeObject, // Ensure payload is sent as JSON-like object
        body: 'Processed successfully'
      })
    })
  } catch (error) {
    payloads.forEach((payload, index) => {
      msResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: ErrorCodes.BAD_REQUEST,
        errormessage: 'Failed to upload file to SFTP',
        sent: payload as unknown as JSONLikeObject, // Ensure payload is sent as JSON-like object
        body: 'Failed to upload file to SFTP'
      })
    })
  }

  return msResponse
}

function clean(delimiter: string, str = '') {
  return delimiter === 'tab' ? str : str.replace(delimiter, '')
}

/**
 * Creates file headers array from raw mapping and optional additional columns
 */
function createHeaders(
  rawMapping: RawMapping,
  delimiter: string,
  audienceActionColumnName?: string,
  batchSizeColumnName?: string
): ColumnHeader[] {
  const createHeader = (columnName: string): ColumnHeader => ({
    cleanName: clean(delimiter, columnName),
    originalName: columnName
  })

  const headers: ColumnHeader[] = []

  // Add mapped columns
  Object.entries(rawMapping.columns)
    .filter(([_, value]) => value !== '')
    .forEach(([column]) => {
      headers.push(createHeader(column))
    })

  // Add optional columns
  if (audienceActionColumnName) headers.push(createHeader(audienceActionColumnName))
  if (batchSizeColumnName) headers.push(createHeader(batchSizeColumnName))

  return headers
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

/**
 * Generates file to be uploaded to SFTP
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
      switch (header.originalName) {
        case actionColName:
          return processField(getAudienceAction(payload))
        case batchColName:
          return processField(payloads.length)
        default:
          return processField(payload.columns[header.originalName])
      }
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

export { clean, createFilename, createHeaders, enquoteIdentifier, generateFile, getAudienceAction, processField, send }
