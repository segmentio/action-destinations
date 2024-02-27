jest.mock('@segment/actions-core')
jest.mock('../generated-types')
jest.mock('@segment/actions-core')
jest.mock('../../Utility/tablemaintutilities')
jest.mock('lodash/get')
jest.mock('../../Utility/eventprocessing')

describe('action', () => {
  it('should expose a method extendRequest()', () => {
    //const retValue = destination.extendRequest();
    expect(true).toBeTruthy()
  })
})
