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
    exposure: {
      publishedAt: 1672531200900,
      units: [{ type: 'anonymousId', value: 'testid' }],
      exposures: [{ experiment: 'testexp', variant: 'testvar', exposedAt: 1672531200300 }],
      goals: [],
      attributes: [{ name: 'testattr', value: 'testval', setAt: 1672531200200 }]
    }
  }

  it('should throw if exposure payload has no units', async () => {
    const request = jest.fn()

    expect(() =>
      sendExposure(
        request,
        1672531300000,
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
        1672531300000,
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
        1672531300000,
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
        1672531300000,
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
        1672531300000,
        {
          ...payload,
          exposure: { ...payload.exposure, goals: [{}] }
        },
        settings
      )
    ).toThrowError(PayloadValidationError)
  })

  it('should pass-through the exposure payload with adjusted timestamps', async () => {
    const request = jest.fn()

    await sendExposure(request, 1672531300000, payload, settings)

    expect(sendEvent).toHaveBeenCalledWith(
      request,
      settings,
      {
        ...payload.exposure,
        historic: true,
        publishedAt: 1672531300000,
        exposures: [{ ...payload.exposure.exposures[0], exposedAt: 1672531299400 }],
        attributes: [{ ...payload.exposure.attributes[0], setAt: 1672531299300 }]
      },
      payload.agent,
      payload.application
    )
  })
})
