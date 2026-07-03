import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)

describe('Vibe Tracking Event', () => {
  describe('testAuthentication', () => {
    it('succeeds when a Pixel ID is provided', async () => {
      await expect(testDestination.testAuthentication({ aid: 'pixel_123' })).resolves.not.toThrow()
    })

    it('fails when the Pixel ID is missing', async () => {
      await expect(testDestination.testAuthentication({ aid: '' })).rejects.toThrow()
    })
  })

  it('exposes the expected presets', () => {
    const presets = Destination.presets ?? []
    expect(presets.map((p) => p.name)).toEqual(['Order Completed', 'Page Viewed', 'Signed Up'])

    const orderCompleted = presets.find((p) => p.name === 'Order Completed')
    expect(orderCompleted?.partnerAction).toBe('trackConversion')
    expect((orderCompleted?.mapping as Record<string, unknown>).a).toBe('purchase')

    const pageViewed = presets.find((p) => p.name === 'Page Viewed')
    expect((pageViewed?.mapping as Record<string, unknown>).a).toBe('page_view')
    expect(pageViewed?.subscribe).toBe('type = "page"')

    const signedUp = presets.find((p) => p.name === 'Signed Up')
    expect((signedUp?.mapping as Record<string, unknown>).a).toBe('signup')
  })
})
