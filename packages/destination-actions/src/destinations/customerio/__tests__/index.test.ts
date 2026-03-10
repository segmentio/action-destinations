import customerioDestination from '../index'

describe('customerio presets', () => {
  it('includes the generic reserved-event presets exposed in our fork', () => {
    const presets = customerioDestination.presets ?? []
    const presetsByName = Object.fromEntries(presets.map((preset) => [preset.name, preset]))

    expect(presetsByName['Create or Update Device']).toMatchObject({
      partnerAction: 'createUpdateDevice',
      type: 'automatic'
    })
    expect(presetsByName['Delete Device']).toMatchObject({
      partnerAction: 'deleteDevice',
      type: 'automatic'
    })
    expect(presetsByName['Merge People']).toMatchObject({
      partnerAction: 'mergePeople',
      type: 'automatic'
    })
    expect(presetsByName['Suppress Person']).toMatchObject({
      partnerAction: 'suppressPerson',
      type: 'automatic'
    })
  })
})
