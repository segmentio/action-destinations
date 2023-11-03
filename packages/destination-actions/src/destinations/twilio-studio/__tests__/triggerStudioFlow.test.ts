import nock from 'nock'
import { createTestIntegration, createTestEvent } from '@segment/actions-core'
import Studio from '../index'

const studio = createTestIntegration(Studio)

describe('Twilio Studio', () => {
  const settings = {
    accountSid: 'a',
    authToken: 'b',
    spaceId: 'c',
    profileApiAccessToken: 'd'
  }

  const defaultMapping = {
    flowSid: 'FW76e00a0d69a30e38e5cd25fdf887f62c',
    from: '+17707624774',
    coolingOffPeriod: 60,
    userId: 'jane',
    eventType: 'identify'
  }

  beforeEach(() => {
    nock(`https://profiles.segment.com/v1/spaces/c/collections/users/profiles/user_id:jane`)
      .get('/external_ids?include=phone')
      .reply(200, {
        data: [
          {
            id: '+918384907416',
            type: 'phone',
            source_id: 'pA3bgWXL8RC2s89TqqZtPW',
            collection: 'users',
            created_at: '2023-01-05T15:01:00.367201348Z',
            encoding: 'none'
          },
          {
            id: '+918384907415',
            type: 'phone',
            source_id: 'pA3bgWXL8RC2s89TqqZtPW',
            collection: 'users',
            created_at: '2023-01-05T15:00:00.984939139Z',
            encoding: 'none'
          },
          {
            id: '+918384907414',
            type: 'phone',
            source_id: 'pA3bgWXL8RC2s89TqqZtPW',
            collection: 'users',
            created_at: '2023-01-04T06:26:39.586351454Z',
            encoding: 'none'
          }
        ]
      })
  })

  afterEach(() => {
    studio.responses = []
    nock.cleanAll()
  })

  it('should abort when there is a Profile API fetch failure', async () => {
    nock('https://studio.twilio.com').post(`/v2/Flows/${defaultMapping.flowSid}/Executions`).reply(200, {})
    nock(`https://profiles.segment.com/v1/spaces/c/collections/users/profiles/user_id:jane`)
      .get('/external_ids?include=phone')
      .reply(400, {})
    const event = createTestEvent({
      type: 'identify'
    })
    try {
      await studio.testAction('triggerStudioFlow', {
        event,
        settings,
        mapping: defaultMapping
      })
    } catch (err) {
      expect(err).toHaveProperty('code', 'Profile fetch API failure')
    }
  })

  it('should abort when there is no `phone` external ID returned from Profile API', async () => {
    nock('https://studio.twilio.com').post(`/v2/Flows/${defaultMapping.flowSid}/Executions`).reply(200, {})
    nock(`https://profiles.segment.com/v1/spaces/c/collections/users/profiles/user_id:jane`)
      .get('/external_ids?include=phone')
      .reply(200, { data: [] })
    const event = createTestEvent({
      type: 'identify'
    })
    try {
      await studio.testAction('triggerStudioFlow', {
        event,
        settings,
        mapping: defaultMapping
      })
    } catch (err) {
      expect(err).toHaveProperty('code', 'Trigger Studio Flow no contact address found failure')
    }
  })

  it('should abort when there is no `userId` in the event payload', async () => {
    nock('https://studio.twilio.com').post(`/v2/Flows/${defaultMapping.flowSid}/Executions`).reply(200, {})
    nock(`https://profiles.segment.com/v1/spaces/c/collections/users/profiles/user_id:jane`)
      .get('/external_ids?include=phone')
      .reply(200, { data: [] })
    const event = createTestEvent({
      type: 'identify'
    })
    try {
      await studio.testAction('triggerStudioFlow', {
        event,
        settings,
        mapping: { ...defaultMapping, userId: '' }
      })
    } catch (err) {
      expect(err).toHaveProperty('code', 'No userId found in the Segment Event')
    }
  })

  it('should abort when cooldown period is going on', async () => {
    nock('https://studio.twilio.com').post(`/v2/Flows/${defaultMapping.flowSid}/Executions`).reply(200, {})
    const event = createTestEvent({
      type: 'identify'
    })
    try {
      await studio.testAction('triggerStudioFlow', {
        event,
        settings,
        mapping: defaultMapping,
        stateContext: {
          getRequestContext: (_key: string): any => 'FW76e00a0d69a30e38e5cd25fdf887f62cjane',
          setResponseContext: (
            _key: string,
            _value: string,
            _ttl: { hour?: number; minute?: number; second?: number }
          ): void => {}
        }
      })
    } catch (err) {
      expect(err).toHaveProperty('code', 'Cooling off Period')
    }
  })

  it('should trigger a flow', async () => {
    const studioRequest = nock('https://studio.twilio.com')
      .post(`/v2/Flows/${defaultMapping.flowSid}/Executions`)
      .reply(200, {})
    const event = createTestEvent({
      type: 'identify'
    })
    const actionInputData = {
      event,
      settings,
      mapping: defaultMapping,
      stateContext: {
        getRequestContext: (_key: string): any => '',
        setResponseContext: (
          _key: string,
          _value: string,
          _ttl: { hour?: number; minute?: number; second?: number }
        ): void => {}
      }
    }

    const responses = await studio.testAction('triggerStudioFlow', actionInputData)
    expect(responses[1].status).toBe(200)
    expect(responses[1].url).toBe('https://studio.twilio.com/v2/Flows/FW76e00a0d69a30e38e5cd25fdf887f62c/Executions')
    expect(studioRequest.isDone()).toEqual(true)
  })

  it('should fail to trigger a flow when Studio execution API fails', async () => {
    nock('https://studio.twilio.com').post(`/v2/Flows/${defaultMapping.flowSid}/Executions`).reply(400, {
      code: 20001,
      message: 'Missing required parameter To in the post body',
      more_info: 'https://www.twilio.com/docs/errors/20001',
      status: 400
    })
    const event = createTestEvent({
      type: 'identify'
    })
    const actionInputData = {
      event,
      settings,
      mapping: defaultMapping,
      stateContext: {
        getRequestContext: (_key: string): any => '',
        setResponseContext: (
          _key: string,
          _value: string,
          _ttl: { hour?: number; minute?: number; second?: number }
        ): void => {}
      }
    }

    try {
      await studio.testAction('triggerStudioFlow', actionInputData)
    } catch (err) {
      expect(err).toHaveProperty('status', 400)
      expect(err).toHaveProperty('code', 'Twilio Error Code: 20001')
      expect(err).toHaveProperty(
        'message',
        'Unable to trigger Studio Flow. Missing required parameter To in the post body'
      )
    }
  })
})
