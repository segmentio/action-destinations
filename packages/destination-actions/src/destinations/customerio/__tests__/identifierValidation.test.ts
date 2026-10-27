import nock from 'nock'
import { createTestEvent, createTestIntegration, PayloadValidationError, SegmentEvent } from '@segment/actions-core'
import CustomerIO from '../index'
import { Settings } from '../generated-types'
import { AccountRegion, VALIDATE_IDENTIFIERS_FLAG } from '../utils'

const testDestination = createTestIntegration(CustomerIO)

const settings: Settings = {
  siteId: '12345',
  apiKey: 'abcde',
  accountRegion: AccountRegion.US
}

// The fail-fast check is behind a feature flag that is off by default; these tests turn it on explicitly.
const features = { [VALIDATE_IDENTIFIERS_FLAG]: true }

const errorMessage = (fields: string) =>
  `Customer.io requires an identifier, but none was found in the payload. Map a value to at least one of: ${fields}.`

type EndToEndCase = {
  action: string
  fields: string
  // An event that resolves to no identifiers with the action's default mappings.
  event: Partial<SegmentEvent>
  // Each entry adds exactly one identifier to `event` and lists the identifiers Customer.io should receive.
  present: [string, Partial<SegmentEvent>, Record<string, string>][]
}

// Actions whose identifier fields are all optional, so a payload can reach `perform` without any identifiers.
const endToEndCases: EndToEndCase[] = [
  {
    action: 'createUpdatePerson',
    fields: 'Person ID, Email Address, Anonymous ID',
    event: { type: 'identify', userId: null, anonymousId: null, traits: {} },
    present: [
      ['Person ID', { userId: 'user_123' }, { id: 'user_123' }],
      ['Email Address', { traits: { email: 'test@example.com' } }, { email: 'test@example.com' }],
      ['Anonymous ID', { anonymousId: 'anon_123' }, { anonymous_id: 'anon_123' }]
    ]
  },
  {
    action: 'trackEvent',
    fields: 'Person ID, Anonymous ID',
    event: { type: 'track', event: 'Test Event', userId: null, anonymousId: null },
    present: [
      ['Person ID', { userId: 'user_123' }, { id: 'user_123' }],
      ['Anonymous ID', { anonymousId: 'anon_123' }, { anonymous_id: 'anon_123' }]
    ]
  },
  {
    action: 'trackPageView',
    fields: 'Person ID, Anonymous ID',
    event: { type: 'page', userId: null, anonymousId: null, properties: { url: 'https://example.com' } },
    present: [
      ['Person ID', { userId: 'user_123' }, { id: 'user_123' }],
      ['Anonymous ID', { anonymousId: 'anon_123' }, { anonymous_id: 'anon_123' }]
    ]
  },
  {
    action: 'trackScreenView',
    fields: 'Person ID, Anonymous ID',
    event: { type: 'screen', name: 'Home', userId: null, anonymousId: null },
    present: [
      ['Person ID', { userId: 'user_123' }, { id: 'user_123' }],
      ['Anonymous ID', { anonymousId: 'anon_123' }, { anonymous_id: 'anon_123' }]
    ]
  },
  {
    action: 'reportContentEvent',
    fields: 'Anonymous ID',
    event: { type: 'track', userId: null, anonymousId: null, properties: { actionType: 'viewed_content' } },
    present: [['Anonymous ID', { anonymousId: 'anon_123' }, { anonymous_id: 'anon_123' }]]
  },
  {
    action: 'deleteObject',
    fields: 'Object ID',
    event: { type: 'track', properties: {} },
    present: [['Object ID', { properties: { objectId: 'obj_123' } }, { object_id: 'obj_123', object_type_id: '1' }]]
  }
]

// Every action that sends through `sendSingle`, except `mergePeople`, with a payload that has no usable identifier.
// Several of these fields are `required`, so the framework rejects them before `perform` runs; calling `perform`
// directly checks that the action still refuses to send a request without identifiers.
const performCases: [string, Record<string, unknown>, string][] = [
  ['createUpdateDevice', { person_id: '', device_id: 'device_123', platform: 'ios' }, 'Person ID'],
  ['createUpdateObject', { id: '', user_id: 'user_123' }, 'Object ID'],
  ['createUpdatePerson', {}, 'Person ID, Email Address, Anonymous ID'],
  ['deleteDevice', { person_id: '', device_id: 'device_123' }, 'Person ID'],
  ['deleteObject', {}, 'Object ID'],
  ['deletePerson', { person_id: '' }, 'Person ID'],
  ['deleteRelationship', { person_id: 'user_123', object_id: '' }, 'Object ID'],
  ['reportContentEvent', { actionType: 'viewed_content' }, 'Anonymous ID'],
  ['suppressPerson', { person_id: '' }, 'Person ID'],
  ['trackEvent', { name: 'Test Event' }, 'Person ID, Anonymous ID'],
  ['trackPageView', { url: 'https://example.com' }, 'Person ID, Anonymous ID'],
  ['trackScreenView', { name: 'Home' }, 'Person ID, Anonymous ID'],
  ['unsuppressPerson', { person_id: '' }, 'Person ID']
]

// Actions that validate a hand-built `{ object_id, object_type_id }` rather than the payload itself. With the flag on,
// a valid object id must still let the request through, or a wrong field reference in that extraction would reject
// every valid object request once the flag is enabled.
const objectPerformCases: [string, Record<string, unknown>][] = [
  ['createUpdateObject', { id: 'obj_123', user_id: 'user_123' }],
  ['deleteRelationship', { person_id: 'user_123', object_id: 'obj_123' }]
]

describe('CustomerIO', () => {
  describe('identifier validation', () => {
    afterEach(() => {
      nock.cleanAll()
    })

    endToEndCases.forEach(({ action, fields, event, present }) => {
      describe(action, () => {
        it('should throw a PayloadValidationError without sending a request when no identifier is mapped', async () => {
          const scope = nock('https://track.customer.io').post('/api/v2/entity').reply(200, {})

          const result = testDestination.testAction(action, {
            event: createTestEvent(event),
            settings,
            features,
            useDefaultMappings: true
          })

          await expect(result).rejects.toThrow(PayloadValidationError)
          await expect(result).rejects.toThrow(errorMessage(fields))
          expect(scope.isDone()).toBe(false)
        })

        it('should send the request unchanged when the flag is off, even without an identifier', async () => {
          const scope = nock('https://track.customer.io').post('/api/v2/entity').reply(200, {})

          const responses = await testDestination.testAction(action, {
            event: createTestEvent(event),
            settings,
            useDefaultMappings: true
          })

          expect(scope.isDone()).toBe(true)
          expect(responses[0].status).toBe(200)
        })

        present.forEach(([field, extra, identifiers]) => {
          it(`should send the request when only ${field} is mapped`, async () => {
            nock('https://track.customer.io').post('/api/v2/entity').reply(200, {})

            const responses = await testDestination.testAction(action, {
              event: createTestEvent({ ...event, ...extra }),
              settings,
              features,
              useDefaultMappings: true
            })

            expect(responses.length).toBe(1)
            expect(responses[0].status).toBe(200)
            expect(responses[0].options.json).toMatchObject({ identifiers })
          })
        })
      })
    })

    performCases.forEach(([action, payload, fields]) => {
      it(`${action} should refuse to send a request when the payload has no identifier`, async () => {
        const request = jest.fn()
        const { perform } = CustomerIO.actions[action]

        await expect(
          Promise.resolve().then(() => perform(request, { payload, settings, features } as never))
        ).rejects.toThrow(new PayloadValidationError(errorMessage(fields)))
        expect(request).not.toHaveBeenCalled()
      })

      it(`${action} should still send the request when the flag is off and the payload has no identifier`, async () => {
        const request = jest.fn().mockResolvedValue({})
        const { perform } = CustomerIO.actions[action]

        await perform(request, { payload, settings } as never)

        expect(request).toHaveBeenCalledTimes(1)
      })
    })

    objectPerformCases.forEach(([action, payload]) => {
      it(`${action} should send the request with the flag on when the object id is present`, async () => {
        const request = jest.fn().mockResolvedValue({})
        const { perform } = CustomerIO.actions[action]

        await perform(request, { payload, settings, features } as never)

        expect(request).toHaveBeenCalledTimes(1)
        expect(request.mock.calls[0][1].json.identifiers).toEqual({ object_id: 'obj_123', object_type_id: '1' })
      })
    })
  })
})
