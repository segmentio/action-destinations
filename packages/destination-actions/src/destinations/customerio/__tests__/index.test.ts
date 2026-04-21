import destination from '../index'

describe('customerio presets', () => {
  it('includes the generic automatic lifecycle presets', () => {
    const automaticPresetNames = destination.presets
      ?.filter((preset) => preset.type === 'automatic')
      .map((preset) => preset.name)

    expect(automaticPresetNames).toEqual(
      expect.arrayContaining([
        'Delete Device',
        'Delete Relationship',
        'Delete Person',
        'Delete Object',
        'Merge People',
        'Suppress Person',
        'Unsuppress Person'
      ])
    )
  })

  it('includes Device Created or Updated in the create/update device subscriptions', () => {
    const preset = destination.presets?.find((candidate) => candidate.name === 'Create or Update Device')

    expect(preset?.subscribe).toContain('Device Created or Updated')
    expect(destination.actions.createUpdateDevice.defaultSubscription).toContain('Device Created or Updated')
  })

  it('excludes reserved device and object events from the generic track event surface', () => {
    const preset = destination.presets?.find((candidate) => candidate.name === 'Track Event')

    expect(preset?.subscribe).toContain('event != "Device Created or Updated"')
    expect(preset?.subscribe).toContain('event != "Device Deleted"')
    expect(destination.actions.trackEvent.defaultSubscription).toContain('event != "Device Created or Updated"')
    expect(destination.actions.trackEvent.defaultSubscription).toContain('event != "Device Deleted"')
    expect(destination.actions.trackEvent.defaultSubscription).toContain('event != "Object Deleted"')
    expect(destination.actions.trackEvent.defaultSubscription).toContain('event != "Report Content Event"')
  })
