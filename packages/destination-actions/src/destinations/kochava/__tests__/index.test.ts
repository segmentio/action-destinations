import Destination from '../index'

describe('Kochava (Actions)', () => {
  it('exposes the expected metadata', () => {
    expect(Destination.name).toBe('Kochava (Actions)')
    expect(Destination.slug).toBe('actions-kochava')
    expect(Destination.mode).toBe('cloud')
  })

  it('registers the event and install actions', () => {
    expect(Object.keys(Destination.actions)).toEqual(expect.arrayContaining(['event', 'install']))
  })

  it('requires the kochava_app_id setting', () => {
    const fields = Destination.authentication?.fields
    expect(fields?.kochava_app_id?.required).toBe(true)
  })

  it('defines presets for both actions', () => {
    const partnerActions = (Destination.presets ?? []).map((p) => p.partnerAction)
    expect(partnerActions).toEqual(expect.arrayContaining(['event', 'install']))
  })
})
