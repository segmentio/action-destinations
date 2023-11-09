import { GoalPayload, sendGoal } from '../goal'
import { PayloadValidationError } from '@segment/actions-core'
import { mapUnits } from '../unit'
import { sendEvent } from '../event'
import { unixTimestampOf } from '../timestamp'

jest.mock('../event')

describe('sendGoal()', () => {
  const settings = { collectorEndpoint: 'http://test.com', environment: 'dev', apiKey: 'testkey' }
  const payload: GoalPayload = {
    units: {
      anonymousId: 'testid'
    },
    name: 'testgoal',
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
        } as unknown as GoalPayload,
        settings
      )
    ).toThrowError(PayloadValidationError)
    expect(() =>
      sendGoal(
        request,
        {
          ...payload,
          name: undefined
        } as unknown as GoalPayload,
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
        } as unknown as GoalPayload,
        settings
      )
    ).toThrowError(PayloadValidationError)
    expect(() =>
      sendGoal(
        request,
        {
          ...payload,
          properties: 0
        } as unknown as GoalPayload,
        settings
      )
    ).toThrowError(PayloadValidationError)
  })

  it('should send event with correct format', async () => {
    const request = jest.fn()

    await sendGoal(request, payload, settings)

    const timestmap = unixTimestampOf(payload.achievedAt)
    expect(sendEvent).toHaveBeenCalledWith(
      request,
      settings,
      {
        historic: true,
        publishedAt: timestmap,
        units: mapUnits(payload),
        goals: [
          {
            name: payload.name,
            achievedAt: timestmap,
            properties: payload.properties ?? null
          }
        ]
      },
      payload.agent,
      payload.application
    )
  })
})
