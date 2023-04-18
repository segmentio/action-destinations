export const dataFile = {
  groups: [],
  environmentKey: 'development',
  rollouts: [
    {
      experiments: [
        {
          status: 'Running',
          audienceIds: [],
          variations: [{ variables: [], id: '21220310307', key: '21220310307', featureEnabled: true }],
          id: '21233300554',
          key: '21233300554',
          layerId: '21215670656',
          trafficAllocation: [],
          forcedVariations: {}
        }
      ],
      id: '21215670656'
    },
    {
      experiments: [
        {
          status: 'Running',
          audienceIds: [],
          variations: [
            {
              variables: [{ id: '22426442683', value: 'false' }],
              id: '22400213631',
              key: '22400213631',
              featureEnabled: true
            }
          ],
          id: '22462131912',
          key: '22462131912',
          layerId: '22457491722',
          trafficAllocation: [],
          forcedVariations: {}
        }
      ],
      id: '22457491722'
    },
    {
      experiments: [
        {
          status: 'Running',
          audienceIds: [],
          variations: [{ variables: [], id: '22473530282', key: '22473530282', featureEnabled: true }],
          id: '22433681563',
          key: '22433681563',
          layerId: '22430001556',
          trafficAllocation: [],
          forcedVariations: {}
        }
      ],
      id: '22430001556'
    }
  ],
  typedAudiences: [],
  projectId: '18269245474',
  variables: [],
  featureFlags: [
    { experimentIds: [], rolloutId: '21215670656', variables: [], id: '21224630246', key: 'test' },
    { experimentIds: [], rolloutId: '22430001556', variables: [], id: '22434471295', key: 'ryan_test' },
    {
      experimentIds: ['22406922845'],
      rolloutId: '22457491722',
      variables: [{ defaultValue: 'false', type: 'boolean', id: '22426442683', key: 'isAction' }],
      id: '22494130853',
      key: 'test_actions'
    }
  ],
  experiments: [
    {
      status: 'Running',
      audienceIds: [],
      variations: [
        {
          variables: [{ id: '22426442683', value: 'false' }],
          id: '22460721615',
          key: 'variation_1',
          featureEnabled: true
        },
        {
          variables: [{ id: '22426442683', value: 'false' }],
          id: '22511660132',
          key: 'variation_2',
          featureEnabled: true
        }
      ],
      id: '22406922845',
      key: 'action-dest-exp',
      layerId: '22414612238',
      trafficAllocation: [
        { entityId: '22460721615', endOfRange: 5000 },
        { entityId: '22511660132', endOfRange: 10000 }
      ],
      forcedVariations: {}
    }
  ],
  version: '4',
  audiences: [
    {
      conditions:
        '["or", {"match": "exact", "name": "$opt_dummy_attribute", "type": "custom_attribute", "value": "$opt_dummy_value"}]',
      id: '$opt_dummy_audience',
      name: 'Optimizely-Generated Audience for Backwards Compatibility'
    }
  ],
  anonymizeIP: true,
  sdkKey: 'QEKyyyZcqZqUbXZHyFruS',
  attributes: [
    { id: '18531090301', key: 'test' },
    { id: '22344715353', key: 'opendoor_test_audience' }
  ],
  accountId: '18269245474',
  events: [
    { experimentIds: [], id: '21235440822', key: 'Test' },
    { experimentIds: ['22406922845'], id: '22020998834', key: 'Product List Clicked' },
    { experimentIds: [], id: '22431931550', key: 'Opendoor Audience Entered' }
  ],
  revision: '55'
}
