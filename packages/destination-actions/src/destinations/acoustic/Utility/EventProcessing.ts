import { RequestClient } from '@segment/actions-core'
import get from 'lodash/get'
import { Settings } from '../generated-types'
import { Payload } from '../receiveEvents/generated-types'
import { acousticAuth, getxmlAPIUrl } from './TableMaint_Utilities'

export function parseSections(section: { [key: string]: string }, parseResults: { [key: string]: string }) {
  let a,
    b,
    c,
    d = {} as keyof typeof section
  get(section, 'messageid')
  try {
    for (a of Object.keys(section)) {
      if (typeof get(section, `${a}`, 'Null') !== 'object') {
        parseResults[`${a}`] = get(section, `${a}`, 'Null')
      } else
        for (b of Object.keys(get(section, `${a}`, 'Null'))) {
          if (typeof get(section, `${a}.${b}`, 'Null') !== 'object') {
            parseResults[`${a}.${b}`] = get(section, `${a}.${b}`, 'Null')
          } else
            for (c of Object.keys(get(section, `${a}${b}`, 'Null'))) {
              if (typeof get(section, `${a}.${b}.${c}`, 'Null') !== 'object') {
                parseResults[`${a}.${b}.${c}`] = get(section, `${a}.${b}.${c}`, 'Null')
              } else
                for (d of Object.keys(get(section, `${a}${b}${c}`, 'Null'))) {
                  if (typeof get(section, `${a}.${b}.${c}.${d}`, 'Null') !== 'object') {
                    parseResults[`${a}.${b}.${c}.${d}`] = get(section, `${a}.${b}.${c}.${d}`, 'Null')
                  }
                }
            }
        }
    }
  } catch (e) {
    //Need an Audit trail here - core data should not fail silently
    console.log(`Section Parsing Exception: \n + \n${a} + \n${b} + \n${c} + \n${d} + \n ${e}`)
  }
  return parseResults
}

export const addUpdateEvents = async (
  request: RequestClient,
  payload: Payload,
  settings: Settings,
  auth: acousticAuth,
  email: string
): Promise<Response> => {
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

  return await request(getxmlAPIUrl(settings), {
    method: 'POST',
    headers: {
      'Accept-Encoding': 'gzip, deflate, br',
      Accept: '*/*',
      'Content-Type': 'text/xml',
      authorization: `Bearer ${auth.accessToken} `,
      Connection: 'keep-alive'
    },
    body: `<Envelope>
      <Body>
        <InsertUpdateRelationalTable>
        <TABLE_ID>${auth.tableListId} </TABLE_ID>
          <ROWS>
                    ${xmlRows}
          </ROWS>
        </InsertUpdateRelationalTable>
      </Body>
    </Envelope>`
  })
}
