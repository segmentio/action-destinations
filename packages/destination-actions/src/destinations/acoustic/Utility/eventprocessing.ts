import { IntegrationError } from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'
import get from 'lodash/get'
import { Settings } from '../generated-types'
import { Payload } from '../receiveEvents/generated-types'
import { accToken, eventTableListId } from './tablemaintutilities'

export function parseSections(section: { [key: string]: string }, nestDepth: number) {
  const parseResults: { [key: string]: string } = {}
  //if (nestDepth > 5) return parseResults
  if (nestDepth > 5)
    throw new IntegrationError(
      'Event data exceeds nesting depth. Restate event data to avoid nesting attributes more than 5 levels deep',
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
  return parseResults
}

export function addUpdateEvents(payload: Payload, email: string) {
  let eventName = ''
  let eventValue = ''
  let xmlRows = ''

  //Event Source
  const eventSource = get(payload, 'type', 'Null') + ' Event'

  //Timestamp
  // "timestamp": "2023-02-07T02:19:23.469Z"`
  const timestamp = get(payload, 'timestamp', 'Null')

  //Audience
  if (get(payload, 'context.personas.computation_class', 'Null') === 'audience') {
    const ak = get(payload, 'context.personas.computation_key', 'Null')
    const av = `properties.${ak}`
    const audiStatus = get(payload, av, 'Null')
    if (audiStatus) eventValue = 'Audience Entered'
    if (!audiStatus) eventValue = 'Audience Exited'
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

  let propertiesTraitsKV: { [key: string]: string } = {}

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

  console.log()

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

export const postUpdates = async (
  request: RequestClient,
  settings: Settings,
  xmlRows: string,
  i: number
): Promise<Response> => {
  const pup = await request(`https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com/XMLAPI`, {
    method: 'POST',
    headers: {
      'user-agent': `Segment Event Table processing ${i}`,
      Authorization: `Bearer ${accToken}`
    },
    body: `<Envelope>
    <Body>
      <InsertUpdateRelationalTable>
      <TABLE_ID>${eventTableListId} </TABLE_ID>
        <ROWS>
                  ${xmlRows}
        </ROWS>
      </InsertUpdateRelationalTable>
    </Body>
  </Envelope>`
  })

  return pup
}
