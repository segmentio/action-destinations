import nock from 'nock'
import { createTestEvent, createTestIntegration, DecoratedResponse } from '@segment/actions-core'
import Definition from '../index'
import { SegmentEvent } from '@segment/actions-core/*'

const testDestination = createTestIntegration(Definition)
const mockGqlKey = 'test-graphql-key'

const gqlHostUrl = 'https://sandbox.stackadapt.com'
const gqlPath = '/public/graphql'
const mockUserId = 'user-id'
const mockAnonymousId = 'anonymous-id'

const defaultEventPayload: Partial<SegmentEvent> = {
  userId: mockUserId
}

const anonymousIdPayload: Partial<SegmentEvent> = {
  userId: mockAnonymousId
}

describe('onDelete', () => {
  it('should send GraphQL mutation with correct headers when delete event triggered', async () => {
    let requestBody
    nock(gqlHostUrl, {
      reqheaders: {
        Authorization: `Bearer ${mockGqlKey}`
      }
    })
      .post(gqlPath, (body) => {
        requestBody = body
        return body
      })
      .reply(200, { data: { success: true } })
    const event = createTestEvent(defaultEventPayload)
    if (!testDestination.onDelete) {
      throw new Error('onDelete function not implemented')
    }
    const result = await testDestination.onDelete(event, { apiKey: mockGqlKey })
    const response = result as DecoratedResponse
    expect(response.status).toBe(200)
    expect(requestBody).toMatchInlineSnapshot(`
      Object {
        "query": "mutation {
            deleteProfiles(
              subAdvertiserId: 1,
              externalProvider: \\"segmentio\\",
              userIds: [\\"user-id\\"]
            ) {
              success
            }
          }",
      }
    `)
  })

  it('should fallback to anonymous ID if user ID is unknown', async () => {
    let requestBody: { query: string } = { query: '' }
    nock(gqlHostUrl)
      .post(gqlPath, (body) => {
        requestBody = body
        return body
      })
      .reply(200, { data: { success: true } })
    const event = createTestEvent(anonymousIdPayload)
    if (!testDestination.onDelete) {
      throw new Error('onDelete function not implemented')
    }
    await testDestination.onDelete(event, { apiKey: mockGqlKey })
    expect(requestBody.query).toMatch(new RegExp(`userIds: \\["${mockAnonymousId}"\\]`))
  })
})
