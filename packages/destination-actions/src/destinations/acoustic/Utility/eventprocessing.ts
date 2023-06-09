import { IntegrationError } from '@segment/actions-core'
import get from 'lodash/get'
import { Payload } from '../receiveEvents/generated-types'

export function parseSections(section: { [key: string]: string }, nestDepth: number) {
  const parseResults: { [key: string]: string } = {}
  try {
    //if (nestDepth > 5) return parseResults
    if (nestDepth > 10)
      throw new IntegrationError(
        'Event data exceeds nesting depth. Use Mapping to avoid nesting data attributes more than 3 levels deep',
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

export function addUpdateEvents(payload: Payload, email: string, limit: number) {
  let eventName = ''
  let eventValue = ''
  let xmlRows = ''

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

    if (Object.keys(propertiesTraitsKV).length > limit) {
      throw new IntegrationError(
        'Properties Exceed Max. Use Mapping to limit the number of Attributes (Properties, Traits) present and thereby reduce the Campaign Relational Table Rows consumed.',
        'EXCEEDS_MAX_PROPERTIES_MAX',
        400
      )
    }
  } catch (e) {
    throw new IntegrationError(
      'Unexpected Exception processing payload \n ${e}',
      'UNEXPECTED_EXCEPTION_PROCESSING_PAYLOAD',
      400
    )
  }

  //Audience
  if (get(payload, 'context.personas.computation_class', 'Null') === 'audience') {
    const ak = get(payload, 'context.personas.computation_key', 'Null')
    const av = `properties.${ak}`
    const audiStatus = get(payload, av, 'Null') as string
    eventValue = audiStatus
    if (audiStatus.includes('true')) eventValue = 'Audience Entered'
    if (audiStatus.includes('false')) eventValue = 'Audience Exited'
    eventName = ak

    xmlRows += `  
      <ROW>
      <COLUMN name="EMAIL">           <![CDATA[${email}]]></COLUMN>
      <COLUMN name="EventSource">     <![CDATA[${eventSource}]]></COLUMN>  
      <COLUMN name="EventName">       <![CDATA[${eventName}]]></COLUMN>
      <COLUMN name="EventValue">      <![CDATA[${eventValue}]]></COLUMN>
      <COLUMN name="Event Timestamp"> <![CDATA[${timestamp}]]></COLUMN>
      </ROW>`
  }

  //Wrap Properties and Traits into XML
  for (const e in propertiesTraitsKV) {
    const eventName = e
    const eventValue = propertiesTraitsKV[e]

    xmlRows += `
     <ROW>
     <COLUMN name="Email">           <![CDATA[${email}]]></COLUMN>
     <COLUMN name="EventSource">     <![CDATA[${eventSource}]]></COLUMN>  
     <COLUMN name="EventName">       <![CDATA[${eventName}]]></COLUMN>
     <COLUMN name="EventValue">      <![CDATA[${eventValue}]]></COLUMN>
     <COLUMN name="Event Timestamp"> <![CDATA[${timestamp}]]></COLUMN>
     </ROW>`
  }
  return xmlRows
}
