import { IntegrationError } from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { JSONLikeObject } from '@segment/actions-core'

export async function preChecksAndMaint(request: RequestClient, settings: Settings) {
  const aw = await getAccessToken(request, settings)
  const at = aw.access_token as string

  //check for Segment Events table, if not exist create it
  await checkRTExist(request, settings, at)

  if (settings.a_events_table_list_id === '') {
    const crt = await createSegmentEventsTable(request, settings, at)
    if (!crt) {
      throw new IntegrationError('Error attempting to create the Acoustic Segment Events Table')
    }
  }
  return at
}

export async function createSegmentEventsTable(request: RequestClient, settings: Settings, accessToken: string) {
  const createEventsXML = `<Envelope>
    <Body>
      <CreateTable>
        <TABLE_NAME>Segment Events Table</TABLE_NAME>
        <COLUMNS>
          <COLUMN>
            <NAME>Email</NAME>
            <TYPE>EMAIL</TYPE>
            <IS_REQUIRED>true</IS_REQUIRED>
            <KEY_COLUMN>TRUE</KEY_COLUMN>
          </COLUMN>  
          <COLUMN>
            <NAME>EventSource</NAME>
            <TYPE>TEXT</TYPE>
            <IS_REQUIRED>TRUE</IS_REQUIRED>
            <KEY_COLUMN>FALSE</KEY_COLUMN>
          </COLUMN>       
          <COLUMN>
            <NAME>EventName</NAME>
            <TYPE>TEXT</TYPE>
            <IS_REQUIRED>TRUE</IS_REQUIRED>
            <KEY_COLUMN>TRUE</KEY_COLUMN>
          </COLUMN>
          <COLUMN>
            <NAME>EventValue</NAME>
            <TYPE>TEXT</TYPE>
            <IS_REQUIRED>TRUE</IS_REQUIRED>
            <KEY_COLUMN>FALSE</KEY_COLUMN>
        </COLUMN>
          <COLUMN>
        <NAME>Event Timestamp</NAME>
        <TYPE>DATE_TIME</TYPE>
        <IS_REQUIRED>TRUE</IS_REQUIRED>
        <KEY_COLUMN>FALSE</KEY_COLUMN>
      </COLUMN>
        </COLUMNS> 
            </CreateTable>  
           </Body> 
         </Envelope>`

  const createSegmentEventsTable = await request(
    `https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com/xmlapi`,
    {
      method: 'POST',
      body: createEventsXML,
      headers: {
        authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/xml'
      }
    }
  )

  const respText = await createSegmentEventsTable.text()
  const rx = /<SUCCESS>TRUE<\/SUCCESS>(?:\s)*<TABLE_ID>(.*)<\/TABLE_ID/gm
  let tid = ''
  if (respText != null) {
    const r = rx.exec(respText)
    if (r) tid = r[1]
  }

  settings.a_events_table_list_id = tid
  return createSegmentEventsTable
}

export async function checkRTExist(request: RequestClient, settings: Settings, accessToken: string) {
  const chkExist = await request(`https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com/XMLAPI`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'text/xml',
      'user-agent': 'Segment (checkforRT)',
      Connection: 'keep-alive',
      'Accept-Encoding': 'gzip, deflate, br',
      Accept: '*/*'
    },
    body: `<Envelope>
  <Body>
  <GetLists>
  <VISIBILITY>1 </VISIBILITY>
  <LIST_TYPE> 15 </LIST_TYPE>
  <INCLUDE_ALL_LISTS> True </INCLUDE_ALL_LISTS>
  </GetLists>
  </Body>
  </Envelope>`
  })

  await chkExist.data
  const lists = chkExist.content

  if (lists.indexOf('Segment Events Table') > 0) {
    const simplify = lists.substring(
      lists.indexOf('Segment Events Table') - 40,
      lists.indexOf('Segment Events Table') + 40
    )
    const rx = /<ID>(.*)<\/ID>/gm
    const setListId = rx.exec(simplify) ?? '999999999'

    settings.a_events_table_list_id = setListId[1]
  } else {
    settings.a_events_table_list_id = '999999999' //Just in case - should not be 999999999

    throw new IntegrationError(
      `Cannot determine the Segment Events Table in the defined Acoustic environment. Please check the documentation and confirm the configuration`
    )
  }
}

export async function getAccessToken(request: RequestClient, settings: Settings) {
  const res = await request(`https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com/oauth/token`, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: settings.a_client_id,
      client_secret: settings.a_client_secret,
      refresh_token: settings.a_refresh_token,
      grant_type: 'refresh_token'
    }),
    headers: {
      'user-agent': 'Segment (refreshtoken)',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })

  await res.data
  return res.data as JSONLikeObject //{ accessToken: res.data.access_token}
}
