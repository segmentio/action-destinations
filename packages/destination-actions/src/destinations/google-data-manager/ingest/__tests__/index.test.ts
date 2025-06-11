import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('GoogleDataManager.ingest', () => {
  it('should be defined', () => {
    expect(testDestination).toBeDefined()
    expect(testDestination.actions.ingest).toBeDefined()
  })

  it('should call perform without error', async () => {
    const action = testDestination.actions.ingest
    const perform = action.definition.perform
    expect(typeof perform).toBe('function')
    // Since there are no fields, we can call with empty data
    await expect(perform({} as any, { payload: {}, settings: {} } as any)).resolves.toBeUndefined()
  })

  // TODO: Add more tests when the action is implemented
})
