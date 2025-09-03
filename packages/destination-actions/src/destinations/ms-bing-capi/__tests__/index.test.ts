import { createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import { v4 as uuidv4 } from '@lukeed/uuid'
import destination from '../index'
import { API_URL } from '../constants'

// Mock the uuid to ensure consistent test results
jest.mock('@lukeed/uuid')
const mockUuidv4 = uuidv4 as jest.MockedFunction<typeof uuidv4>

const testDestination = createTestIntegration(destination)

const settings = {
  UetTag: 'test-uet-tag',
  ApiToken: 'test-api-token'
}

describe('MS Bing CAPI', () => {
  beforeEach(() => {
    nock.cleanAll()
    mockUuidv4.mockReturnValue('00000000-0000-0000-0000-000000000000')
  })

  it('should authenticate with correct credentials', async () => {
    const authRequestNock = nock(API_URL)
      .get(`/test-uet-tag/events`)
      .matchHeader('Authorization', 'Bearer test-api-token')
      .reply(200, {})

    const authResponse = await testDestination.testAuthentication({
      settings
    })

    expect(authResponse).toEqual({})
    expect(authRequestNock.isDone()).toBe(true)
  })

  it('should throw error on authentication failure', async () => {
    nock(API_URL).get(`/test-uet-tag/events`).reply(401, { error: 'Invalid credentials' })

    await expect(
      testDestination.testAuthentication({
        settings
      })
    ).rejects.toThrow()
  })

  describe('extendRequest', () => {
    it('should add correct authorization headers', () => {
      const { headers } = destination.extendRequest?.({ settings }) || {}

      expect(headers).toEqual({
        Authorization: 'Bearer test-api-token',
        'Content-Type': 'application/json'
      })
    })
  })
})
