// import { IntegrationError } from '@segment/actions-core'
// import { RequestClient } from '@segment/actions-core'
// import get from 'lodash/get'
// import { Settings } from '../../generated-types'
import nock from 'nock'
import { preChecksAndMaint, createSegmentEventsTable, checkRTExist } from '../TableMaint_Utilities'

jest.mock('@segment/actions-core')
jest.mock('@segment/actions-core')
jest.mock('lodash/get')
jest.mock('../../generated-types')

const ap = nock('https://api-campaign-us-2.goacoustic.com').post('/XMLAPI').reply(200)
ap.isDone

describe('preChecksAndMaint', () => {
  it('should be present', () => {
    expect(preChecksAndMaint).toBeDefined()
  })

  it('preChecksAndMaint should return expected output', async () => {
    // const retValue = await preChecksAndMaint(request,settings);
    expect(preChecksAndMaint).toMatchSnapshot()
  })
})

describe('getAccessToken', () => {
  it('should be present', () => {
    expect(getAccessToken).toBeDefined()
  })

  it('getAccessToken should match snapshot', async () => {
    // const retValue = await getAccessToken(request,settings,auth);
    const settings = {
      a_pod: '2',
      a_region: 'US'
    }
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: '1d99f8d8-0897-4090-983a-c517cc54032e',
      client_secret: '124bd238-0987-40a2-b8fb-879ddd4d3241',
      'refresh-token': 'rD-7E2r8BynGDaapr13oJV9BxQr20lsYGN9RPkbrtPtAS1'
    })

    nock.recorder.rec()

    const auth = nock(`https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com`, {
      reqheaders: {
        'user-agent': 'Segment (refreshtoken)',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
      .persist()
      .post('/oauth/token') //, body => body.username && body.password
      .query(params)
      .reply(200, {
        access_token: 'aGGePKPaamqWTeDgWvr6jvA1pJR2QsuIcbMU4dmWw__gS1',
        token_type: 'bearer',
        refresh_token: 'rD-7E2r8BynGDaapr13oJV9BxQr20lsYGN9RPkbrtPtAS1',
        expires_in: 4713
      })

    auth.isDone

    expect(getAccessToken).toMatchSnapshot()
  })
})

describe('createSegmentEventsTable', () => {
  it('should expose a function', () => {
    expect(createSegmentEventsTable).toBeDefined()
  })

  it('createSegmentEventsTable should return expected output', async () => {
    // const retValue = await createSegmentEventsTable(request,settings,auth);
    expect(createSegmentEventsTable).toMatchSnapshot()
  })
})

describe('checkRTExist', () => {
  afterAll(nock.restore)
  afterEach(nock.cleanAll)

  it('should expose a function', () => {
    expect(checkRTExist).toBeDefined()
  })

  it('checkRTExist should return expected output', async () => {
    const settings = {
      a_pod: '2',
      a_region: 'US'
    }

    const accessToken = ''

    // nock.recorder.rec()
    nock.back.setMode('record')

    const checkResult = nock(`https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com`, {
      reqheaders: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/xml',
        'user-agent': 'Segment (checkforRT)',
        Connection: 'keep-alive',
        'Accept-Encoding': 'gzip, deflate, br',
        Accept: '*/*'
      }
    })
      .persist()
      .post(
        '/XMLAPI',
        `<Envelope>
      <Body>
      <GetLists>
      <VISIBILITY>1 </VISIBILITY>
      <LIST_TYPE> 15 </LIST_TYPE>
      <INCLUDE_ALL_LISTS> True </INCLUDE_ALL_LISTS>
      </GetLists>
      </Body>
      </Envelope>`
      ) //, body => body.username && body.password
      .reply(200, {})

    checkResult.isDone

    expect(checkRTExist).toMatchSnapshot()
  })
})
