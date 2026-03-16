// This file to be removed after audienceMembership migration.
import nock from 'nock'
import { createTestIntegration, SegmentEvent, createTestEvent } from '@segment/actions-core'
import Destination from '../../index'
const timestamp = '2022-12-01T17:40:04.055Z'
const testDestination = createTestIntegration(Destination)
const event = {
  context: {
    personas: {
      computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
      computation_key: 'j_o_jons__step_1_ns3i7'
    },
    traits: {
      email: 'test@twilio.com'
    },
    device: {
      id: '1234567'
    }
  },
  userId: 'w8KWCsdTxe1Ydaf3s62UMc',
  timestamp: timestamp
}

const mapping = {
  personas_audience_key: 'j_o_jons__step_1_ns3i7',
  user_alias: {
    alias_name: 'email',
    alias_label: {
      '@path': '$.context.traits.email'
    }
  },
  device_id: {
    '@path': '$.context.device.id'
  }
}

describe('BrazeCohorts.syncAudiences - LEGACY TESTS - TO BE REMOVED', () => {
  // TODO: Remove after audienceMembership migration. This test covers the legacy code path where
  // add/remove is determined by event_properties[personas_audience_key]. It will be replaced by
  // an equivalent flag-enabled test once the feature flags are removed.
  it('should add user to braze when event_properties is set to true', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})

    const responses = await testDestination.testAction('syncAudiences', {
      event: {
        ...event,
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: true
        }
      },
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: true,
      mapping
    })
    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(201)
    expect(responses[1].status).toBe(201)
    expect(responses[1].options.json).toMatchObject({
      cohort_changes: expect.arrayContaining([
        expect.objectContaining({
          user_ids: ['w8KWCsdTxe1Ydaf3s62UMc'],
          device_ids: [],
          aliases: []
        })
      ])
    })
    expect(responses[0].options.json).toMatchSnapshot()
    expect(responses[1].options.json).toMatchSnapshot()
  })

  // TODO: Remove after audienceMembership migration. This test covers the legacy code path where
  // add/remove is determined by event_properties[personas_audience_key]. It will be replaced by
  // an equivalent flag-enabled test once the feature flags are removed.
  it('should remove user to braze when event_properties set to false', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})

    const responses = await testDestination.testAction('syncAudiences', {
      event: {
        ...event,
        traits: {
          j_o_jons__step_1_ns3i7: false
        }
      },
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: true,
      mapping
    })
    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(201)
    expect(responses[1].status).toBe(201)
    expect(responses[1].options.json).toMatchObject({
      cohort_changes: expect.arrayContaining([
        expect.objectContaining({
          user_ids: ['w8KWCsdTxe1Ydaf3s62UMc'],
          device_ids: [],
          aliases: [],
          should_remove: true
        })
      ])
    })
    expect(responses[0].options.json).toMatchSnapshot()
    expect(responses[1].options.json).toMatchSnapshot()
  })

  // TODO: Remove after audienceMembership migration. This test covers the legacy code path where
  // add/remove is determined by event_properties[personas_audience_key]. It will be replaced by
  // an equivalent flag-enabled test once the feature flags are removed.
  it('should work with batch events', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})
    const events: SegmentEvent[] = [
      createTestEvent({
        ...event,
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: true
        }
      }),
      createTestEvent({
        context: {
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          }
        },
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: false
        },
        timestamp: timestamp
      })
    ]

    const responses = await testDestination.testBatchAction('syncAudiences', {
      events,
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: true,
      mapping: {
        personas_audience_key: 'j_o_jons__step_1_ns3i7'
      }
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(201)
    expect(responses[1].status).toBe(201)
    expect(responses[1].options.json).toMatchObject({
      cohort_changes: expect.arrayContaining([
        expect.objectContaining({
          user_ids: ['w8KWCsdTxe1Ydaf3s62UMc'],
          aliases: [],
          device_ids: []
        }),
        expect.objectContaining({
          user_ids: ['user1234'],
          aliases: [],
          device_ids: [],
          should_remove: true
        })
      ])
    })
    expect(responses[0].options.json).toMatchSnapshot()
    expect(responses[1].options.json).toMatchSnapshot()
  })

  // TODO: Remove after audienceMembership migration. This test covers the legacy code path where
  // add/remove is determined by event_properties[personas_audience_key]. It will be replaced by
  // an equivalent flag-enabled test once the feature flags are removed.
  it('should dedupe add users in batch events', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})
    const timestamp = new Date()
    const timestampWithDelay = timestamp
    timestampWithDelay.setMinutes(timestamp.getMinutes() + 1)
    const events: SegmentEvent[] = [
      createTestEvent({
        ...event,
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: true
        },
        userId: 'test-user-id',
        timestamp: timestamp.toISOString()
      }),
      createTestEvent({
        context: {
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          }
        },
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: true
        },
        userId: 'test-user-id',
        timestamp: timestampWithDelay.toISOString()
      })
    ]
    const responses = await testDestination.testBatchAction('syncAudiences', {
      events,
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: true,
      mapping: {
        personas_audience_key: 'j_o_jons__step_1_ns3i7'
      },
      features: {
        'dedupe-braze-cohorts-v2': true
      }
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(201)
    expect(responses[1].status).toBe(201)
    expect(responses[1].options.json).toMatchObject({
      cohort_changes: expect.arrayContaining([
        expect.objectContaining({
          user_ids: ['test-user-id'],
          aliases: [],
          device_ids: []
        })
      ])
    })
  })

  // TODO: Remove after audienceMembership migration. This test covers the legacy code path where
  // add/remove is determined by event_properties[personas_audience_key]. It will be replaced by
  // an equivalent flag-enabled test once the feature flags are removed.
  it('should dedupe external_id across add and remove user events by timestamp', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})
    const timestamp = new Date()
    const timestampWithDelay = new Date()
    timestampWithDelay.setMinutes(timestamp.getMinutes() + 1)
    const events: SegmentEvent[] = [
      createTestEvent({
        ...event,
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: true
        },
        userId: 'test-user-id',
        timestamp: timestamp.toISOString()
      }),
      createTestEvent({
        context: {
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          }
        },
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: false
        },
        userId: 'test-user-id',
        timestamp: timestampWithDelay.toISOString()
      })
    ]
    const responses = await testDestination.testBatchAction('syncAudiences', {
      events,
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: true,
      mapping: {
        personas_audience_key: 'j_o_jons__step_1_ns3i7'
      },
      features: {
        'dedupe-braze-cohorts-v2': true
      }
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(201)
    expect(responses[1].status).toBe(201)
    expect(responses[1].options.json).toMatchObject({
      cohort_changes: expect.arrayContaining([
        expect.objectContaining({
          user_ids: ['test-user-id'],
          aliases: [],
          device_ids: [],
          should_remove: true
        })
      ])
    })
  })

  // TODO: Remove after audienceMembership migration. This test covers the legacy code path where
  // add/remove is determined by event_properties[personas_audience_key]. It will be replaced by
  // an equivalent flag-enabled test once the feature flags are removed.
  it('should dedupe device_id across add and remove events by timestamp', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})
    const timestamp = new Date()
    const timestampWithDelay = new Date()
    timestampWithDelay.setMinutes(timestamp.getMinutes() + 1)
    const events: SegmentEvent[] = [
      createTestEvent({
        context: {
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          },
          device: {
            id: 'test-device-id'
          }
        },
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: true
        },
        timestamp: timestamp.toISOString()
      }),
      createTestEvent({
        context: {
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          },
          device: {
            id: 'test-device-id'
          }
        },
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: false
        },
        timestamp: timestampWithDelay.toISOString()
      })
    ]
    const responses = await testDestination.testBatchAction('syncAudiences', {
      events,
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: true,
      mapping: {
        personas_audience_key: 'j_o_jons__step_1_ns3i7',
        device_id: {
          '@path': '$.context.device.id'
        },
        external_id: {
          '@path': '$.notGiven'
        }
      }
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(201)
    expect(responses[1].status).toBe(201)
    expect(responses[1].options.json).toMatchObject({
      cohort_changes: expect.arrayContaining([
        expect.objectContaining({
          user_ids: [],
          aliases: [],
          device_ids: ['test-device-id'],
          should_remove: true
        })
      ])
    })
  })

  // TODO: Remove after audienceMembership migration. This test covers the legacy code path where
  // add/remove is determined by event_properties[personas_audience_key]. It will be replaced by
  // an equivalent flag-enabled test once the feature flags are removed.
  it('should dedupe add and remove users by alias identifiers and timestamp', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})
    const timestamp = new Date()
    const timestampWithDelay = new Date()
    timestampWithDelay.setMinutes(timestamp.getMinutes() + 1)
    const events: SegmentEvent[] = [
      createTestEvent({
        context: {
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          },
          traits: {
            email: 'test@example.com'
          }
        },
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: true
        },
        timestamp: timestampWithDelay.toISOString()
      }),
      createTestEvent({
        context: {
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          },
          traits: {
            email: 'test@example.com'
          }
        },
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: false
        },
        timestamp: timestamp.toISOString()
      })
    ]
    const responses = await testDestination.testBatchAction('syncAudiences', {
      events,
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: true,
      mapping: {
        personas_audience_key: 'j_o_jons__step_1_ns3i7',
        external_id: {
          '@path': '$.notGiven'
        },
        user_alias: {
          alias_name: 'email',
          alias_label: {
            '@path': '$.context.traits.email'
          }
        }
      }
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(201)
    expect(responses[1].status).toBe(201)
    expect(responses[1].options.json).toMatchObject({
      cohort_changes: expect.arrayContaining([
        expect.objectContaining({
          user_ids: [],
          aliases: [
            {
              alias_label: 'test@example.com',
              alias_name: 'email'
            }
          ],
          device_ids: [],
          should_remove: undefined
        })
      ])
    })
  })

  // TODO: Remove after audienceMembership migration. This test covers the legacy code path where
  // add/remove is determined by event_properties[personas_audience_key]. It will be replaced by
  // an equivalent flag-enabled test once the feature flags are removed.
  it('should dedupe remove users in batch events for external_id', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})
    const timestamp = new Date()
    const timestampWithDelay = new Date()
    timestampWithDelay.setMinutes(timestamp.getMinutes() + 1)
    const events: SegmentEvent[] = [
      createTestEvent({
        ...event,
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: false
        },
        userId: 'test-user-id',
        timestamp: timestamp.toISOString()
      }),
      createTestEvent({
        context: {
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          }
        },
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: false
        },
        userId: 'test-user-id',
        timestamp: timestampWithDelay.toISOString()
      })
    ]
    const responses = await testDestination.testBatchAction('syncAudiences', {
      events,
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: true,
      mapping: {
        personas_audience_key: 'j_o_jons__step_1_ns3i7'
      }
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(201)
    expect(responses[1].status).toBe(201)
    expect(responses[1].options.json).toMatchObject({
      cohort_changes: expect.arrayContaining([
        expect.objectContaining({
          user_ids: ['test-user-id'],
          aliases: [],
          device_ids: [],
          should_remove: true
        })
      ])
    })
  })

  // TODO: Remove after audienceMembership migration. This test covers the legacy code path where
  // add/remove is determined by event_properties[personas_audience_key]. It will be replaced by
  // an equivalent flag-enabled test once the feature flags are removed.
  it('should dedupe remove users in batch events for device_id', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})
    const timestamp = new Date()
    const timestampWithDelay = new Date()
    timestampWithDelay.setMinutes(timestamp.getMinutes() + 1)
    const events: SegmentEvent[] = [
      createTestEvent({
        context: {
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          },
          device: {
            id: 'test-device-id'
          }
        },
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: false
        },
        timestamp: timestamp.toISOString()
      }),
      createTestEvent({
        context: {
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          },
          device: {
            id: 'test-device-id'
          }
        },
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: false
        },
        timestamp: timestampWithDelay.toISOString()
      })
    ]
    const responses = await testDestination.testBatchAction('syncAudiences', {
      events,
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: true,
      mapping: {
        personas_audience_key: 'j_o_jons__step_1_ns3i7',
        device_id: {
          '@path': '$.context.device.id'
        },
        external_id: {
          '@path': '$.notGiven'
        }
      }
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(201)
    expect(responses[1].status).toBe(201)
    expect(responses[1].options.json).toMatchObject({
      cohort_changes: expect.arrayContaining([
        expect.objectContaining({
          user_ids: [],
          aliases: [],
          device_ids: ['test-device-id'],
          should_remove: true
        })
      ])
    })
  })

  // TODO: Remove after audienceMembership migration. This test covers the legacy code path where
  // add/remove is determined by event_properties[personas_audience_key]. It will be replaced by
  // an equivalent flag-enabled test once the feature flags are removed.
  it('should dedupe remove users in batch events for user_alias', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})
    const timestamp = new Date()
    const timestampWithDelay = new Date()
    timestampWithDelay.setMinutes(timestamp.getMinutes() + 1)
    const events: SegmentEvent[] = [
      createTestEvent({
        context: {
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          },
          traits: {
            email: 'test@example.com'
          }
        },
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: false
        },
        timestamp: timestamp.toISOString()
      }),
      createTestEvent({
        context: {
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          },
          traits: {
            email: 'test@example.com'
          }
        },
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: false
        },
        timestamp: timestampWithDelay.toISOString()
      })
    ]
    const responses = await testDestination.testBatchAction('syncAudiences', {
      events,
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: true,
      mapping: {
        personas_audience_key: 'j_o_jons__step_1_ns3i7',
        external_id: {
          '@path': '$.notGiven'
        },
        user_alias: {
          alias_name: 'email',
          alias_label: {
            '@path': '$.context.traits.email'
          }
        }
      }
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(201)
    expect(responses[1].status).toBe(201)
    expect(responses[1].options.json).toMatchObject({
      cohort_changes: expect.arrayContaining([
        expect.objectContaining({
          user_ids: [],
          aliases: [
            {
              alias_label: 'test@example.com',
              alias_name: 'email'
            }
          ],
          device_ids: [],
          should_remove: true
        })
      ])
    })
  })

  // TODO: Remove after audienceMembership migration. This test covers the legacy code path where
  // add/remove is determined by event_properties[personas_audience_key]. It will be replaced by
  // an equivalent flag-enabled test once the feature flags are removed.
  it('should dedupe add users in batch events for device_id', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})
    const timestamp = new Date()
    const timestampWithDelay = new Date()
    timestampWithDelay.setMinutes(timestamp.getMinutes() + 1)
    const events: SegmentEvent[] = [
      createTestEvent({
        context: {
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          },
          device: {
            id: 'test-device-id'
          }
        },
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: true
        },
        timestamp: timestamp.toISOString()
      }),
      createTestEvent({
        context: {
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          },
          device: {
            id: 'test-device-id'
          }
        },
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: true
        },
        timestamp: timestampWithDelay.toISOString()
      })
    ]
    const responses = await testDestination.testBatchAction('syncAudiences', {
      events,
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: true,
      mapping: {
        personas_audience_key: 'j_o_jons__step_1_ns3i7',
        device_id: {
          '@path': '$.context.device.id'
        },
        external_id: {
          '@path': '$.notGiven'
        }
      }
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(201)
    expect(responses[1].status).toBe(201)
    expect(responses[1].options.json).toMatchObject({
      cohort_changes: expect.arrayContaining([
        expect.objectContaining({
          user_ids: [],
          aliases: [],
          device_ids: ['test-device-id']
        })
      ])
    })
  })

  // TODO: Remove after audienceMembership migration. This test covers the legacy code path where
  // add/remove is determined by event_properties[personas_audience_key]. It will be replaced by
  // an equivalent flag-enabled test once the feature flags are removed.
  it('should dedupe add users in batch events for user_alias', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})
    const timestamp = new Date()
    const timestampWithDelay = new Date()
    timestampWithDelay.setMinutes(timestamp.getMinutes() + 1)
    const events: SegmentEvent[] = [
      createTestEvent({
        context: {
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          },
          traits: {
            email: 'test@example.com'
          }
        },
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: true
        },
        timestamp: timestamp.toISOString()
      }),
      createTestEvent({
        context: {
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          },
          traits: {
            email: 'test@example.com'
          }
        },
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: true
        },
        timestamp: timestampWithDelay.toISOString()
      })
    ]
    const responses = await testDestination.testBatchAction('syncAudiences', {
      events,
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: true,
      mapping: {
        personas_audience_key: 'j_o_jons__step_1_ns3i7',
        external_id: {
          '@path': '$.notGiven'
        },
        user_alias: {
          alias_name: 'email',
          alias_label: {
            '@path': '$.context.traits.email'
          }
        }
      }
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(201)
    expect(responses[1].status).toBe(201)
    expect(responses[1].options.json).toMatchObject({
      cohort_changes: expect.arrayContaining([
        expect.objectContaining({
          user_ids: [],
          aliases: [
            {
              alias_label: 'test@example.com',
              alias_name: 'email'
            }
          ],
          device_ids: []
        })
      ])
    })
  })
})
