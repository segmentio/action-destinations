import { getDataPartnerToken } from './data-partner-token'
import { GoogleAuth } from 'google-auth-library'

jest.mock('google-auth-library')

const mockGetClient = jest.fn()
const mockGetAccessToken = jest.fn()

describe('getDataPartnerToken', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Do not set env var here; set it only in tests that need it
    ;(GoogleAuth as jest.Mock).mockImplementation(() => ({
      getClient: mockGetClient
    }))
    mockGetClient.mockResolvedValue({
      getAccessToken: mockGetAccessToken
    })
  })

  test('throws if env var is missing', async () => {
    delete process.env.ACTIONS_GOOGLE_DATA_MANAGER_CLIENT_CREDENTIALS
    await expect(getDataPartnerToken()).rejects.toThrow(/Missing service account key/)
  })

  test('throws if env var is invalid JSON', async () => {
    process.env.ACTIONS_GOOGLE_DATA_MANAGER_CLIENT_CREDENTIALS = 'not-json'
    await expect(getDataPartnerToken()).rejects.toThrow(/Invalid service account key JSON/)
  })

  test('throws if token is not returned', async () => {
    process.env.ACTIONS_GOOGLE_DATA_MANAGER_CLIENT_CREDENTIALS = JSON.stringify({
      client_email: 'test@test.com',
      private_key: 'fake-key'
    })
    mockGetAccessToken.mockResolvedValue({})
    await expect(getDataPartnerToken()).rejects.toThrow(/Failed to obtain access token/)
  })

  test('returns a token on success', async () => {
    process.env.ACTIONS_GOOGLE_DATA_MANAGER_CLIENT_CREDENTIALS = JSON.stringify({
      client_email: 'test@test.com',
      private_key: 'fake-key'
    })
    mockGetAccessToken.mockResolvedValue({ token: 'abc123' })
    const token = await getDataPartnerToken()
    expect(token).toBe('abc123')
  })

  test('returns cached token if not expired', async () => {
    process.env.ACTIONS_GOOGLE_DATA_MANAGER_CLIENT_CREDENTIALS = JSON.stringify({
      client_email: 'test@test.com',
      private_key: 'fake-key'
    })
    mockGetAccessToken.mockResolvedValue({ token: 'first-token' })
    const first = await getDataPartnerToken()
    mockGetAccessToken.mockResolvedValue({ token: 'second-token' })
    const second = await getDataPartnerToken()
    expect(second).toBe(first)
  })
})
