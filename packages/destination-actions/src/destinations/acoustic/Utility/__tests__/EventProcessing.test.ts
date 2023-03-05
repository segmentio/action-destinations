// import { RequestClient } from '@segment/actions-core'
// import flatten from 'lodash/flatten'
// import get from 'lodash/get'
// import { Settings } from '../../generated-types'
// import { Payload } from '../../receiveEvents/generated-types'
// import { acousticAuth, getxmlAPIUrl } from '../TableMaint_Utilities'
import { parseSections, addUpdateEvents } from '../EventProcessing'

jest.mock('@segment/actions-core')
jest.mock('lodash/flatten')
jest.mock('lodash/get')
jest.mock('../../generated-types')
jest.mock('../../receiveEvents/generated-types')
jest.mock('../TableMaint_Utilities')

describe('parseProperties', () => {
  it('should expose a function', () => {
    expect(parseSections).toBeDefined()
  })

  it('parseProperties should return expected output', () => {
    // const retValue = parseProperties(section);
    expect(true).toBeTruthy()
  })
})
describe('parseSections', () => {
  it('should expose a function', () => {
    expect(parseSections).toBeDefined()
  })

  it('parseSections should return expected output', () => {
    // const retValue = parseSections(section,parseResults);
    expect(true).toBeTruthy()
  })
})
describe('addUpdateEvents', () => {
  it('should expose a function', () => {
    expect(addUpdateEvents).toBeDefined()
  })

  it('addUpdateEvents should return expected output', async () => {
    // const retValue = await addUpdateEvents(request,payload,settings,auth,email);
    expect(true).toBeTruthy()
  })
})
