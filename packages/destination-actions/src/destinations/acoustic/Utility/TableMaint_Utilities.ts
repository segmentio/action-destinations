import { IntegrationError } from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'
import get from 'lodash/get'
import { Settings } from '../generated-types'
//import { ModifiedResponse } from "@segment/actions-core"

export interface acousticAuth {
  clientId: string
  clientSecret: string
  refreshToken: string
  accessToken: string
  tableListId: string
}

export function getxmlAPIUrl(settings: Settings) {
  const zz = String(settings.a_xmlAPIURL)
  const xx: string = zz.replace('XX', settings.a_region)
  const xmlapi = xx.replace('X', settings.a_pod)
  return xmlapi
}

export async function preChecksAndMaint(request: RequestClient, settings: Settings) {
  //Get a line-out of the object
  //Object Keys: messageId,timestamp,type,email,properties,userId,event,anonymousId,context,receivedAt,sentAt,version

  // console.log(`Keep an eye on the object -->
  //    \nObject Keys:    ${Object.keys(payload)}
  //    \nObject Values:  ${Object.values(payload)}
  //    \nObject Entries: ${Object.entries(payload)}\n`)

  const auth: acousticAuth = {
    clientId: settings.a_client_id,
    clientSecret: settings.a_client_secret,
    refreshToken: settings.a_refresh_token,
    accessToken: '',
    tableListId: ''
  }

  //Ok, lets process what is coming in,
  //First reach out to the Acoustic environment to confirm connectivity and
  //    might as well get an OAuth2 while we're at it

  if (!auth.accessToken) {
    await getAccessToken(request, settings, auth)
    //auth.accessToken = at.data
  }
  if (!auth.accessToken)
    throw new IntegrationError(
      'Could not acquire an Access Token, check configuration parameters are correct and credenntials have not expired. '
    )

  //Long-term Maintenance
  //For Support to easily reset a Customers Acoustic "Segment Events Table"
  if (!settings.a_deleteCode) settings.a_deleteCode = 0
  if (settings.a_deleteCode > 99999 && settings.a_deleteCode < 100000) {
    const _dtabs = await deleteRTs(request, settings, auth)
    _dtabs.length
  }
  //For testing: uncomment to delete the Audiences Table
  //const dtabs = await deleteRTs(request, settings, auth)

  //For long-term Maintenance - check each month to delete data older than 1 years
  const checkPurge = new Date()
  if (
    checkPurge.getDate() == 1 && //First of the Month
    checkPurge.getHours() == 12 && //At Noon
    checkPurge.getMinutes() == 30 && //At half-past Noon
    checkPurge.getSeconds() > 50
  ) {
    //to almost 31 past Noon

    const purgeDate = new Date()
    purgeDate.setFullYear(purgeDate.getFullYear() - 1)
    await purgeSegmentEventTable(request, settings, auth, purgeDate)
  }
  //Worst case we're calling checkPurge for a full 10 seconds repeatedly or missing the time
  //  altogether but we'll get it next month - long-term we're still in good shape

  //For Testing -
  // await purgeOldAudience(request, settings, auth, "02/11/2023 11:20:00")

  //check for table, if not exist create it
  //if (!auth.tableListId || auth.tableListId === "") {
  //Pull the list and parse it to see if Audience Table is on it,
  const chkExist = await checkRTExist(request, settings, auth)
  if (!chkExist) {
    console.log('Acoustic Audiences Table did not exist, creating new ....')
    const crt = await createSegmentEventsTable(request, settings, auth)
    if (!crt) {
      console.log('Error attempting to create an Acoustic Audiences Table')
      throw new IntegrationError('Error attempting to create an Acoustic Audiences Table')
    }
  }
  return auth
}

export const getAccessToken = async (
  request: RequestClient,
  settings: Settings,
  auth: acousticAuth
): Promise<string> => {
  const res = await request(`https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com/oauth/token`, {
    //await request(`https://api-campaign-US-2.goacoustic.com/oauth/token`, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
      refresh_token: auth.refreshToken,
      grant_type: 'refresh_token'
    }),
    headers: {
      'user-agent': 'Segment (AddUpdateEvents)'
    }
  })

  //return res
  auth.accessToken = get(res.data, 'access_token', '')
  return get(res.data, 'access_token', '')
}

export const createSegmentEventsTable = async (
  request: RequestClient,
  settings: Settings,
  auth: acousticAuth
): Promise<Response> => {
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

  // console.log("Segment RequestBody: \n" + createEventsXML + "\n")

  const createSegmentEventsTable = await request(getxmlAPIUrl(settings), {
    method: 'POST',
    body: createEventsXML,
    headers: {
      authorization: `Bearer ${auth.accessToken.toString()}`
    }
  })

  const respText = await createSegmentEventsTable.text()
  const rx = /<SUCCESS>TRUE<\/SUCCESS>(?:\s)*<TABLE_ID>(.*)<\/TABLE_ID/gm
  let tid = ''
  if (respText != null) {
    const r = rx.exec(respText)
    if (r) tid = r[1]
  }

  auth.tableListId = tid

  console.log('\nCreate Audience Table Response (ListId: ' + auth.tableListId + ')\nResp: ' + respText)

  return createSegmentEventsTable
}

export const deleteRTs = async (request: RequestClient, settings: Settings, auth: acousticAuth): Promise<String> => {
  console.log('Delete Audience Table: ')

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
      authorization: `Bearer ${auth.accessToken.toString()}`
    }
  })

  const d_SET = await deleteSET.text()

  console.log('Deleting Audience Table: \n' + d_SET + '\nStatus: Complete ')

  return ''
}

export const checkRTExist = async (
  request: RequestClient,
  settings: Settings,
  auth: acousticAuth
): Promise<Boolean> => {
  console.log('Check Whether Audiences Table Exists: ')

  const checkRT = await request(getxmlAPIUrl(settings), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${auth.accessToken.toString()}`
    },
    body: `<Envelope>
      <Body>
        <GetLists>
          <VISIBILITY>1</VISIBILITY>
          <LIST_TYPE>15</LIST_TYPE>
          <INCLUDE_ALL_LISTS>True</INCLUDE_ALL_LISTS>
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

    auth.tableListId = setListId[1]

    console.log('CheckRT - Segment Events Table Exists: ' + auth.tableListId)

    return true
  } else {
    auth.tableListId = '999999999' //Just in case - during debugging should not be 999999999
    console.log('Cannot determine Segment Event Table, Does not appear to Exist.')
    throw new IntegrationError(
      `Cannot determine the Segmennt Events Table in the defined Acoustic environment. Please check the documentation and confirm the configuration`
    )
    return false
  }
}

export const purgeSegmentEventTable = async (
  request: RequestClient,
  settings: Settings,
  auth: acousticAuth,
  purgeDate: Date
): Promise<Response> => {
  console.log('Purge Old Eevnts from Segment Event Table...')

  const purgeOldData = await request(getxmlAPIUrl(settings), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${auth.accessToken.toString()}`
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

    console.log('Purge Old Audiences Data Job Created: ' + purgeJob)
    return purgeOldData
  } else {
    console.log('Could Not Purge Old Audiences from Audiences Table.....')
    return purgeOldData
  }
}
