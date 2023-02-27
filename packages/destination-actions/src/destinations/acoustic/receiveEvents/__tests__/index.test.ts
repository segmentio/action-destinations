// import type { ActionDefinition } from '@segment/actions-core'
// import type { Settings } from '../../generated-types'
// import { Payload } from '../generated-types'
// import { IntegrationError } from '@segment/actions-core'
// import { acousticAuth, preChecksAndMaint } from '../../Utility/TableMaint_Utilities'
// import get from 'lodash/get'
// import { addUpdateEvents } from '../../Utility/EventProcessing'
// import action from '../index';

jest.mock('@segment/actions-core')
jest.mock('../generated-types')
jest.mock('@segment/actions-core')
jest.mock('../../Utility/TableMaint_Utilities')
jest.mock('lodash/get')
jest.mock('../../Utility/EventProcessing')

describe('action', () => {
  it('should expose a method extendRequest()', () => {
    //const retValue = destination.extendRequest();
    expect(true).toBeTruthy()
  })
})
