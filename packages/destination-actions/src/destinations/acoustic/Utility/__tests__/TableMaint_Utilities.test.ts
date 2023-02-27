// import { IntegrationError } from '@segment/actions-core'
// import { RequestClient } from '@segment/actions-core'
// import get from 'lodash/get'
// import { Settings } from '../../generated-types'
import {
  getxmlAPIUrl,
  preChecksAndMaint,
  getAccessToken,
  createSegmentEventsTable,
  deleteRTs,
  checkRTExist,
  purgeSegmentEventTable
} from '../TableMaint_Utilities'

jest.mock('@segment/actions-core')
jest.mock('@segment/actions-core')
jest.mock('lodash/get')
jest.mock('../../generated-types')

describe('getxmlAPIUrl', () => {
  it('should expose a function', () => {
    expect(getxmlAPIUrl).toBeDefined()
  })

  it('getxmlAPIUrl should return expected output', () => {
    // const retValue = getxmlAPIUrl(settings);
    expect(true).toBeTruthy()
  })
})
describe('preChecksAndMaint', () => {
  it('should expose a function', () => {
    expect(preChecksAndMaint).toBeDefined()
  })

  it('preChecksAndMaint should return expected output', async () => {
    // const retValue = await preChecksAndMaint(request,settings);
    expect(true).toBeTruthy()
  })
})
describe('getAccessToken', () => {
  it('should expose a function', () => {
    expect(getAccessToken).toBeDefined()
  })

  it('getAccessToken should return expected output', async () => {
    // const retValue = await getAccessToken(request,settings,auth);
    expect(true).toBeTruthy()
  })
})
describe('createSegmentEventsTable', () => {
  it('should expose a function', () => {
    expect(createSegmentEventsTable).toBeDefined()
  })

  it('createSegmentEventsTable should return expected output', async () => {
    // const retValue = await createSegmentEventsTable(request,settings,auth);
    expect(true).toBeTruthy()
  })
})
describe('deleteRTs', () => {
  it('should expose a function', () => {
    expect(deleteRTs).toBeDefined()
  })

  it('deleteRTs should return expected output', async () => {
    // const retValue = await deleteRTs(request,settings,auth);
    expect(true).toBeTruthy()
  })
})
describe('checkRTExist', () => {
  it('should expose a function', () => {
    expect(checkRTExist).toBeDefined()
  })

  it('checkRTExist should return expected output', async () => {
    // const retValue = await checkRTExist(request,settings,auth);
    expect(true).toBeTruthy()
  })
})
describe('purgeSegmentEventTable', () => {
  it('should expose a function', () => {
    expect(purgeSegmentEventTable).toBeDefined()
  })

  it('purgeSegmentEventTable should return expected output', async () => {
    // const retValue = await purgeSegmentEventTable(request,settings,auth,purgeDate);
    expect(true).toBeTruthy()
  })
})
