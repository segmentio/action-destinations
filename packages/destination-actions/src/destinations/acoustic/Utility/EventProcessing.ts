//import { get } from 'lodash';
//import get from 'lodash'
import get from 'lodash/get'
//import _ from "lodash"

export function parseSections(section: { [key: string]: string }, parseResults: { [key: string]: string }) {
  //context {}
  //context.page
<<<<<<< HEAD
  //traits
  //traits.firstname        --->  "BillyJoeBob"
  //traits.default_address
  //traits.shipping.default_address.city     ---- >    "London"
  let a,
    b,
    c,
    d = {} as keyof typeof section
  get(section, 'messageid')
  try {
    for (a of Object.keys(section)) {
      if (typeof get(section, `${a}`, 'Null') !== 'object') {
        parseResults[a] = get(section, `${a}`, 'Null')
      } else
        for (b of Object.keys(get(section, `${a}`, 'Null'))) {
          if (typeof get(section, `${a}.${b}`, 'Null') !== 'object') {
            parseResults[b] = get(section, `${a}.${b}`, 'Null')
          } else
            for (c of Object.keys(get(section, `${a}${b}`, 'Null'))) {
              if (typeof get(section, `${a}.${b}.${c}`, 'Null') !== 'object') {
                parseResults[c] = get(section, `${a}.${b}.${c}`, 'Null')
              } else
                for (d of Object.keys(get(section, `${a}${b}${c}`, 'Null'))) {
                  if (typeof get(section, `${a}.${b}.${c}.${d}`, 'Null') !== 'object') {
                    parseResults[d] = get(section, `${a}.${b}.${c}.${d}`, 'Null')
                  }
                }
            }
        }
    }
  } catch (e) {
    console.log(`Section Parsing Exception: \n + \n${a} + \n${b} + \n${c} + \n${d} + \n ${e}`)
  }
  return parseResults
}

export function OLD_getProperties(obj: {}, lookup: string) {
  if (!lookup)
    //return Object.entries(obj)
    return 'Null'

  const properties = lookup.split('.')
  let prop = ''
  let i,
    itLen = 0
  for (i = 0, itLen = properties.length - 1; i < itLen; i++) {
    prop = properties[i]
    const item = obj[prop as keyof typeof obj]
    if (item !== undefined) {
      obj = item
    } else {
      break
    }
=======
  //traits.default_address
  //traits.default_address.city


  // let a = {} as keyof typeof section
  // let b = {} as keyof typeof section
  // let c = {} as keyof typeof section
  // let d = {} as keyof typeof section

  for (a of Object.keys(section)) {
    parseResults[a] = get(section, a, 'Null')

  }

  // try {
  //   for (a of Object.keys(section)) {
  //     if (typeof get(section, `${a}`, 'Null') !== 'object') {
  //       parseResults[a] = get(section, `${a}`, 'Null')
  //     }
  //     else for (b of Object.keys(section[a])) {
  //       if (typeof get(section, `${a}.${b}`, 'Null') !== 'object') {
  //         parseResults[b] = get(section, `${a}.${b}`, 'Null')
  //       }
  //       else for (c of Object.keys(section[a][b])) {
  //         if (typeof get(section, `${a}.${b}.${c}`, 'Null') !== 'object') {
  //           parseResults[c] = get(section, `${a}.${b}.${c}`, 'Null')
  //         }
  //         else for (d of Object.keys(section[a][b][c])) {
  //           if (typeof section[a][b][c][d] !== 'object') {
  //             parseResults[d] = get(section, `${a}.${b}.${c}.${d}`, 'Null')
  //           }
  //         }
  //       }
  //     }
  //   }
  // } catch (e) {
  //   console.log(`Section Parsing Exception: \n + \n${a} + \n${b} + \n${c} + \n${d} + \n ${e}`)
  // }

  return parseResults
}



export const addUpdateEvents = async (request: RequestClient, payload: Payload, settings: Settings, email: string, auth: acousticAuth): Promise<Response> => {

  let eventName = ""
  let eventValue = ""
  let xmlRows = ""

  //Event Source
  const eventSource = get(payload, "type", 'Null') + " Event"

  //Timestamp    
  // const t = `"timestamp": "2023-02-07T02:19:23.469Z"`
  const timestamp = get(payload, "timestamp", 'Null')

  //Audience
  if (get(payload, "context.personas.computation_class", 'Null') === "audience") {
    const ak = get(payload, "context.personas.computation_key", 'Null')

    //const av = `traits.${ak}`
    const av = `properties.${ak}`

    const audiStatus = get(payload, av, 'Null')
    if (audiStatus) eventValue = "Audience Entered"
    if (!audiStatus) eventValue = "Audience Exited"
    eventName = ak

    xmlRows += `  
      <ROW>
      <COLUMN name="EMAIL">           <![CDATA[${email}]]></COLUMN>
      <COLUMN name="EventSource">     <![CDATA[${eventSource}]]></COLUMN>  
      <COLUMN name="EventName">       <![CDATA[${eventName}]]></COLUMN>
      <COLUMN name="EventValue">      <![CDATA[${eventValue}]]></COLUMN>
      <COLUMN name="Event Timestamp"> <![CDATA[${timestamp}]]></COLUMN>
      </ROW>`
>>>>>>> aec59bef485677c607582f67b54a7958578b41a9
  }

  let propertiesTraitsKV: { [key: string]: string } = {}

  if (payload.traits) propertiesTraitsKV = { ...propertiesTraitsKV, ...parseSections(payload.traits as { [key: string]: string }, propertiesTraitsKV) }
  if (payload.properties) propertiesTraitsKV = { ...propertiesTraitsKV, ...parseSections(payload.properties as { [key: string]: string }, propertiesTraitsKV) }
  if (payload.context) propertiesTraitsKV = { ...propertiesTraitsKV, ...parseSections(payload.context as { [key: string]: string }, propertiesTraitsKV) }


  //Properties and Traits
  for (const e in propertiesTraitsKV) {
    const eventName = e
    const eventValue = propertiesTraitsKV[e]

    console.log(`Processed: ${eventName} : ${eventValue}`)

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
      'Accept': '*/*',
      'Content-Type': 'text/xml',
      'authorization': `Bearer ${auth.accessToken} `,
      'Connection': 'keep-alive'
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

<<<<<<< HEAD
// export function parseResponse(res: any) {
//   return res.access_token as string
// }
=======
>>>>>>> aec59bef485677c607582f67b54a7958578b41a9
