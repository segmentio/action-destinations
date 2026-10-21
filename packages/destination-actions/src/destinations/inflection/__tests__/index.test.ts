import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { PRODUCTION_URL, TESTING_URL } from '../constants'
import { flattenValues } from '../functions'

const testDestination = createTestIntegration(Destination)
const settings = { apiKey: 'test-key', environment: 'production' }
const timestamp = '2026-08-19T13:55:37.959Z'

describe('Inflection', () => {
  afterEach(() => nock.cleanAll())

  describe('track', () => {
    it('sends the expected payload with basic auth', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('track', {
        settings,
        event: createTestEvent({
          type: 'track',
          event: 'Signed Up',
          userId: '583',
          anonymousId: 'anon-1',
          messageId: 'msg-1',
          timestamp,
          properties: { plan: 'pro', nested: { a: 1 }, list: [1, 2] },
          context: { groupId: 'group-1' }
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.headers?.get('authorization')).toBe('Basic dGVzdC1rZXk6')
      expect(responses[0].options.json).toEqual({
        type: 'track',
        event: 'Signed Up',
        userId: '583',
        anonymousId: 'anon-1',
        messageId: 'msg-1',
        timestamp,
        properties: { plan: 'pro', nested: '{"a":1}', list: '[1,2]' },
        context: { groupId: 'group-1' }
      })
    })

    it('omits context when there is no group ID', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('track', {
        settings,
        event: createTestEvent({ type: 'track', event: 'Signed Up', userId: '583', timestamp, context: {} }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).not.toHaveProperty('context')
    })

    it('rejects an event without a userId', async () => {
      await expect(
        testDestination.testAction('track', {
          settings,
          event: createTestEvent({ type: 'track', event: 'Signed Up', userId: undefined, timestamp }),
          useDefaultMappings: true
        })
      ).rejects.toThrowError("The root value is missing the required field 'userId'.")
    })
  })

  describe('identify', () => {
    it('merges email into traits and stringifies nested values', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('identify', {
        settings,
        event: createTestEvent({
          type: 'identify',
          userId: '583',
          messageId: 'msg-1',
          timestamp,
          traits: { email: 'a@b.com', address: { city: 'Toronto' } }
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).toMatchObject({
        type: 'identify',
        userId: '583',
        traits: { email: 'a@b.com', address: '{"city":"Toronto"}' }
      })
    })

    it('rejects an event without an email', async () => {
      await expect(
        testDestination.testAction('identify', {
          settings,
          event: createTestEvent({ type: 'identify', userId: '583', timestamp, traits: {} }),
          useDefaultMappings: true
        })
      ).rejects.toThrowError("The root value is missing the required field 'email'.")
    })
  })

  describe('group', () => {
    it('sends the expected payload', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('group', {
        settings,
        event: createTestEvent({
          type: 'group',
          userId: '583',
          groupId: 'group-1',
          messageId: 'msg-1',
          timestamp,
          traits: { name: 'Acme', meta: ['x'] }
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).toMatchObject({
        type: 'group',
        userId: '583',
        groupId: 'group-1',
        traits: { name: 'Acme', meta: '["x"]' }
      })
    })

    it('rejects an event without a groupId', async () => {
      await expect(
        testDestination.testAction('group', {
          settings,
          event: createTestEvent({ type: 'group', userId: '583', groupId: undefined, timestamp }),
          useDefaultMappings: true
        })
      ).rejects.toThrowError("The root value is missing the required field 'groupId'.")
    })
  })

  describe('string trimming', () => {
    it('trims identifiers and string values in track', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('track', {
        settings,
        event: createTestEvent({
          type: 'track',
          event: '  Signed Up ',
          userId: ' 583 ',
          anonymousId: ' anon-1 ',
          messageId: ' msg-1 ',
          timestamp,
          properties: { plan: ' pro ', count: 2 },
          context: { groupId: ' group-1 ' }
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).toEqual({
        type: 'track',
        event: 'Signed Up',
        userId: '583',
        anonymousId: 'anon-1',
        messageId: 'msg-1',
        timestamp,
        properties: { plan: 'pro', count: 2 },
        context: { groupId: 'group-1' }
      })
    })

    it('trims the email and trait values in identify', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('identify', {
        settings,
        event: createTestEvent({
          type: 'identify',
          userId: ' 583 ',
          messageId: 'msg-1',
          timestamp,
          traits: { email: 'a@b.com', name: ' Ada ' }
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).toMatchObject({
        userId: '583',
        traits: { email: 'a@b.com', name: 'Ada' }
      })
    })

    it('trims group identifiers and traits', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('group', {
        settings,
        event: createTestEvent({
          type: 'group',
          userId: ' 583 ',
          groupId: ' group-1 ',
          messageId: 'msg-1',
          timestamp,
          traits: { name: ' Acme ' }
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).toMatchObject({
        userId: '583',
        groupId: 'group-1',
        traits: { name: 'Acme' }
      })
    })

    it('rejects a required value that is only whitespace', async () => {
      await expect(
        testDestination.testAction('track', {
          settings,
          event: createTestEvent({ type: 'track', event: 'Signed Up', userId: '   ', timestamp }),
          useDefaultMappings: true
        })
      ).rejects.toThrowError('User ID must not be empty.')
    })

    it('omits a group ID that is only whitespace in track', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('track', {
        settings,
        event: createTestEvent({
          type: 'track',
          event: 'Signed Up',
          userId: '583',
          timestamp,
          context: { groupId: '   ' }
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).not.toHaveProperty('context')
    })

    it('rejects an email padded with whitespace at schema validation', async () => {
      await expect(
        testDestination.testAction('identify', {
          settings,
          event: createTestEvent({
            type: 'identify',
            userId: '583',
            timestamp,
            traits: { email: ' a@b.com ' }
          }),
          useDefaultMappings: true
        })
      ).rejects.toThrowError('Email must be a valid email address string but it was not.')
    })
  })

  describe('empty values', () => {
    it('omits empty optional fields and empty trait/property values from track', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('track', {
        settings,
        event: createTestEvent({
          type: 'track',
          event: 'Signed Up',
          userId: '583',
          anonymousId: '',
          messageId: 'msg-1',
          timestamp,
          properties: { a: null, b: '', c: '  ', d: {}, e: [], f: 0, g: false, h: 'x' },
          context: {}
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).toEqual({
        type: 'track',
        event: 'Signed Up',
        userId: '583',
        messageId: 'msg-1',
        timestamp,
        properties: { f: 0, g: false, h: 'x' }
      })
    })

    it('omits properties entirely when every value is empty', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('track', {
        settings,
        event: createTestEvent({
          type: 'track',
          event: 'Signed Up',
          userId: '583',
          timestamp,
          properties: { a: null, b: '' }
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).not.toHaveProperty('properties')
    })

    it('sends only the email in identify traits when other traits are empty', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('identify', {
        settings,
        event: createTestEvent({
          type: 'identify',
          userId: '583',
          anonymousId: undefined,
          timestamp,
          traits: { email: 'a@b.com', name: null, plan: '' }
        }),
        useDefaultMappings: true
      })

      const json = responses[0].options.json as Record<string, unknown>
      expect(json.traits).toEqual({ email: 'a@b.com' })
      expect(json).not.toHaveProperty('anonymousId')
    })

    it('omits empty group traits', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('group', {
        settings,
        event: createTestEvent({
          type: 'group',
          userId: '583',
          groupId: 'group-1',
          timestamp,
          traits: { name: '' }
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).not.toHaveProperty('traits')
    })
  })

  describe('nested value handling', () => {
    const traits = {
      email: 'a@example.com',
      address: { city: 'dublin', postalCode: 'ads234', street: '23 arcadia st', geo: { lat: 53.3 } },
      tags: ['a', 'b'],
      contacts: [{ name: 'x' }, { name: 'y' }],
      empty: {}
    }

    const identify = async (handling: Record<string, unknown>) => {
      nock(PRODUCTION_URL).post('/').reply(200, {})
      const responses = await testDestination.testAction('identify', {
        settings,
        event: createTestEvent({ type: 'identify', userId: '583', timestamp, traits }),
        useDefaultMappings: true,
        mapping: { nestedValueHandling: handling }
      })
      return (responses[0].options.json as { traits: Record<string, unknown> }).traits
    }

    it('stringifies objects and arrays by default', async () => {
      const result = await identify({})
      expect(result.address).toBe('{"city":"dublin","postalCode":"ads234","street":"23 arcadia st","geo":{"lat":53.3}}')
      expect(result.tags).toBe('["a","b"]')
    })

    it('flattens objects into parent_key fields', async () => {
      const result = await identify({ objectHandling: 'flatten' })
      expect(result).toMatchObject({
        address_city: 'dublin',
        address_postalCode: 'ads234',
        address_street: '23 arcadia st',
        address_geo_lat: 53.3,
        tags: '["a","b"]'
      })
      expect(result).not.toHaveProperty('address')
      expect(result).not.toHaveProperty('empty')
    })

    it('flattens arrays into indexed fields', async () => {
      const result = await identify({ arrayHandling: 'flatten' })
      expect(result).toMatchObject({ tags_0: 'a', tags_1: 'b', contacts_0: '{"name":"x"}', contacts_1: '{"name":"y"}' })
      expect(result).not.toHaveProperty('tags')
    })

    it('flattens objects and arrays together', async () => {
      const result = await identify({ objectHandling: 'flatten', arrayHandling: 'flatten' })
      expect(result).toMatchObject({ address_city: 'dublin', tags_0: 'a', contacts_0_name: 'x', contacts_1_name: 'y' })
    })

    it('joins arrays into a comma-separated string', async () => {
      const result = await identify({ arrayHandling: 'join' })
      expect(result).toMatchObject({ tags: 'a,b', contacts: '{"name":"x"},{"name":"y"}' })
    })

    it('applies to track properties and group traits', async () => {
      nock(PRODUCTION_URL).post('/').twice().reply(200, {})
      const track = await testDestination.testAction('track', {
        settings,
        event: createTestEvent({
          type: 'track',
          event: 'Signed Up',
          userId: '583',
          timestamp,
          properties: { plan: { name: 'pro' } }
        }),
        useDefaultMappings: true,
        mapping: { nestedValueHandling: { objectHandling: 'flatten' } }
      })
      const group = await testDestination.testAction('group', {
        settings,
        event: createTestEvent({
          type: 'group',
          userId: '583',
          groupId: 'g1',
          timestamp,
          traits: { hq: { city: 'x' } }
        }),
        useDefaultMappings: true,
        mapping: { nestedValueHandling: { objectHandling: 'flatten' } }
      })
      expect(track[0].options.json).toMatchObject({ properties: { plan_name: 'pro' } })
      expect(group[0].options.json).toMatchObject({ traits: { hq_city: 'x' } })
    })
  })

  describe('flattenValues', () => {
    const stringify = { objects: 'stringify', arrays: 'stringify' }
    const flattenObjects = { objects: 'flatten', arrays: 'stringify' }
    const flattenArrays = { objects: 'stringify', arrays: 'flatten' }
    const flattenBoth = { objects: 'flatten', arrays: 'flatten' }
    const joinArrays = { objects: 'stringify', arrays: 'join' }
    const flattenObjectsJoinArrays = { objects: 'flatten', arrays: 'join' }

    describe('object and array handling combinations', () => {
      it('stringifies objects and arrays at every depth by default', () => {
        expect(flattenValues({ a: { b: [1, 2] }, c: [{ d: 1 }] }, stringify)).toEqual({
          a: '{"b":[1,2]}',
          c: '[{"d":1}]'
        })
      })

      it('uses stringify when no options are given', () => {
        expect(flattenValues({ a: { b: 1 }, c: [1] })).toEqual({ a: '{"b":1}', c: '[1]' })
      })

      it('flattens objects but stringifies arrays inside them', () => {
        expect(flattenValues({ a: { b: [1, 2], c: { d: 'x' } } }, flattenObjects)).toEqual({
          a_b: '[1,2]',
          a_c_d: 'x'
        })
      })

      it('flattens arrays but stringifies objects inside them and objects holding arrays', () => {
        expect(flattenValues({ a: [{ b: 1 }, 'x'], c: { d: [1, 2] } }, flattenArrays)).toEqual({
          a_0: '{"b":1}',
          a_1: 'x',
          c: '{"d":[1,2]}'
        })
      })

      it('flattens objects and arrays nested in each other', () => {
        expect(flattenValues({ a: [{ b: 1, c: [2, 3] }], d: { e: [{ f: 'x' }] } }, flattenBoth)).toEqual({
          a_0_b: 1,
          a_0_c_0: 2,
          a_0_c_1: 3,
          d_e_0_f: 'x'
        })
      })

      it('flattens nested arrays of arrays by index', () => {
        expect(flattenValues({ a: [[1, 2], [3]] }, flattenBoth)).toEqual({ a_0_0: 1, a_0_1: 2, a_1_0: 3 })
      })

      it('joins arrays found inside flattened objects', () => {
        expect(flattenValues({ a: { tags: ['x', 'y'], b: { c: ['z'] } } }, flattenObjectsJoinArrays)).toEqual({
          a_tags: 'x,y',
          a_b_c: 'z'
        })
      })

      it('joins arrays but stringifies objects when objects are not flattened', () => {
        expect(flattenValues({ a: { tags: ['x', 'y'] }, tags: ['x', 'y'] }, joinArrays)).toEqual({
          a: '{"tags":["x","y"]}',
          tags: 'x,y'
        })
      })

      it('leaves scalar values and top-level keys unchanged under every combination', () => {
        for (const options of [stringify, flattenObjects, flattenArrays, flattenBoth, joinArrays]) {
          expect(flattenValues({ name: 'x', n: 1, b: true }, options)).toEqual({ name: 'x', n: 1, b: true })
        }
      })
    })

    describe('join', () => {
      it('joins mixed scalars with a comma and no spaces', () => {
        expect(flattenValues({ a: ['a', 1, true, 2.5] }, joinArrays)).toEqual({ a: 'a,1,true,2.5' })
      })

      it('trims items and drops null, undefined and empty items', () => {
        expect(flattenValues({ a: [' a ', null, '', undefined, '  ', 'b'] }, joinArrays)).toEqual({ a: 'a,b' })
      })

      it('keeps zero and false items', () => {
        expect(flattenValues({ a: [0, false] }, joinArrays)).toEqual({ a: '0,false' })
      })

      it('omits an empty array and an array with only empty items', () => {
        expect(flattenValues({ a: [], b: [null, '', ' '] }, joinArrays)).toBeUndefined()
      })

      it('stringifies objects and nested arrays that are items of the array', () => {
        expect(flattenValues({ a: [{ b: 1 }, [2, 3]] }, joinArrays)).toEqual({ a: '{"b":1},[2,3]' })
      })
    })

    describe('flatten', () => {
      it('keeps original indexes when array items are dropped', () => {
        expect(flattenValues({ a: ['x', null, '', 'y'] }, flattenArrays)).toEqual({ a_0: 'x', a_3: 'y' })
      })

      it('omits empty objects and empty arrays', () => {
        expect(flattenValues({ a: {}, b: [], c: { d: {} }, e: [[]] }, flattenBoth)).toBeUndefined()
      })

      it('keeps the other keys when only some nested values are empty', () => {
        expect(flattenValues({ a: { b: {}, c: 'x' }, d: [] }, flattenBoth)).toEqual({ a_c: 'x' })
      })

      it('trims flattened strings and drops empty ones', () => {
        expect(flattenValues({ a: { b: ' x ', c: '  ', d: null } }, flattenObjects)).toEqual({ a_b: 'x' })
      })

      it('keeps zero and false in flattened objects and arrays', () => {
        expect(flattenValues({ a: { b: 0, c: false }, d: [0, false] }, flattenBoth)).toEqual({
          a_b: 0,
          a_c: false,
          d_0: 0,
          d_1: false
        })
      })

      it('keeps keys that already contain the separator', () => {
        expect(flattenValues({ a: { b_c: 1 } }, flattenObjects)).toEqual({ a_b_c: 1 })
      })

      it('lets the later key win when a flattened key matches an existing key', () => {
        expect(flattenValues({ address: { city: 'a' }, address_city: 'b' }, flattenObjects)).toEqual({
          address_city: 'b'
        })
        expect(flattenValues({ address_city: 'b', address: { city: 'a' } }, flattenObjects)).toEqual({
          address_city: 'a'
        })
      })
    })

    describe('invalid input', () => {
      it('falls back to stringify for unknown handling values', () => {
        expect(flattenValues({ a: { b: 1 }, c: [1] }, { objects: 'nope', arrays: 'nope' })).toEqual({
          a: '{"b":1}',
          c: '[1]'
        })
      })

      it('returns undefined for missing or empty input', () => {
        expect(flattenValues(undefined, flattenBoth)).toBeUndefined()
        expect(flattenValues({}, flattenBoth)).toBeUndefined()
      })
    })
  })

  describe('array handling through the actions', () => {
    const send = async (
      action: 'track' | 'group',
      event: Record<string, unknown>,
      nestedValueHandling: Record<string, unknown>
    ) => {
      nock(PRODUCTION_URL).post('/').reply(200, {})
      const responses = await testDestination.testAction(action, {
        settings,
        event: createTestEvent({ timestamp, userId: '583', ...event }),
        useDefaultMappings: true,
        mapping: { nestedValueHandling }
      })
      return responses[0].options.json as Record<string, Record<string, unknown>>
    }

    it('flattens track property arrays and objects together', async () => {
      const json = await send(
        'track',
        { type: 'track', event: 'Signed Up', properties: { tags: ['a', 'b'], plan: { name: 'pro' } } },
        { objectHandling: 'flatten', arrayHandling: 'flatten' }
      )
      expect(json.properties).toEqual({ tags_0: 'a', tags_1: 'b', plan_name: 'pro' })
    })

    it('joins track property arrays', async () => {
      const json = await send(
        'track',
        { type: 'track', event: 'Signed Up', properties: { tags: ['a', 'b'] } },
        { arrayHandling: 'join' }
      )
      expect(json.properties).toEqual({ tags: 'a,b' })
    })

    it('flattens group trait arrays and joins them', async () => {
      const flattened = await send(
        'group',
        { type: 'group', groupId: 'g1', traits: { tags: ['a', 'b'] } },
        { arrayHandling: 'flatten' }
      )
      expect(flattened.traits).toEqual({ tags_0: 'a', tags_1: 'b' })

      const joined = await send(
        'group',
        { type: 'group', groupId: 'g1', traits: { tags: ['a', 'b'] } },
        { arrayHandling: 'join' }
      )
      expect(joined.traits).toEqual({ tags: 'a,b' })
    })

    it('omits properties when flattening leaves nothing', async () => {
      const json = await send(
        'track',
        { type: 'track', event: 'Signed Up', properties: { a: {}, b: [] } },
        { objectHandling: 'flatten', arrayHandling: 'flatten' }
      )
      expect(json).not.toHaveProperty('properties')
    })

    it('lets identify email win over a flattened trait with the same key', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})
      const responses = await testDestination.testAction('identify', {
        settings,
        event: createTestEvent({
          type: 'identify',
          userId: '583',
          timestamp,
          traits: { email: 'a@example.com', contact: { email: 'other@example.com' } }
        }),
        useDefaultMappings: true,
        mapping: { nestedValueHandling: { objectHandling: 'flatten' } }
      })
      expect((responses[0].options.json as { traits: Record<string, unknown> }).traits).toEqual({
        email: 'a@example.com',
        contact_email: 'other@example.com'
      })
    })

    it('sends the email once, dropping email traits that differ only by case', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})
      const responses = await testDestination.testAction('identify', {
        settings,
        event: createTestEvent({
          type: 'identify',
          userId: '583',
          timestamp,
          traits: { email: 'a@example.com', Email: 'b@example.com', EMAIL: 'c@example.com', plan: 'pro' }
        }),
        useDefaultMappings: true
      })
      expect((responses[0].options.json as { traits: Record<string, unknown> }).traits).toEqual({
        email: 'a@example.com',
        plan: 'pro'
      })
    })
  })

  describe('audience details', () => {
    const personas = (computation_key = 'high_value_customers') => ({
      personas: { computation_class: 'audience', computation_key }
    })
    const identifyTraits = async (event: object, mapping: object = {}) => {
      nock(PRODUCTION_URL).post('/').reply(200, {})
      const responses = await testDestination.testAction('identify', {
        settings,
        event: createTestEvent({ type: 'identify', userId: '583', timestamp, ...event }),
        useDefaultMappings: true,
        mapping
      })
      return (responses[0].options.json as { traits: Record<string, unknown> }).traits
    }
    const trackProperties = async (event: object, mapping: object = {}) => {
      nock(PRODUCTION_URL).post('/').reply(200, {})
      const responses = await testDestination.testAction('track', {
        settings,
        event: createTestEvent({ type: 'track', event: 'Audience Entered', userId: '583', timestamp, ...event }),
        useDefaultMappings: true,
        mapping
      })
      return (responses[0].options.json as { properties?: Record<string, unknown> }).properties
    }

    it('sends an Engage identify audience as a boolean trait', async () => {
      const traits = await identifyTraits({
        context: personas(),
        traits: { email: 'a@example.com', high_value_customers: true }
      })
      expect(traits).toEqual({ email: 'a@example.com', high_value_customers: true })
    })

    it('sends false when the user leaves an Engage identify audience', async () => {
      const traits = await identifyTraits({
        context: personas(),
        traits: { email: 'a@example.com', high_value_customers: false }
      })
      expect(traits).toEqual({ email: 'a@example.com', high_value_customers: false })
    })

    it('sends an Engage track audience as a boolean property', async () => {
      const properties = await trackProperties({
        context: personas(),
        properties: { audience_key: 'high_value_customers', high_value_customers: true }
      })
      expect(properties).toEqual({ audience_key: 'high_value_customers', high_value_customers: true })
    })

    it('renames the audience and removes the original Engage key when the name is overridden', async () => {
      const traits = await identifyTraits(
        { context: personas(), traits: { email: 'a@example.com', high_value_customers: true } },
        { audienceDetails: { audienceName: 'vip' } }
      )
      expect(traits).toEqual({ email: 'a@example.com', vip: true })
    })

    it('lets the membership field override the Engage value', async () => {
      const traits = await identifyTraits(
        { context: personas(), traits: { email: 'a@example.com', high_value_customers: true } },
        { audienceDetails: { audienceName: 'high_value_customers', audienceMembership: false } }
      )
      expect(traits).toEqual({ email: 'a@example.com', high_value_customers: false })
    })

    it('uses the sync mode for a Reverse ETL add', async () => {
      const properties = await trackProperties(
        { event: 'new', properties: { plan: 'pro' } },
        { __segment_internal_sync_mode: 'add', audienceDetails: { audienceName: 'pro_users' } }
      )
      expect(properties).toEqual({ plan: 'pro', pro_users: true })
    })

    it('uses the sync mode for a Reverse ETL delete', async () => {
      const properties = await trackProperties(
        { event: 'deleted', properties: { plan: 'pro' } },
        { __segment_internal_sync_mode: 'delete', audienceDetails: { audienceName: 'pro_users' } }
      )
      expect(properties).toEqual({ plan: 'pro', pro_users: false })
    })

    it('sends the audience alone when there are no other properties', async () => {
      const properties = await trackProperties(
        { event: 'new', properties: {} },
        { __segment_internal_sync_mode: 'add', audienceDetails: { audienceName: 'pro_users' } }
      )
      expect(properties).toEqual({ pro_users: true })
    })

    it('sends no audience when there is a name but no membership', async () => {
      const properties = await trackProperties(
        { properties: { plan: 'pro' } },
        { audienceDetails: { audienceName: 'pro_users' } }
      )
      expect(properties).toEqual({ plan: 'pro' })
    })

    it('sends no audience when there is a membership but no name', async () => {
      const properties = await trackProperties(
        { properties: { plan: 'pro' } },
        { audienceDetails: { audienceMembership: true } }
      )
      expect(properties).toEqual({ plan: 'pro' })
    })

    it('trims the audience name', async () => {
      const properties = await trackProperties(
        { properties: {} },
        { audienceDetails: { audienceName: '  pro_users  ', audienceMembership: true } }
      )
      expect(properties).toEqual({ pro_users: true })
    })

    it('never lets an audience named email replace the email trait', async () => {
      const traits = await identifyTraits(
        { traits: { email: 'a@example.com' } },
        { audienceDetails: { audienceName: 'Email', audienceMembership: true } }
      )
      expect(traits).toEqual({ email: 'a@example.com' })
    })

    it('lets the audience win over a trait with the same name', async () => {
      const traits = await identifyTraits(
        { traits: { email: 'a@example.com', pro_users: 'maybe' } },
        { audienceDetails: { audienceName: 'pro_users', audienceMembership: true } }
      )
      expect(traits).toEqual({ email: 'a@example.com', pro_users: true })
    })
  })

  describe('environment', () => {
    it('posts to the testing URL when the testing environment is selected', async () => {
      nock(TESTING_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('track', {
        settings: { ...settings, environment: 'testing' },
        event: createTestEvent({ type: 'track', event: 'Signed Up', userId: '583', timestamp }),
        useDefaultMappings: true
      })

      expect(responses[0].url).toBe(TESTING_URL)
    })
  })
})
