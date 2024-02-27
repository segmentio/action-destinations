import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('FacebookCustomAudiences.add', () => {
  it('is magic', () => {
    expect(testDestination).toBe(testDestination)
  })
})
