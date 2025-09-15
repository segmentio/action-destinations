import { Payload } from '../generated-types'
import action from '../index'

jest.mock('../../data-partner-token', () => ({
  getDataPartnerToken: jest.fn().mockResolvedValue('mocked-token')
}))
describe('Sync User Data Action', () => {
  let mockRequest: jest.Mock
  const mockSettings = { apiKey: 'test-key', advertiserAccountId: 'acc-123' } as any
  const mockAudienceSettings = { audienceId: 'aud-123', product: 'PRODUCT', productDestinationId: 'dest-456' } as any
  const mockPayload = { emailAddress: 'test@example.com', event_name: 'Audience Entered' } as any
  const mockBatchPayload = [mockPayload, { emailAddress: 'other@example.com', event_name: 'Audience Entered' }]
  const mockResponse = { success: true }

  beforeEach(() => {
    mockRequest = jest.fn().mockResolvedValue(mockResponse)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('calls request in perform with correct arguments', async () => {
    const result = await action.perform!(mockRequest, {
      settings: mockSettings,
      payload: mockPayload,
      audienceSettings: mockAudienceSettings
    })
    expect(mockRequest).toHaveBeenCalled()
    expect(result).toEqual(mockResponse)
    // Optionally, check the URL and method
    const callArgs = mockRequest.mock.calls[0][0]
    expect(callArgs).toContain('audienceMembers:ingest')
  })

  it('calls request in performBatch with correct arguments', async () => {
    const result = await action.performBatch!(mockRequest, {
      settings: mockSettings,
      payload: mockBatchPayload,
      audienceSettings: mockAudienceSettings
    })
    expect(mockRequest).toHaveBeenCalled()
    expect(result).toEqual(mockResponse)
    const callArgs = mockRequest.mock.calls[0][0]
    expect(callArgs).toContain('audienceMembers:ingest')
  })

  it('calls request for both Audience Entered and Audience Exited in performBatch', async () => {
    const enteredPayload = { emailAddress: 'entered@example.com', event_name: 'Audience Entered' } as Payload
    const exitedPayload = { emailAddress: 'exited@example.com', event_name: 'Audience Exited' } as Payload
    const batchPayload = [enteredPayload, exitedPayload]

    await action.performBatch!(mockRequest, {
      settings: mockSettings,
      payload: batchPayload,
      audienceSettings: mockAudienceSettings
    })

    // Should call ingest for Audience Entered
    expect(mockRequest.mock.calls.some((call) => call[0].includes('audienceMembers:ingest'))).toBe(true)
    // Should call remove for Audience Exited
    expect(mockRequest.mock.calls.some((call) => call[0].includes('audienceMembers:remove'))).toBe(true)

    // Optionally, check the payloads sent
    const ingestCall = mockRequest.mock.calls.find((call) => call[0].includes('audienceMembers:ingest'))
    const removeCall = mockRequest.mock.calls.find((call) => call[0].includes('audienceMembers:remove'))
    expect(
      ingestCall[1].json.audienceMembers.some(
        (m: { userData: { userIdentifiers: { emailAddress: any }[] } }) =>
          m.userData.userIdentifiers && m.userData.userIdentifiers[0].emailAddress
      )
    ).toBe(true)
    expect(
      removeCall[1].json.audienceMembers.some(
        (m: { userData: { userIdentifiers: { emailAddress: any }[] } }) =>
          m.userData.userIdentifiers && m.userData.userIdentifiers[0].emailAddress
      )
    ).toBe(true)
  })
})
