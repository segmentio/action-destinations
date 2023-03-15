import { IntegrationError, OAuth2ClientCredentials } from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'
import { refreshTokenResult } from '..'
import { Settings } from '../generated-types'

export async function preChecksAndMaint(request: RequestClient, settings: Settings) {
  //const at = await getAccessToken(request, settings, auth)
  //check for Segment Events table, if not exist create it
  await checkRTExist(request, settings)

  if (settings.a_events_table_list_id === '') {
    const crt = await createSegmentEventsTable(request, settings)
    if (!crt) {
      throw new IntegrationError('Error attempting to create the Acoustic Segment Events Table')
    }
  }
  return 'true'
}

export async function createSegmentEventsTable(request: RequestClient, settings: Settings) {
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
      headers: {}
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

export async function checkRTExist(request: RequestClient, settings: Settings) {
  const chkExist = await request(`https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com/XMLAPI`, {
    method: 'POST',
    headers: {},
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
    settings.a_events_table_list_id = '999999999' //Make it obvious - should not be 999999999

    throw new IntegrationError(
      `Cannot determine the Segment Events Table in the defined Acoustic environment. Please check the documentation and confirm the configuration`
    )
  }
}

export async function getAccessToken(request: RequestClient, settings: Settings, auth: OAuth2ClientCredentials) {
  const res = await request<refreshTokenResult>(
    `https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com/oauth/token`,
    {
      method: 'POST',
      body: new URLSearchParams({
        refresh_token: auth.refreshToken,
        client_id: auth.clientId,
        client_secret: auth.clientSecret,
        grant_type: 'refresh_token'
      }),
      headers: {
        'user-agent': 'Segment (refreshtoken)',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )

  return { accessToken: res.data.access_token }
}
