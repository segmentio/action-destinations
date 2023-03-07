// import { IntegrationError } from '@segment/actions-core'
// import { RequestClient } from '@segment/actions-core'
// import get from 'lodash/get'
// import { Settings } from '../../generated-types'
import nock from 'nock'
import { preChecksAndMaint, getAccessToken, createSegmentEventsTable, checkRTExist } from '../TableMaint_Utilities'

jest.mock('@segment/actions-core')
jest.mock('@segment/actions-core')
jest.mock('lodash/get')
jest.mock('../../generated-types')

const ap = nock('https://api-campaign-us-2.goacoustic.com').post('/xmlapi').reply(200)
ap.isDone

describe('preChecksAndMaint', () => {
  it('should expose a function', () => {
    expect(preChecksAndMaint).toBeDefined()
  })

  it('preChecksAndMaint should return expected output', async () => {
    // const retValue = await preChecksAndMaint(request,settings);
    expect(preChecksAndMaint).toMatchSnapshot()
  })
})
describe('getAccessToken', () => {
  it('should expose a function', () => {
    expect(getAccessToken).toBeDefined()
  })

  it('getAccessToken should return expected output', async () => {
    // const retValue = await getAccessToken(request,settings,auth);
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
  it('should expose a function', () => {
    expect(checkRTExist).toBeDefined()
  })

  it('checkRTExist should return expected output', async () => {
    // const retValue = await checkRTExist(request,settings,auth);
    expect(checkRTExist).toMatchSnapshot()
  })
})
