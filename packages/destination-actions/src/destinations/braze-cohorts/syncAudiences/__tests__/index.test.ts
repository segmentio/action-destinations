import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
const receivedAt = '2022-12-01T17:40:04.055Z'
const testDestination = createTestIntegration(Destination)
const event = createTestEvent({
  properties: {
    audience_key: 'j_o_jons__step_1_ns3i7',
    j_o_jons__step_1_ns3i7: true
  },
  personas: {
    computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
    computation_key: 'j_o_jons__step_1_ns3i7'
  },
  userId: 'w8KWCsdTxe1Ydaf3s62UMc',
  receivedAt: receivedAt,
  //  logger: { name: 'Test Braze Cohort ', level: 'info' ,info:(_message): void=>{}},
  stateContext: {
    getState: (_key: string): any => {},
    setState: (_key: string, _value: string, _ttl: { hour?: number; minute?: number; second?: number }): void => {}
  }
})

describe('BrazeCohorts.syncAudiences', () => {
  // TODO: Test your action

  it('should throw an error if `personas_audience_key` field does not match the `personas.computation_key` field', async () => {
    await expect(
      testDestination.testAction('syncAudiences', {
        event,
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
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})

    await expect(
      testDestination.testAction('syncAudiences', {
        event: {
          properties: {
            audience_key: 'j_o_jons__step_1_ns3i7',
            j_o_jons__step_1_ns3i7: true
          },
          personas: {
            computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
            computation_key: 'j_o_jons__step_1_ns3i7'
          },
          receivedAt: receivedAt
        },
        settings: {
          endpoint: 'https://rest.iad-01.braze.com',
          client_secret: 'valid_client_secret_key'
        },
        useDefaultMappings: true,
        mapping: {
          personas_audience_key: 'j_o_jons__step_1_ns3i7'
        },
        stateContext: {
          getState: (_key: string): any => {},
          setState: (
            _key: string,
            _value: string,
            _ttl: { hour?: number; minute?: number; second?: number }
          ): void => {}
        }
      })
    ).resolves.not.toThrowError()
  })

  it('should give priority to userId,deviceId and then UserAlias,if all are provided', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})

    const responses = await testDestination.testAction('syncAudiences', {
      event: {
        traits: {
          j_o_jons__step_1_ns3i7: true
        },
        personas: {
          computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
          computation_key: 'j_o_jons__step_1_ns3i7'
        },
        userId: 'w8KWCsdTxe1Ydaf3s62UMc',
        deviceId: 'device123',
        userAlias: {
          alias_name: 'email',
          alias_label: 'test@twilio.com'
        },
        receivedAt: receivedAt
      },
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: true,
      mapping: {
        personas_audience_key: 'j_o_jons__step_1_ns3i7'
      },
      stateContext: {
        getState: (_key: string): any => {},
        setState: (_key: string, _value: string, _ttl: { hour?: number; minute?: number; second?: number }): void => {}
      }
    })
    // console.log(responses[1].options.json);
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
  })

  it('should add user to braze when event properties is set to true', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})

    const responses = await testDestination.testAction('syncAudiences', {
      event: {
        properties: {
          audience_key: 'j_o_jons__step_1_ns3i7',
          j_o_jons__step_1_ns3i7: true
        },
        personas: {
          computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
          computation_key: 'j_o_jons__step_1_ns3i7'
        },
        userId: 'w8KWCsdTxe1Ydaf3s62UMc',
        deviceId: 'device123',
        userAlias: {
          alias_name: 'email',
          alias_label: 'test@twilio.com'
        },
        receivedAt: receivedAt
      },
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: true,
      mapping: {
        personas_audience_key: 'j_o_jons__step_1_ns3i7'
      },
      stateContext: {
        getState: (_key: string): any => {},
        setState: (_key: string, _value: string, _ttl: { hour?: number; minute?: number; second?: number }): void => {}
      }
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
  })

  it('should remove user to braze when event properties set to false', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts').reply(201, {})
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})

    const responses = await testDestination.testAction('syncAudiences', {
      event: {
        traits: {
          j_o_jons__step_1_ns3i7: false
        },
        personas: {
          computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
          computation_key: 'j_o_jons__step_1_ns3i7'
        },
        deviceId: 'device123',
        userAlias: {
          alias_name: 'email',
          alias_label: 'test@twilio.com'
        },
        receivedAt: receivedAt,
        userId: 'w8KWCsdTxe1Ydaf3s62UMc'
      },
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: true,
      mapping: {
        personas_audience_key: 'j_o_jons__step_1_ns3i7'
      },
      stateContext: {
        getState: (_key: string): any => {},
        setState: (_key: string, _value: string, _ttl: { hour?: number; minute?: number; second?: number }): void => {}
      }
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
  })

  it('should not hit an create cohort api,when cohort_name is already cached and available in context', async () => {
    nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})

    const responses = await testDestination.testAction('syncAudiences', {
      event: {
        context: {
          cohort_name: 'j_o_jons__step_1_ns3i7'
        },
        traits: {
          j_o_jons__step_1_ns3i7: false
        },
        personas: {
          computation_id: 'aud_23WNzkzsTS3ydnKz5H71SEhMxls',
          computation_key: 'j_o_jons__step_1_ns3i7'
        },
        userId: 'w8KWCsdTxe1Ydaf3s62UMc',
        receivedAt: receivedAt
      },
      stateContext: {
        getState: (_key: string): any => 'j_o_jons__step_1_ns3i7',
        setState: (_key: string, _value: string, _ttl: { hour?: number; minute?: number; second?: number }): void => {}
      },
      settings: {
        endpoint: 'https://rest.iad-01.braze.com',
        client_secret: 'valid_client_secret_key'
      },
      useDefaultMappings: true,
      mapping: {
        personas_audience_key: 'j_o_jons__step_1_ns3i7'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(201)
  })
})
