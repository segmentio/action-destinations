import {
  IntegrationError,
  OAuth2ClientCredentials,
  RefreshAccessTokenResult,
  RetryableError
} from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { AuthTokens } from '@segment/actions-core/src/destination-kit/parse-settings'

export let eventTableListId = ''
export interface accessResp {
  access_token: string
  token_type: string
  refresh_token: string
  expires_in: number
}
export const authCreds = {
  accessToken: '',
  clientId: '',
  clientSecret: '',
  refreshToken: '',
  refreshTokenUrl: ''
} as OAuth2ClientCredentials

// export interface RefreshAccessTokenResult {
//   /** OAuth2 access token that was recently acquired */
//   accessToken: string
//   /** Provide in case the partner API also updates the refresh token when requesting a fresh access token */
//   refreshToken?: string
// }

// AuthTokens
// accessToken: string
// /** OAuth2 refresh token */
// refreshToken: string
// /** The refresh token url used to get an updated access token. This value is configured in the developer portal. **/
// refreshTokenUrl?: string

// export interface OAuth2ClientCredentials extends AuthTokens {
//   /** Publicly exposed string that is used by the partner API to identify the application, also used to build authorization URLs that are presented to users */
//   clientId: string
//   /** Used to authenticate the identity of the application to the partner API when the application requests to access a user's account, must be kept private between the application and the API. */
//   clientSecret: string
// }

export function getAuthCreds() {
  return authCreds
}

export function getEventTableListId() {
  return eventTableListId
}

export async function getAccessToken(
  request: RequestClient,
  settings: Settings
  //  authCreds: OAuth2ClientCredentials
) {
  authCreds.accessToken = ''
  authCreds.clientId = settings.a_clientId
  authCreds.clientSecret = settings.a_clientSecret
  authCreds.refreshToken = settings.a_refreshToken
  authCreds.refreshTokenUrl = `https://api-campaign-${settings.region}-${settings.pod}.goacoustic.com/oauth/token`

  const requestAToken = await request(authCreds.refreshTokenUrl, {
    //return await request(authCreds.refreshTokenUrl, {
    method: 'POST',
    body: new URLSearchParams({
      refresh_token: authCreds.refreshToken,
      client_id: authCreds.clientId,
      client_secret: authCreds.clientSecret,
      grant_type: 'refresh_token'
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Segment Action (Acoustic Destination) "GetAccessToken"'
    }
  })

  const ratResp = (await requestAToken.data) as accessResp
  authCreds.accessToken = ratResp.access_token

  return { accessToken: authCreds.accessToken, refreshToken: authCreds.refreshToken } as RefreshAccessTokenResult
}

export async function doPOST(
  request: RequestClient,
  settings: Settings,
  auth: AuthTokens,
  body: string,
  action: string
) {
  //When in local dev mode
  if (!auth.accessToken) {
    if (!authCreds.accessToken) {
      const ratr: RefreshAccessTokenResult = await getAccessToken(request, settings)
      auth = {
        accessToken: ratr.accessToken,
        refreshToken: ratr.refreshToken,
        refreshTokenURL: `https://api-campaign-${settings.region}-${settings.pod}.goacoustic.com/XMLAPI`
      } as AuthTokens
    } else auth.accessToken = authCreds.accessToken
  }

  const postResults = await request(`https://api-campaign-${settings.region}-${settings.pod}.goacoustic.com/XMLAPI`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth?.accessToken}`,
      'Content-Type': 'text/xml',
      'user-agent': `Segment Action (Acoustic Destination) ${action}`,
      Connection: 'keep-alive',
      'Accept-Encoding': 'gzip, deflate, br',
      Accept: '*/*'
    },
    body: `${body}`
  })
  const res = await postResults.data

  //check for success, hard fails throw error, soft fails throw retryable error
  let resultTxt = res as string
  if (resultTxt.indexOf('<SUCCESS>FALSE</SUCCESS>') > -1 || resultTxt.indexOf('<SUCCESS>false</SUCCESS>') > -1) {
    const rx = /<FaultString>(.*)<\/FaultString>/gm
    const r = rx.exec(resultTxt) as RegExpExecArray
    if (r.indexOf('max number of concurrent authenticated requests') > -1)
      throw new RetryableError('Currently exceeding Max number of concurrent authenticated requests via API, retrying')
    resultTxt = ''
  }
  return resultTxt
}

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
  if (settings.a_table_list_id != '') {
    const checkDefinedTableId = `
    <Envelope> <Body>
    <GetListMetaData> <LIST_ID>${settings.a_table_list_id}</LIST_ID>
    </GetListMetaData> </Body>
    </Envelope>`

    const respText = (await doPOST(request, settings, auth, checkDefinedTableId, 'CheckDefinedTable')) ?? ''

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
    const getTableList = `<Envelope>
      <Body>
      <GetLists>
      <VISIBILITY>1 </VISIBILITY>
      <LIST_TYPE> 15 </LIST_TYPE>
      <INCLUDE_ALL_LISTS> True </INCLUDE_ALL_LISTS>
      </GetLists>
      </Body>
      </Envelope>`

    const respText = (await doPOST(request, settings, auth, getTableList, 'GetTableList')) ?? ''

    const lists = respText

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
  const createSET = `<Envelope>
    <Body>
      <CreateTable>
        <TABLE_NAME>${settings.a_table_list_name}</TABLE_NAME>
        <COLUMNS>
          <COLUMN>
            <NAME>EmailId</NAME>
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
        <NAME>EventTimestamp</NAME>
        <TYPE>DATE_TIME</TYPE>
        <IS_REQUIRED>TRUE</IS_REQUIRED>
        <KEY_COLUMN>FALSE</KEY_COLUMN>
      </COLUMN>
        </COLUMNS> 
            </CreateTable>  
           </Body> 
         </Envelope>`

  const cset = (await doPOST(request, settings, auth, createSET, 'CreateSegmentEventsTable')) ?? ''

  const rx = /<SUCCESS>TRUE<\/SUCCESS>(?:\s)*<TABLE_ID>(.*)<\/TABLE_ID/gm
  let tid = ''
  if (cset != null) {
    const r = rx.exec(cset)
    if (r) tid = r[1]
  }
  eventTableListId = tid
  return eventTableListId
}
