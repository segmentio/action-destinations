import { RequestClient } from '@segment/actions-core'
import get from 'lodash/get'
import { Settings } from '../generated-types'
import { Payload } from '../receiveEvents/generated-types'
import { getxmlAPIUrl } from './TableMaint_Utilities'

export function parseSections(section: { [key: string]: string }, parseResults: { [key: string]: string }) {
  get(section, 'messageid')
  for (const k of Object.keys(section)) {
    parseResults[k] = get(section, k, 'Null')
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
  // const t = `"timestamp": "2023-02-07T02:19:23.469Z"`
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
      ...parseSections(payload.traits as { [key: string]: string }, propertiesTraitsKV)
    }
  if (payload.properties)
    propertiesTraitsKV = {
      ...propertiesTraitsKV,
      ...parseSections(payload.properties as { [key: string]: string }, propertiesTraitsKV)
    }
  if (payload.context)
    propertiesTraitsKV = {
      ...propertiesTraitsKV,
      ...parseSections(payload.context as { [key: string]: string }, propertiesTraitsKV)
    }

  //Properties and Traits
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
  accessToken: string,
  xmlRows: string,
  i: number
): Promise<Response> => {
  return await request(getxmlAPIUrl(settings), {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml',
      authorization: `Bearer ${accessToken} `,
      'User-Agent': `Silverpop Updates Sent(${i}`
    },
    body: `<Envelope>
    <Body>
      <InsertUpdateRelationalTable>
      <TABLE_ID>${settings.a_events_table_list_id} </TABLE_ID>
        <ROWS>
                  ${xmlRows}
        </ROWS>
      </InsertUpdateRelationalTable>
    </Body>
  </Envelope>`
  })
}
