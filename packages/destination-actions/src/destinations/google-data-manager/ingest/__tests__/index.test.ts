import nock from 'nock'
import ingest from '../index'

describe('GoogleDataManager.ingest', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should send a valid payload to the ingest endpoint', async () => {
    const payload = {
      emailAddress: 'test@test.com',
      audienceId: 'test',
      enable_batching: true
    }

    const mockRequest = jest.fn().mockResolvedValue({ status: 200 })
    const executeInput = {
      payload: payload,
      audienceSettings: {
        advertiserId: '8142508276',
        product: 'GOOGLE_ADS',
        productDestinationId: '9001371543'
      },
      settings: { productLink: 'products/DATA_PARTNER/customers/8172370552' },
      auth: {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      }
    }
    const response = await ingest.perform(mockRequest, executeInput)
    expect(response.status).toBe(200)
    expect(mockRequest).toHaveBeenCalledWith(
      'https://datamanager.googleapis.com/v1/audienceMembers:ingest',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-access-token',
          Accept: 'application/json'
        })
        // TODO: check the outbound payload structure
      })
    )
  })
})
