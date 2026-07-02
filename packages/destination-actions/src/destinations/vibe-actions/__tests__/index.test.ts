import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)

describe('Vibe (Actions)', () => {
  it('exposes the trackConversionEvent action', () => {
    expect(testDestination.actions.trackConversionEvent).toBeDefined()
  })

  it('requires a pixelId setting', () => {
    const pixelId = Destination.authentication?.fields?.pixelId
    expect(pixelId).toBeDefined()
    expect(pixelId?.required).toBe(true)
  })
})
