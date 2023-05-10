import { IntegrationError } from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { AuthTokens } from '@segment/actions-core/src/destination-kit/parse-settings'

export let eventTableListId = ''

export async function preChecksAndMaint(request: RequestClient, settings: Settings, auth: AuthTokens) {
  //check for Segment Events table, if not exist create it
  eventTableListId = await checkRTExist(request, settings, auth)

  if (eventTableListId === '') {
    const crt = await createSegmentEventsTable(request, settings, auth)
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

export async function checkRTExist(request: RequestClient, settings: Settings, auth: AuthTokens) {
  if (settings.a_events_table_list_id != '') {
    const chkListId = await request(
      `https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com/XMLAPI`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth?.accessToken}`,
          'Content-Type': 'text/xml',
          'user-agent': `Segment Action (Acoustic Destination)`,
          Connection: 'keep-alive',
          'Accept-Encoding': 'gzip, deflate, br',
          Accept: '*/*'
        },
        body: `
    <Envelope> <Body>
    <GetListMetaData> <LIST_ID>${settings.a_events_table_list_id}</LIST_ID>
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
          Authorization: `Bearer ${auth?.accessToken}`,
          'Content-Type': 'text/xml',
          'user-agent': `Segment Action (Acoustic Destination)`,
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

export async function createSegmentEventsTable(request: RequestClient, settings: Settings, auth: AuthTokens) {
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
      headers: {
        Authorization: `Bearer ${auth?.accessToken}`,
        'Content-Type': 'text/xml',
        'user-agent': `Segment Action (Acoustic Destination)`,
        Connection: 'keep-alive',
        'Accept-Encoding': 'gzip, deflate, br',
        Accept: '*/*'
      },
      body: createEventsXML
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
