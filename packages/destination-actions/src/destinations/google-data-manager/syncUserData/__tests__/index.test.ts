import action from '../index'
import { processHashing } from '../../../../lib/hashing-utils'
import { AuthTokens } from '@segment/actions-core/destination-kit/parse-settings'
import { Payload } from '../generated-types'

describe('Google Data Manager Sync User Data Action', () => {
  const settings = {
    advertiserAccountId: '123456'
  }
  const audienceSettings = {
    product: 'CUSTOM_AUDIENCE',
    productDestinationId: 'aud_dest_1'
  }
  const auth: AuthTokens = { accessToken: 'test-token', refreshToken: 'refresh_token' }

  const requestMock = jest.fn()

  beforeEach(() => {
    requestMock.mockClear()
  })

  it('should ingest a single audience member with email', async () => {
    const payload = { emailAddress: 'test@example.com', enable_batching: false, batch_size: 3 }
    await action.perform(requestMock, { settings, audienceSettings, payload, auth })
    expect(requestMock).toHaveBeenCalledWith(
      expect.stringContaining('audienceMembers:ingest'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        json: expect.objectContaining({
          audienceMembers: [
            expect.objectContaining({
              userData: expect.objectContaining({
                userIdentifiers: [
                  expect.objectContaining({
                    emailAddress: processHashing('test@example.com', 'sha256', 'hex')
                  })
                ]
              })
            })
          ]
        })
      })
    )
  })

  it('should ingest a single audience member with phone', async () => {
    const payload = { phoneNumber: '+1234567890', enable_batching: false, batch_size: 3 }
    await action.perform(requestMock, { settings, audienceSettings, payload, auth })
    expect(requestMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        json: expect.objectContaining({
          audienceMembers: [
            expect.objectContaining({
              userData: expect.objectContaining({
                userIdentifiers: [
                  expect.objectContaining({
                    phoneNumber: processHashing('+1234567890', 'sha256', 'hex')
                  })
                ]
              })
            })
          ]
        })
      })
    )
  })

  it('should ingest a single audience member with address', async () => {
    const payload = {
      givenName: 'John',
      familyName: 'Doe',
      regionCode: 'US',
      postalCode: '90210',
      enable_batching: false,
      batch_size: 3
    }
    await action.perform(requestMock, { settings, audienceSettings, payload, auth })
    expect(requestMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        json: expect.objectContaining({
          audienceMembers: [
            expect.objectContaining({
              userData: expect.objectContaining({
                userIdentifiers: [
                  expect.objectContaining({
                    address: expect.objectContaining({
                      givenName: processHashing('John', 'sha256', 'hex'),
                      familyName: processHashing('Doe', 'sha256', 'hex'),
                      regionCode: 'US',
                      postalCode: '90210'
                    })
                  })
                ]
              })
            })
          ]
        })
      })
    )
  })

  it('should ingest multiple audience members in batch', async () => {
    const payloads: Payload[] = [
      { emailAddress: 'a@b.com', enable_batching: true, batch_size: 3 },
      { phoneNumber: '+1111111111', enable_batching: true, batch_size: 3 },
      {
        givenName: 'Jane',
        familyName: 'Smith',
        regionCode: 'CA',
        postalCode: 'A1A1A1',
        enable_batching: true,
        batch_size: 3
      }
    ]
    await action.performBatch?.(requestMock, { settings, payload: payloads, audienceSettings, auth })
    expect(requestMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        json: expect.objectContaining({
          audienceMembers: [
            expect.objectContaining({
              userData: expect.objectContaining({
                userIdentifiers: [expect.objectContaining({ emailAddress: processHashing('a@b.com', 'sha256', 'hex') })]
              })
            }),
            expect.objectContaining({
              userData: expect.objectContaining({
                userIdentifiers: [
                  expect.objectContaining({ phoneNumber: processHashing('+1111111111', 'sha256', 'hex') })
                ]
              })
            }),
            expect.objectContaining({
              userData: expect.objectContaining({
                userIdentifiers: [
                  expect.objectContaining({
                    address: expect.objectContaining({
                      givenName: processHashing('Jane', 'sha256', 'hex'),
                      familyName: processHashing('Smith', 'sha256', 'hex'),
                      regionCode: 'CA',
                      postalCode: 'A1A1A1'
                    })
                  })
                ]
              })
            })
          ]
        })
      })
    )
  })

  it('should throw error if access token is missing', async () => {
    const payload = { emailAddress: 'test@example.com', enable_batching: true, batch_size: 3 }
    await expect(action.perform(requestMock, { settings, audienceSettings, payload })).rejects.toThrow(
      'Missing access token.'
    )
  })
})
