// import { IntegrationError, RequestClient, RetryableError } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Payload } from './generated-types'
import get from 'lodash/get'

export function parseSections(section: { [key: string]: string }, nestDepth: number) {
  const parseResults: { [key: string]: string } = {}

  if (nestDepth > 10)
    throw new IntegrationError(
      'Event data exceeds nesting depth. Plese use mapping to flatten the data to no more than three levels deep.',
      'NESTING_DEPTH_EXCEEDED',
      400
    )

  try {
    if (section === null) section = { null: '' }

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
    const ie = e as IntegrationError
    if (ie.code === 'NESTING_DEPTH_EXCEEDED')
      throw new IntegrationError(
        'Event data exceeds nesting depth. Use Mapping to flatten data structures to no more than 3 levels deep',
        'NESTING_DEPTH_EXCEEDED',
        400
      )
    else
      throw new IntegrationError(
        `Unexpected Exception while parsing Event payload.\n ${e}`,
        'UNEXPECTED_EVENT_PARSING_EXCEPTION',
        400
      )
  }
  return parseResults
}

export function addUpdateEvents(payload: Payload, uniqRecip: string) {
  //Index Signature type
  let propertiesTraitsKV: { [key: string]: string } = {}

  propertiesTraitsKV = {
    ...propertiesTraitsKV,
    ...{ ['uniqueRecipient']: uniqRecip }
  }

  propertiesTraitsKV = {
    ...propertiesTraitsKV,
    ...{ ['eventSource']: get(payload, 'type', 'Null') + ' Event' }
  }

  //Timestamp
  // "timestamp": "2023-02-07T02:19:23.469Z"`
  propertiesTraitsKV = {
    ...propertiesTraitsKV,
    ...{ ['timestamp']: get(payload, 'timestamp', 'Null') as string }
  }

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

  const getValue = (o: object, part: string) => Object.entries(o).find(([k, _v]) => k.includes(part))?.[1] as string
  const getKey = (o: object, part: string) => Object.entries(o).find(([k, _v]) => k.includes(part))?.[0] as string

  let ak, av

  if (getValue(propertiesTraitsKV, 'computation_class')?.toLowerCase() === 'audience') {
    ak = getValue(propertiesTraitsKV, 'computation_key')
    av = getValue(propertiesTraitsKV, `${ak}`)

    //reduce redundant attributes
    let x = getKey(propertiesTraitsKV, 'computation_class')
    delete propertiesTraitsKV[`${x}`]
    x = getKey(propertiesTraitsKV, 'computation_key')
    delete propertiesTraitsKV[`${x}`]
    delete propertiesTraitsKV[`${ak}`]
  }

  if (getValue(propertiesTraitsKV, 'audience_key')) {
    ak = getValue(propertiesTraitsKV, 'audience_key')
    av = getValue(propertiesTraitsKV, `${ak}`)

    //reduce redundant attributes
    const x = getKey(propertiesTraitsKV, 'audience_key')
    delete propertiesTraitsKV[`${x}`]
    delete propertiesTraitsKV[`${ak}`]
  }

  if (av !== null) {
    if (av) av = 'Audience Entered'
    if (!av) av = 'Audience Exited'

    propertiesTraitsKV = {
      ...propertiesTraitsKV,
      ...{ [`${ak}`]: av } //as { [key: string]: string }
    }
  }

  const l = propertiesTraitsKV.length

  return { propertiesTraitsKV, l }
}
