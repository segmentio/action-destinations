import { GoalPayload, sendGoal } from '../goal'
import { PayloadValidationError } from '@segment/actions-core'
import { mapUnits } from '../unit'
import { sendEvent } from '../event'

jest.mock('../event')

describe('sendGoal()', () => {
  const settings = { collectorEndpoint: 'http://test.com', environment: 'dev', apiKey: 'testkey' }
  const payload: GoalPayload = {
    units: {
      anonymousId: 'testid'
    },
    name: 'testgoal',
    application: 'testapp',
    agent: 'test-sdk',
    properties: {
      testprop: 'testvalue'
    }
  }

  it('should throw on missing name', async () => {
    const request = jest.fn()

    expect(() => sendGoal(request, 1672531300000, { ...payload, name: '' }, settings)).toThrowError(
      PayloadValidationError
    )
    expect(() =>
      sendGoal(
        request,
        1672531300000,
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
        1672531300000,
        {
          ...payload,
          name: undefined
        } as unknown as GoalPayload,
        settings
      )
    ).toThrowError(PayloadValidationError)
  })

  it('should throw on invalid properties', async () => {
    const request = jest.fn()

    expect(() =>
      sendGoal(
        request,
        1672531300000,
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
        1672531300000,
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

    await sendGoal(request, 1672531300000, payload, settings)

    expect(sendEvent).toHaveBeenCalledWith(
      request,
      settings,
      {
        historic: true,
        publishedAt: 1672531300000,
        units: mapUnits(payload),
        goals: [
          {
            name: payload.name,
            achievedAt: 1672531300000,
            properties: payload.properties ?? null
          }
        ]
      },
      payload.agent,
      payload.application
    )
  })
})
