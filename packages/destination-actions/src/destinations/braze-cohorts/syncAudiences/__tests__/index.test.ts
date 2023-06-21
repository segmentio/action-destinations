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

describe('BrazeCohorts.syncAudiences', () => {
  it('should throw an error if `personas_audience_key` field does not match the `personas.computation_key` field', async () => {
    await expect(
      testDestination.testAction('syncAudiences', {
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
        mapping: {
          personas_audience_key: 'some_hardcoded_value'
        }
      })
    ).rejects.toThrowError('The value of `personas computation key` and `personas_audience_key` must match.')
  })

  it("should not throw an error even if payload doesn't have userId,device_id,user_alias", async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})

    const responses = await testDestination.testAction('syncAudiences', {
      event: {
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: true
        },
        context: {
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          }
        },
        timestamp: timestamp
      },
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: false,
      mapping: {
        enable_batching: true,
        cohort_id: {
          '@path': '$.context.personas.computation_id'
        },
        cohort_name: {
          '@path': '$.context.personas.computation_key'
        },
        time: {
          '@path': '$.timestamp'
        },
        event_properties: {
          '@if': {
            exists: { '@path': '$.properties' },
            then: { '@path': '$.properties' },
            else: { '@path': '$.traits' }
          }
        },
        personas_audience_key: 'j_o_jons__step_1_ns3i7'
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(201)
    expect(responses[0].options.json).toMatchSnapshot()
  })

  it('should give priority in a order like userId,deviceId and then UserAlias,if it is provided', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})

    const responses = await testDestination.testAction('syncAudiences', {
      event: {
        ...event,
        traits: {
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
          aliases: [],
          device_ids: []
        })
      ])
    })
    expect(responses[0].options.json).toMatchSnapshot()
    expect(responses[1].options.json).toMatchSnapshot()
  })

  it('should give second priority to deviceId ,if userId is not provided', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})

    const responses = await testDestination.testAction('syncAudiences', {
      event: {
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
        traits: {
          j_o_jons__step_1_ns3i7: true
        },
        timestamp: timestamp
      },
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: false,
      mapping: {
        enable_batching: true,
        cohort_id: {
          '@path': '$.context.personas.computation_id'
        },
        cohort_name: {
          '@path': '$.context.personas.computation_key'
        },
        time: {
          '@path': '$.timestamp'
        },
        event_properties: {
          '@if': {
            exists: { '@path': '$.properties' },
            then: { '@path': '$.properties' },
            else: { '@path': '$.traits' }
          }
        },
        ...mapping
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
          device_ids: ['1234567']
        })
      ])
    })
    expect(responses[0].options.json).toMatchSnapshot()
    expect(responses[1].options.json).toMatchSnapshot()
  })

  it('should give priority to userAlias,if userId and deviceId both are not provided', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})

    const responses = await testDestination.testAction('syncAudiences', {
      event: {
        context: {
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          },
          traits: {
            email: 'test@twilio.com'
          }
        },
        traits: {
          j_o_jons__step_1_ns3i7: true
        },
        timestamp: timestamp
      },
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: false,
      mapping: {
        enable_batching: true,
        cohort_id: {
          '@path': '$.context.personas.computation_id'
        },
        cohort_name: {
          '@path': '$.context.personas.computation_key'
        },
        time: {
          '@path': '$.timestamp'
        },
        event_properties: {
          '@if': {
            exists: { '@path': '$.properties' },
            then: { '@path': '$.properties' },
            else: { '@path': '$.traits' }
          }
        },
        ...mapping
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
              alias_label: 'test@twilio.com',
              alias_name: 'email'
            }
          ],
          device_ids: []
        })
      ])
    })
    expect(responses[0].options.json).toMatchSnapshot()
    expect(responses[1].options.json).toMatchSnapshot()
  })

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

  it('should not hit create cohort api when cohort_name is available in state context is matching with computation key', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})

    const responses = await testDestination.testAction('syncAudiences', {
      event: {
        ...event,
        context: {
          cohort_name: 'j_o_jons__step_1_ns3i7',
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          },
          traits: {
            email: 'test@twilio.com'
          }
        }
      },
      stateContext: {
        getRequestContext: (_key: string): any => 'j_o_jons__step_1_ns3i7',
        setResponseContext: (
          _key: string,
          _value: string,
          _ttl: { hour?: number; minute?: number; second?: number }
        ): void => {}
      },
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: true,
      mapping
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(201)
    expect(responses[0].options.json).toMatchSnapshot()
  })

  it('should hit create cohort api when cohort_name available in stateContext is not matching with computation key', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})

    const responses = await testDestination.testAction('syncAudiences', {
      event: {
        ...event,
        context: {
          cohort_name: 'j_o_jons__step_1_ns3i7',
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          },
          traits: {
            email: 'test@twilio.com'
          }
        }
      },
      stateContext: {
        getRequestContext: (_key: string): any => 'different_cohort_name',
        setResponseContext: (
          _key: string,
          _value: string,
          _ttl: { hour?: number; minute?: number; second?: number }
        ): void => {}
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
    expect(responses[0].options.json).toMatchSnapshot()
    expect(responses[1].options.json).toMatchSnapshot()
  })

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
})
