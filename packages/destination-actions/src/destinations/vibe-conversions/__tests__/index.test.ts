import Destination from '../index'

describe('Vibe Tracking Event', () => {
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
