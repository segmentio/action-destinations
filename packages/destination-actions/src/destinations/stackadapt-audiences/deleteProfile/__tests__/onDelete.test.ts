import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { SegmentEvent } from '@segment/actions-core/*'

const testDestination = createTestIntegration(Definition)
const mockGqlKey = 'test-graphql-key'

const gqlHostUrl = 'https://api.stackadapt.com'
const gqlPath = '/graphql'
const mockUserId = 'user-id'
const mockAdvertiserId = '23'
const mockMappings = { advertiser_id: mockAdvertiserId }

const deleteEventPayload: Partial<SegmentEvent> = {
  userId: mockUserId,
  type: 'identify',
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'first_time_buyer',
      computation_id: 'aud_123'
    }
  }
}

// Helper function to mock the token query response
const mockTokenQueryResponse = (nodes: Array<{ advertiser: { id: string } }>) => {
  nock(gqlHostUrl)
    .post(gqlPath)
    .reply(200, {
      data: {
        tokenInfo: {
          scopesByAdvertiser: {
            nodes: nodes
          }
        }
      }
    })
}

// Helper function to mock the profile deletion mutation
const mockDeleteProfilesMutation = (
  deleteRequestBodyRef: { body?: any },
  userErrors: Array<{ message: string }> = []
) => {
  nock(gqlHostUrl)
    .post(gqlPath, (body) => {
      deleteRequestBodyRef.body = body
      return body
    })
    .reply(200, {
      data: {
        deleteProfilesWithExternalIds: {
          userErrors: userErrors
        }
      }
    })
}
// helper for expected delete profiles mutation
const expectDeleteProfilesMutation = (
  deleteRequestBody: { body?: any },
  expectedExternalIds: string[],
  expectedAdvertiserIds: string[]
) => {
  expect(deleteRequestBody.body).toMatchInlineSnapshot(`
    Object {
      "query": "mutation {
          deleteProfilesWithExternalIds(
            externalIds: [\\"${expectedExternalIds.join('\\", \\"')}\\"],
            advertiserIDs: [\\"${expectedAdvertiserIds.join('\\", \\"')}\\"],
            externalProvider: \\"segmentio\\"
          ) {
            userErrors {
              message
              path
            }
          }
        }",
    }
  `)
}

describe('onDelete action', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should delete a profile successfully', async () => {
    const deleteRequestBody: { body?: any } = {}

    mockTokenQueryResponse([{ advertiser: { id: mockAdvertiserId } }])
    mockDeleteProfilesMutation(deleteRequestBody)

    const event = createTestEvent({
      userId: mockUserId,
      type: 'identify',
      context: {
        personas: {
          computation_class: 'audience',
          computation_key: 'first_time_buyer',
          computation_id: 'aud_123'
        }
      }
    })

    const responses = await testDestination.testAction('onDelete', {
      event,
      useDefaultMappings: true,
      mapping: { userId: mockUserId },
      settings: { apiKey: mockGqlKey }
    })

    expect(responses.length).toBe(2)
    expectDeleteProfilesMutation(deleteRequestBody, ['user-id'], ['23'])
  })

  it('should throw error if no advertiser ID is found', async () => {
    mockTokenQueryResponse([]) // Pass an empty array to mock no advertiser IDs

    const event = createTestEvent(deleteEventPayload)

    await expect(
      testDestination.testAction('onDelete', {
        event,
        useDefaultMappings: true,
        mapping: mockMappings,
        settings: { apiKey: mockGqlKey }
      })
    ).rejects.toThrow('No advertiser ID found.')
  })

  it('should throw error if profile deletion fails', async () => {
    const deleteRequestBody: { body?: any } = {}

    mockTokenQueryResponse([{ advertiser: { id: mockAdvertiserId } }])
    mockDeleteProfilesMutation(deleteRequestBody, [{ message: 'Deletion failed' }])

    const event = createTestEvent(deleteEventPayload)

    await expect(
      testDestination.testAction('onDelete', {
        event,
        useDefaultMappings: true,
        mapping: mockMappings,
        settings: { apiKey: mockGqlKey }
      })
    ).rejects.toThrow('Profile deletion was not successful: Deletion failed')
  })

  it('should perform onDelete with a userID and two advertiserIDs from a single token request', async () => {
    const deleteRequestBody: { body?: any } = {}

    const event: Partial<SegmentEvent> = {
      userId: 'user-id-1',
      type: 'identify',
      traits: {
        first_time_buyer: true
      },
      context: {
        personas: {
          computation_class: 'audience',
          computation_key: 'first_time_buyer',
          computation_id: 'aud_123'
        }
      }
    }

    mockTokenQueryResponse([{ advertiser: { id: 'advertiser-id-1' } }, { advertiser: { id: 'advertiser-id-2' } }])
    mockDeleteProfilesMutation(deleteRequestBody)

    const responses = await testDestination.testAction('onDelete', {
      event,
      useDefaultMappings: true,
      mapping: { userId: 'user-id-1' },
      settings: { apiKey: mockGqlKey }
    })

    expect(responses[0].status).toBe(200)
    expectDeleteProfilesMutation(deleteRequestBody, ['user-id-1'], ['advertiser-id-1', 'advertiser-id-2'])
  })
})
