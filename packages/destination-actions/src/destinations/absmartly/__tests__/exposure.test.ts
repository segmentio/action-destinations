import { ExposurePayload } from '../exposure'
import { sendEvent } from '../event'
import { sendExposure } from '../exposure'
import { PayloadValidationError } from '@segment/actions-core'

jest.mock('../event')

describe('sendExposure()', () => {
  const settings = { collectorEndpoint: 'http://test.com', environment: 'dev', apiKey: 'testkey' }
  const payload: ExposurePayload = {
    application: 'testapp',
    agent: 'test-sdk',
    exposedAt: '2023-01-01T00:00:00.000000Z',
    exposure: {
      publishedAt: 1672531200900,
      units: [{ type: 'anonymousId', value: 'testid' }],
      exposures: [{ experiment: 'testexp', variant: 'testvar', exposedAt: 1672531200300 }],
      goals: [],
      attributes: [{ name: 'testattr', value: 'testval', setAt: 1672531200300 }]
    }
  }

  it('should throw if exposure payload has no units', async () => {
    const request = jest.fn()

    expect(() =>
      sendExposure(
        request,
        {
          ...payload,
          exposure: { ...payload.exposure, units: null }
        },
        settings
      )
    ).toThrowError(PayloadValidationError)
    expect(() =>
      sendExposure(
        request,
        {
          ...payload,
          exposure: { ...payload.exposure, units: [] }
        },
        settings
      )
    ).toThrowError(PayloadValidationError)
  })

  it('should throw if exposure payload has no exposures', async () => {
    const request = jest.fn()

    expect(() =>
      sendExposure(
        request,
        {
          ...payload,
          exposure: { ...payload.exposure, exposures: null }
        },
        settings
      )
    ).toThrowError(PayloadValidationError)
    expect(() =>
      sendExposure(
        request,
        {
          ...payload,
          exposure: { ...payload.exposure, exposures: [] }
        },
        settings
      )
    ).toThrowError(PayloadValidationError)
  })

  it('should throw if exposure payload has goals', async () => {
    const request = jest.fn()

    expect(() =>
      sendExposure(
        request,
        {
          ...payload,
          exposure: { ...payload.exposure, goals: [{}] }
        },
        settings
      )
    ).toThrowError(PayloadValidationError)
  })

  it('should throw on invalid exposedAt', async () => {
    const request = jest.fn()

    expect(() => sendExposure(request, { ...payload, exposedAt: 0 }, settings)).toThrowError(PayloadValidationError)
    expect(() =>
      sendExposure(
        request,
        {
          ...payload,
          exposedAt: 'invalid date'
        },
        settings
      )
    ).toThrowError(PayloadValidationError)
  })

  it('should pass-through the exposure payload with adjusted timestamps', async () => {
    const request = jest.fn()

    await sendExposure(request, payload, settings)

    expect(sendEvent).toHaveBeenCalledWith(
      request,
      settings,
      {
        ...payload.exposure,
        historic: true,
        publishedAt: 1672531200000,
        exposures: [{ ...payload.exposure.exposures[0], exposedAt: 1672531199400 }],
        attributes: [{ ...payload.exposure.attributes[0], setAt: 1672531199400 }]
      },
      payload.agent,
      payload.application
    )
  })
})
