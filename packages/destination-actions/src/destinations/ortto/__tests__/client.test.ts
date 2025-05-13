import { InvalidAuthenticationError, PayloadValidationError } from '@segment/actions-core'
import { Errors } from '../ortto-client'
import OrttoClient from '../ortto-client'
import { Settings } from '../generated-types'
import { TEST_API_KEY } from '../types'

const settings: Settings = {
  api_key: TEST_API_KEY
}

describe('Ortto.Client', () => {

  it('createAudience: should validate API key', async () => {
    const fakeRequest = jest.fn().mockResolvedValue({
      data: {} // no errors in response
    })

    const client = new OrttoClient(fakeRequest)
    const response = client.createAudience(
      {
        api_key: 'invalid api key'
      },
      'audience name'
    )
    await expect(response).rejects.toThrowError(new InvalidAuthenticationError(Errors.InvalidAPIKey))
    expect(fakeRequest).not.toHaveBeenCalled()
  })

  it('createAudience: should validate empty audience name', async () => {
    const fakeRequest = jest.fn().mockResolvedValue({
      data: {} // no errors in response
    })

    const client = new OrttoClient(fakeRequest)
    const response = client.createAudience(settings, '')
    await expect(response).rejects.toThrowError(new PayloadValidationError(Errors.MissingAudienceName))
    expect(fakeRequest).not.toHaveBeenCalled()
  })
})
