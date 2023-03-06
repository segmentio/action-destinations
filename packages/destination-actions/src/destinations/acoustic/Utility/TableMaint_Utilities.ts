import { IntegrationError } from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { JSONLikeObject } from '@segment/actions-core'

export function getxmlAPIUrl(settings: Settings) {
  const zz = String(settings.a_xmlAPIURL)
  const xx: string = zz.replace('XX', settings.a_region)
  const xmlapi = xx.replace('X', settings.a_pod)
  return xmlapi
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
  // const refreshAuth: RefreshAccessTokenResult = res.data as RefreshAccessTokenResult
  // return refreshAuth
  //return res.data.access_token as string
  return res.data as JSONLikeObject //{ accessToken: res.data.access_token}
}

export async function preChecksAndMaint(request: RequestClient, settings: Settings) {
  const aw = await getAccessToken(request, settings)
  const at = aw.access_token as string

  //Long-term Maintenance
  //For Support to easily reset a Customers Acoustic "Segment Events Table"
  if (!settings.a_deleteCode) settings.a_deleteCode = 0
  if (settings.a_deleteCode > 99999 && settings.a_deleteCode < 100000) {
    const _dtabs = await deleteRTs(request, settings, at)
    _dtabs.length
  }

  //For testing: uncomment to delete the Audiences Table
  //const dtabs = await deleteRTs(request, settings, auth)

  //Long-term Maintenance - check each month to delete data older than 1 years
  const checkPurge = new Date()
  if (
    checkPurge.getDate() == 1 && //First of the Month
    checkPurge.getHours() == 12 && //At Noon
    checkPurge.getMinutes() == 30 && //At half-past Noon
    checkPurge.getSeconds() > 50
  ) {
    //to almost 31 past Noon
    //Worst case we're calling checkPurge for a full 10 seconds repeatedly or missing the time
    //  altogether but we'll get it next month - long-term we're still in good shape
    const purgeDate = new Date()
    purgeDate.setFullYear(purgeDate.getFullYear() - 1)
    await purgeSegmentEventTable(request, settings, at, purgeDate)
  }

  //For Testing -
  // await purgeOldAudience(request, settings, auth, "02/11/2023 11:20:00")

  //check for Segment Events table, if not exist create it
  const chkExist = await checkRTExist(request, settings, at)
  if (!chkExist) {
    //Need audit trail of this - what's Segment equivalent of Logging
    console.log('Acoustic Audiences Table did not exist, creating new ....')

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

  const createSegmentEventsTable = await request(getxmlAPIUrl(settings), {
    method: 'POST',
    body: createEventsXML,
    headers: {
      authorization: `Bearer ${accessToken}`,
      'Content-Type': 'text/xml'
    }
  })

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

export async function deleteRTs(request: RequestClient, settings: Settings, accessToken: string) {
  //Need Audit Trail here - what's Segment equivalent for Audit log?
  //console.log('Delete Audience Table: ')

  const deleteSET = await request(getxmlAPIUrl(settings), {
    method: 'POST',
    body: `<Envelope>
    <Body>
        <DeleteTable>
        <TABLE_NAME>Segment Events Table</TABLE_NAME> 
        <TABLE_VISIBILITY>1</TABLE_VISIBILITY>            
        <RECURSIVE>False</RECURSIVE>
        </DeleteTable>
    </Body>
</Envelope>`,
    headers: {
      authorization: `Bearer ${accessToken}`,
      'Content-Type': 'text/xml'
    }
  })

  const d_SET = await deleteSET.text()

  //Need an Audit Trail of this - what's the Segment equivalent of Logging? Throwing IntegrationError kills
  //console.log('Deleting Audience Table: \n' + d_SET + '\nStatus: Complete ')

  return d_SET
}

export async function checkRTExist(request: RequestClient, settings: Settings, accessToken: string) {
  const checkRT = await request(getxmlAPIUrl(settings), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'Content-Type': 'text/xml'
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

  const lists = await checkRT.text()

  if (lists.indexOf('Segment Events Table') > 0) {
    const simplify = lists.substring(
      lists.indexOf('Segment Events Table') - 40,
      lists.indexOf('Segment Events Table') + 40
    )
    const rx = /<ID>(.*)<\/ID>/gm
    const setListId = rx.exec(simplify) ?? '999999999'

    settings.a_events_table_list_id = setListId[1]
    return true
  } else {
    settings.a_events_table_list_id = '999999999' //Just in case - should not be 999999999

    throw new IntegrationError(
      `Cannot determine the Segment Events Table in the defined Acoustic environment. Please check the documentation and confirm the configuration`
    )
    return false
  }
}

export async function purgeSegmentEventTable(
  request: RequestClient,
  settings: Settings,
  accessToken: string,
  purgeDate: Date
) {
  const purgeOldData = await request(getxmlAPIUrl(settings), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'Content-Type': 'text/xml'
    },
    body: `<Envelope> 
      <Body>
          <PurgeTable>
              <TABLE_NAME>Segment Events Table</TABLE_NAME> 
              <TABLE_VISIBILITY>1</TABLE_VISIBILITY> 
              <DELETE_BEFORE>${purgeDate} 00:00:00</DELETE_BEFORE> 
              <EMAIL>user@silverpop.com</EMAIL>
          </PurgeTable> 
      </Body>
  </Envelope>`
  })

  const outcome = await purgeOldData.text()

  if (outcome.indexOf('SegmentAudiencesTable') > 0) {
    const simplify = outcome.substring(outcome.indexOf('RESULT') - 40, outcome.indexOf('/RESULT') + 40)
    const rx = /<JOB_ID>(.*)<\/JOB_ID>/gm
    const purgeJob = rx.exec(simplify) ?? ''

    //Need Audit trail of this - what is Segment equivalent of logging?
    console.log('Purge Old Audiences Data Job Created: ' + purgeJob)
    return purgeOldData
  } else {
    //Need Audit trail of this - what is Segment equivalent of logging?
    console.log('Could Not Purge Old Audiences from Audiences Table.....')
    return purgeOldData
  }
}
