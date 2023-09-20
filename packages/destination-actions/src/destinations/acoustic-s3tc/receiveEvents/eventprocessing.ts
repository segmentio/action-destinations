// import { IntegrationError, RequestClient, RetryableError } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Payload } from './generated-types'
import get from 'lodash/get'

export function parseSections(section: { [key: string]: string }, nestDepth: number) {
  const parseResults: { [key: string]: string } = {}
  try {
    if (nestDepth > 10)
      throw new IntegrationError(
        'Event data exceeds nesting depth. Use Mapping to avoid nesting data attributes more than 10 levels deep',
        'NESTING_DEPTH_EXCEEDED',
        400
      )

    for (const key of Object.keys(section)) {
      if (typeof section[key] === 'object') {
        nestDepth++
        const nested: { [key: string]: string } = parseSections(
          section[key] as {} as { [key: string]: string },
          nestDepth
        )
        for (const nestedKey of Object.keys(nested)) {
          parseResults[`${key}.${nestedKey}`] = nested[nestedKey]
        }
      } else {
        parseResults[key] = section[key]
      }
    }
  } catch (e) {
    throw new IntegrationError(
      `Unexpected Exception while parsing Event payload.\n ${e}`,
      'UNEXPECTED_EVENT_PARSING_EXCEPTION',
      400
    )
  }
  return parseResults
}

export function addUpdateEvents(payload: Payload, email: string) {
  let eventName = ''
  let eventValue = ''
  //Header
  let csvRows = 'EMAIL, EventSource, EventName, EventValue, Event Timestamp\n'

  //Event Source
  const eventSource = get(payload, 'type', 'Null') + ' Event'

  //Timestamp
  // "timestamp": "2023-02-07T02:19:23.469Z"`
  const timestamp = get(payload, 'timestamp', 'Null')

  let propertiesTraitsKV: { [key: string]: string } = {}
  try {
    if (payload.key_value_pairs)
      propertiesTraitsKV = {
        ...propertiesTraitsKV,
        ...parseSections(payload.key_value_pairs as { [key: string]: string }, 0)
      }

    if (payload.array_data)
      propertiesTraitsKV = {
        ...propertiesTraitsKV,
        ...parseSections(payload.array_data as unknown as { [key: string]: string }, 0)
      }

    if (payload.traits)
      propertiesTraitsKV = {
        ...propertiesTraitsKV,
        ...parseSections(payload.traits as { [key: string]: string }, 0)
      }
    if (payload.properties)
      propertiesTraitsKV = {
        ...propertiesTraitsKV,
        ...parseSections(payload.properties as { [key: string]: string }, 0)
      }
    if (payload.context)
      propertiesTraitsKV = {
        ...propertiesTraitsKV,
        ...parseSections(payload.context as { [key: string]: string }, 0)
      }
  } catch (e) {
    throw new IntegrationError(
      'Unexpected Exception processing payload \n ${e}',
      'UNEXPECTED_EXCEPTION_PROCESSING_PAYLOAD',
      400
    )
  }

  let ak = ''
  let av = ''

  const getValue = (o: object, part: string) => Object.entries(o).find(([k, _v]) => k.includes(part))?.[1] as string
  const getKey = (o: object, part: string) => Object.entries(o).find(([k, _v]) => k.includes(part))?.[0] as string

  if (getValue(propertiesTraitsKV, 'computation_class')?.toLowerCase() === 'audience') {
    ak = getValue(propertiesTraitsKV, 'computation_key')
    av = getValue(propertiesTraitsKV, `${ak}`)

    //Clean out already parsed attributes, reduce redundant attributes
    let x = getKey(propertiesTraitsKV, 'computation_class')
    delete propertiesTraitsKV[`${x}`]
    x = getKey(propertiesTraitsKV, 'computation_key')
    delete propertiesTraitsKV[`${x}`]
    delete propertiesTraitsKV[`${ak}`]
  }

  if (getValue(propertiesTraitsKV, 'audience_key')) {
    ak = getValue(propertiesTraitsKV, 'audience_key')
    av = getValue(propertiesTraitsKV, `${ak}`)

    //Clean out already parsed attributes, reduce redundant attributes
    const x = getKey(propertiesTraitsKV, 'audience_key')
    delete propertiesTraitsKV[`${x}`]
    delete propertiesTraitsKV[`${ak}`]
  }

  if (av !== '') {
    let audiStatus = av

    eventValue = audiStatus
    audiStatus = audiStatus.toString().toLowerCase()
    if (audiStatus === 'true') eventValue = 'Audience Entered'
    if (audiStatus === 'false') eventValue = 'Audience Exited'

    eventName = ak

    //Initial Row
    csvRows += `${email}, ${eventSource}, ${eventName}, ${eventValue}, ${timestamp}\n`
  }

  //Add the rest of the CSV rows
  for (const e in propertiesTraitsKV) {
    const eventName = e
    const eventValue = propertiesTraitsKV[e]

    csvRows += `${email}, ${eventSource}, ${eventName}, ${eventValue}, ${timestamp}\n`
  }
  return csvRows
}
