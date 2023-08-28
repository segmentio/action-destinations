import { TrackPayload, sendGoal } from '../goal'
import { PayloadValidationError } from '@segment/actions-core'
import { mapUnits } from '../unit'
import { sendEvent } from '../event'

jest.mock('../event')

describe('sendGoal()', () => {
  const settings = { collectorEndpoint: 'http://test.com', environment: 'dev', apiKey: 'testkey' }
  const payload: TrackPayload = {
    units: {
      anonymousId: 'testid'
    },
    name: 'testgoal',
    publishedAt: '2023-01-01T00:00:00.3Z',
    achievedAt: '2023-01-01T00:00:00.000000Z',
    application: 'testapp',
    agent: 'test-sdk',
    properties: {
      testprop: 'testvalue'
    }
  }

  it('should throw on missing name', async () => {
    const request = jest.fn()

    expect(() => sendGoal(request, { ...payload, name: '' }, settings)).toThrowError(PayloadValidationError)
    expect(() =>
      sendGoal(
        request,
        {
          ...payload,
          name: null
        } as unknown as TrackPayload,
        settings
      )
    ).toThrowError(PayloadValidationError)
    expect(() =>
      sendGoal(
        request,
        {
          ...payload,
          name: undefined
        } as unknown as TrackPayload,
        settings
      )
    ).toThrowError(PayloadValidationError)
  })

  it('should throw on invalid publishedAt', async () => {
    const request = jest.fn()

    expect(() => sendGoal(request, { ...payload, publishedAt: 0 }, settings)).toThrowError(PayloadValidationError)
    expect(() =>
      sendGoal(
        request,
        {
          ...payload,
          publishedAt: 'invalid date'
        },
        settings
      )
    ).toThrowError(PayloadValidationError)
  })

  it('should throw on invalid achievedAt', async () => {
    const request = jest.fn()

    expect(() => sendGoal(request, { ...payload, achievedAt: 0 }, settings)).toThrowError(PayloadValidationError)
    expect(() =>
      sendGoal(
        request,
        {
          ...payload,
          achievedAt: 'invalid date'
        },
        settings
      )
    ).toThrowError(PayloadValidationError)
  })

  it('should throw on invalid properties', async () => {
    const request = jest.fn()

    expect(() =>
      sendGoal(
        request,
        {
          ...payload,
          properties: 'bleh'
        } as unknown as TrackPayload,
        settings
      )
    ).toThrowError(PayloadValidationError)
    expect(() =>
      sendGoal(
        request,
        {
          ...payload,
          properties: 0
        } as unknown as TrackPayload,
        settings
      )
    ).toThrowError(PayloadValidationError)
  })

  it('should send event with correct format', async () => {
    const request = jest.fn()

    await sendGoal(request, payload, settings)

    expect(sendEvent).toHaveBeenCalledWith(
      request,
      settings,
      {
        publishedAt: 1672531200300,
        units: mapUnits(payload),
        goals: [
          {
            name: payload.name,
            achievedAt: 1672531200000,
            properties: payload.properties ?? null
          }
        ]
      },
      payload.agent,
      payload.application
    )
  })
})
