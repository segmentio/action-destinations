import { RequestClient } from '@segment/actions-core'
import get from 'lodash/get'
import { Settings } from '../generated-types'
import { Payload } from '../receiveEvents/generated-types'

// export function parseSections(section: { [key: string]: string }, parseResults: { [key: string]: string }) {

//   const _t = get(section, 'products.brand', "Null")

//   const sa: string[] = Object.keys(section)

//   sa.length

//   for (const k of Object.keys(section)) {
//     if (typeof section[k] === "object")

//       //   for(const ko of Object.keys(section[k])){

//       // }
//       parseResults[k] = get(section, k, 'Null')

//   }

//   return parseResults
// }

export function parseSections(section: { [key: string]: string }) {
  const parseResults: { [key: string]: string } = {}
  //const s: { [key: string]: string } = section as { [key: string]: string }
  for (const key of Object.keys(section)) {
    if (typeof section[key] === 'object') {
      //const n = section as { [key: string]: string }
      const nested: { [key: string]: string } = parseSections(section[key] as {} as { [key: string]: string })
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
      ...parseSections(payload.traits as { [key: string]: string })
    }
  if (payload.properties)
    propertiesTraitsKV = {
      ...propertiesTraitsKV,
      ...parseSections(payload.properties as { [key: string]: string })
    }
  if (payload.context)
    propertiesTraitsKV = {
      ...propertiesTraitsKV,
      ...parseSections(payload.context as { [key: string]: string })
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
  const pup = await request(`https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com/XMLAPI`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken} `,
      'User-Agent': `Acoustic Segment Events(${i}`,
      'Content-Type': 'text/xml',
      Connection: 'keep-alive',
      'Accept-Encoding': 'gzip, deflate, br',
      Accept: '*/*'
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

  return pup
}
