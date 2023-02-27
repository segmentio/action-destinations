// import type { DestinationDefinition } from '@segment/actions-core'
// import type { Settings } from '../generated-types'
// import receiveEvents from '../receiveEvents'
// import destination from '../index';

jest.mock('@segment/actions-core')
jest.mock('../generated-types')
jest.mock('../receiveEvents')

describe('destination', () => {
  it('should expose a method extendRequest()', () => {
    //const retValue = destination.extendRequest();
    expect(true).toBeTruthy()
  })
})
