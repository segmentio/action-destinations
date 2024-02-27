// import { IntegrationError } from '@segment/actions-core'
// import { RequestClient } from '@segment/actions-core'
// import get from 'lodash/get'
// import { Settings } from '../../generated-types'
import nock from 'nock'
import { getAuthCreds, getAccessToken, doPOST } from '../tablemaintutilities'

//import { IntegrationError, OAuth2ClientCredentials, RefreshAccessTokenResult, RetryableError } from '@segment/actions-core'
//import { RequestClient } from '@segment/actions-core'
//import { Settings } from '../generated-types'
//import { AuthTokens } from '@segment/actions-core/src/destination-kit/parse-settings'

jest.mock('@segment/actions-core')
jest.mock('@segment/actions-core')
jest.mock('lodash/get')
jest.mock('@segment/actions-core/destination-kit/parse-settings')
jest.mock('../../generated-types')
//jest.mock('../generated-types');

const accessPoint = nock('https://api-campaign-us-2.goacoustic.com').post('/XMLAPI').reply(200)
accessPoint.isDone

// nock.recorder.rec()
nock.back.setMode('record')

describe('getAuthCreds', () => {
  it('should expose a function', () => {
    expect(getAuthCreds).toBeDefined()
  })

  it('getAuthCreds should return expected output', () => {
    // const retValue = getAuthCreds();
    expect(false) //.toBeTruthy();
  })
})

describe('getAccessToken', () => {
  it('should expose a function', () => {
    expect(getAccessToken).toBeDefined()
  })

  it('getAccessToken should return expected output', async () => {
    // const retValue = await getAccessToken(request,settings);
    expect(false) //.toBeTruthy();
  })
})
describe('doPOST', () => {
  it('should expose a function', () => {
    expect(doPOST).toBeDefined()
  })

  it('doPOST should return expected output', async () => {
    // const retValue = await doPOST(request,settings,auth,body,action);
    expect(false) //.toBeTruthy();
  })
})
