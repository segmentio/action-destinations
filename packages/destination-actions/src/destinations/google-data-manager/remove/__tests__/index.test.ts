import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('GoogleDataManager.remove', () => {
  it('should be defined', () => {
    expect(testDestination).toBeDefined()
    expect(testDestination.actions.remove).toBeDefined()
  })

  it('should call perform without error', async () => {
    const action = testDestination.actions.remove
    const perform = action.definition.perform
    expect(typeof perform).toBe('function')
    await expect(perform({} as any, { payload: {}, settings: {} } as any)).resolves.toBeUndefined()
  })

  // TODO: Add more tests when the action is implemented
})
