import { IntegrationError } from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'
import { refreshTokenResult } from '..'
import { Settings } from '../generated-types'

export let eventTableListId = ''
export let accToken = ''

export async function getAccessToken(request: RequestClient, settings: Settings) {
  //grant_type:refresh_token
  const clientId = settings?.a_clientId ?? ''
  const clientSecret = settings?.a_clientSecret ?? ''
  const refreshToken = settings?.a_refreshToken ?? ''
  //pod:4

  const res = await request<refreshTokenResult>(
    `https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com/oauth/token`,
    {
      method: 'POST',
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token'
      }),
      headers: {
        'user-agent': `Segment (refreshtoken)`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )

  return { accessToken: res.data.access_token }.accessToken
}

export async function preChecksAndMaint(request: RequestClient, settings: Settings) {
  accToken = await getAccessToken(request, settings)

  //check for Segment Events table, if not exist create it
  eventTableListId = await checkRTExist(request, settings)

  if (eventTableListId === '') {
    const crt = await createSegmentEventsTable(request, settings)
    if (!crt) {
      throw new IntegrationError(
        'Error attempting to create the Acoustic Segment Events Table',
        'CANNOT_CREATE_EVENTS_TABLE',
        400
      )
    }
  }
  return eventTableListId
}

export async function checkRTExist(request: RequestClient, settings: Settings) {
  if (settings.a_events_table_list_id != '') {
    const chkListId = await request(
      `https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com/XMLAPI`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accToken}`
        },
        body: `
    <Envelope> <Body>
    <GetListMetaData> <LIST_ID>59294</LIST_ID>
    </GetListMetaData> </Body>
    </Envelope>`
      }
    )

    const respText = await chkListId.text()
    const rx = /<SUCCESS>TRUE<\/SUCCESS>(?:\s)*<ID>(.*)<\/ID/gm
    if (respText != null) {
      const r = rx.exec(respText)
      if (r) eventTableListId = r[1]
      else
        throw new IntegrationError(
          'Defined Events Table List Id is invalid, please refer to documentation to configure the Segment Events Table in Acoustic',
          'INVALID_LIST_ID',
          400
        )
    }
  } else {
    const chkExist = await request(
      `https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com/XMLAPI`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accToken}`
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
      }
    )

    await chkExist.data
    const lists = chkExist.content

    if (lists.indexOf('Segment Events Table') > 0) {
      const simplify = lists.substring(
        lists.indexOf('Segment Events Table') - 40,
        lists.indexOf('Segment Events Table') + 40
      )
      const rx = /<ID>(.*)<\/ID>/gm
      const setListId = rx.exec(simplify) ?? '999999999'

      eventTableListId = setListId[1]
    } else {
      eventTableListId = '999999999' //Make it obvious - should not be 999999999

      throw new IntegrationError(
        `Cannot determine the Segment Events Table in the defined Acoustic environment. Please check the documentation and confirm the configuration`,
        'CANNOT_DETERMINE_EVENTS_TABLE',
        400
      )
    }
  }
  return eventTableListId
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
      headers: {
        Authorization: `Bearer ${accToken}`
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

  eventTableListId = tid

  return createSegmentEventsTable
}
