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
