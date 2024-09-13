import { PayloadValidationError } from '@segment/actions-core'
import type { Payload as AudiencePayload } from './syncAudienceToS3/generated-types'
import type { Payload as EventPayload } from './syncEventsToS3/generated-types'
import { Settings } from './generated-types'
import { Client } from './client'
import { propTypes } from './types'

export async function send(payloads: EventPayload[] | AudiencePayload[], settings: Settings) {
  validate(payloads)
  const fileContent = generateFile(payloads)
  const s3Client = new Client(settings.s3_aws_region, settings.iam_role_arn, settings.iam_external_id)
  await s3Client.uploadS3(
    settings,
    fileContent,
    payloads[0]?.filename_prefix ?? '',
    payloads[0]?.s3_aws_folder_name ?? '',
    payloads[0]?.file_extension
  )
}

function processField(
  index: number,
  headers: string[],
  row: string[],
  column_name: string | undefined,
  field: propTypes
) {
  if (![undefined, null, ''].includes(column_name)) {
    if (index === 0) {
      headers.push(column_name as string)
    }
    row.push(
      encodeString(
        field === undefined || field === null
          ? ''
          : typeof field === 'object'
          ? String(JSON.stringify(field))
          : String(field)
      )
    )
  }
}

function generateFile(payloads: EventPayload[] | AudiencePayload[]): string {
  const headers: string[] = []
  const columnHeaders = payloads[0].columns
  const audienceColumnHeaders = (payloads as AudiencePayload[])[0].audienceColumns
  const rows: string[] = []
  const {
    user_id_header,
    anonymous_id_header,
    timestamp_header,
    message_id_header,
    integrations_object_header,
    event_name_header,
    event_type_header,
    all_event_properties_header,
    all_user_traits_header,
    context_header
  } = columnHeaders || {}
  const { audience_name_header, audience_id_header, space_id_header, audience_action_header } =
    audienceColumnHeaders || {}

  payloads.forEach((payload, index, arr) => {
    const row: string[] = []

    const p = payload as AudiencePayload

    const { spaceId, audienceName, audienceId } = p || {}

    let audienceAction = undefined

    if (audienceName !== undefined) {
      if (p?.all_event_properties?.[audienceName] !== undefined) {
        audienceAction = p?.all_event_properties?.[audienceName] as boolean
      } else if (p?.all_user_traits?.[audienceName] !== undefined) {
        audienceAction = p?.all_user_traits?.[audienceName] as boolean
      }
    }

    const {
      userId,
      anonymousId,
      timestamp,
      messageId,
      integrationsObject,
      eventName,
      eventType,
      all_event_properties,
      all_user_traits,
      eventProperties,
      userTraits,
      context
    } = p

    processField(index, headers, row, audience_name_header, audienceName)
    processField(index, headers, row, audience_id_header, audienceId)
    processField(index, headers, row, space_id_header, spaceId)
    processField(index, headers, row, audience_action_header, audienceAction)

    processField(index, headers, row, user_id_header, userId)
    processField(index, headers, row, anonymous_id_header, anonymousId)
    processField(index, headers, row, timestamp_header, timestamp)
    processField(index, headers, row, message_id_header, messageId)
    processField(index, headers, row, integrations_object_header, integrationsObject)
    processField(index, headers, row, event_name_header, eventName)
    processField(index, headers, row, event_type_header, eventType)
    processField(index, headers, row, all_event_properties_header, all_event_properties)
    processField(index, headers, row, all_user_traits_header, all_user_traits)
    processField(index, headers, row, context_header, context)

    if (eventProperties) {
      Object.entries(eventProperties).forEach(([key, headerName]) => {
        const rowValue = (p?.all_event_properties?.[key] as propTypes) ?? undefined
        processField(index, headers, row, headerName as string, rowValue)
      })
    }

    if (userTraits) {
      Object.entries(userTraits).forEach(([key, headerName]) => {
        const rowValue = (p?.all_user_traits?.[key] as propTypes) ?? undefined
        processField(index, headers, row, headerName as string, rowValue)
      })
    }

    const isLastRow = arr.length === index + 1
    const rowString = `${row.join(payload.delimiter === 'tab' ? '\t' : payload.delimiter)}${isLastRow ? '' : '\n'}`

    if (index === 0) {
      const headerString = `${headers.join(payload.delimiter === 'tab' ? '\t' : payload.delimiter)}\n`
      rows.push(headerString)
    }
    rows.push(rowString)
  })

  return rows.join('')
}

function encodeString(str: string) {
  return `"${String(str).replace(/"/g, '""')}"`
}

function validate(payloads: EventPayload[] | AudiencePayload[]) {
  const delimiter = payloads[0].delimiter
  const columns = payloads[0].columns
  const audienceColumns = (payloads as AudiencePayload[])[0].audienceColumns
  const additionalPropertiesColumns = payloads[0].eventProperties
  const additionalTraitsColumns = payloads[0].userTraits

  Object.values(columns).forEach((columnName) => {
    if (columnName.includes(delimiter)) {
      throw new PayloadValidationError(`Column name ${columnName} cannot contain delimiter: ${delimiter}`)
    }
  })

  if (audienceColumns) {
    Object.values(audienceColumns).forEach((columnName) => {
      if (columnName.includes(delimiter)) {
        throw new PayloadValidationError(`Audience Column name ${columnName} cannot contain delimiter: ${delimiter}`)
      }
    })
  }

  if (additionalPropertiesColumns) {
    Object.entries(additionalPropertiesColumns).forEach(([key, value]) => {
      if (typeof value === 'string' && value.includes(delimiter)) {
        throw new PayloadValidationError(`Column name ${key} cannot contain delimiter: ${delimiter}`)
      }
    })
  }

  if (additionalTraitsColumns) {
    Object.entries(additionalTraitsColumns).forEach(([key, value]) => {
      if (typeof value === 'string' && value.includes(delimiter)) {
        throw new PayloadValidationError(`Column name ${key} cannot contain delimiter: ${delimiter}`)
      }
    })
  }
}

export { generateFile, validate }
