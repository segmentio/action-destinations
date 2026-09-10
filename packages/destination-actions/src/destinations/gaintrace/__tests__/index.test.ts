import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { API_BASE } from '../api'

const testDestination = createTestIntegration(Definition)
const settings = { apiKey: 'gt_live_testkey' }

afterEach(() => {
  nock.cleanAll()
})

describe('GainTrace', () => {
  describe('testAuthentication', () => {
    it('succeeds against a real authenticated request', async () => {
      nock(API_BASE).get('/companies').query({ limit: '1' }).reply(200, { data: [] })
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrow()
    })

    it('rejects an invalid key with an actionable message', async () => {
      nock(API_BASE).get('/companies').query({ limit: '1' }).reply(401, { error: 'unauthorized' })
      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError(/API key/i)
    })
  })

  describe('authentication wiring', () => {
    it('sends the key as a bearer header and never in a body', async () => {
      let seenAuth: string | undefined
      let seenBody: unknown
      nock(API_BASE)
        .post('/events')
        .reply(function (_uri, body) {
          const raw = this.req.headers.authorization
          seenAuth = Array.isArray(raw) ? raw[0] : raw
          seenBody = body
          return [201, { data: { results: [{ status: 'inserted' }] } }]
        })

      await testDestination.testAction('trackEvent', {
        settings,
        mapping: {
          messageId: 'm-1',
          eventName: 'Report Exported',
          timestamp: '2026-03-14T09:12:00.000Z',
          userId: 'u-1'
        }
      })

      expect(seenAuth).toBe('Bearer gt_live_testkey')
      expect(JSON.stringify(seenBody)).not.toContain('gt_live_testkey')
    })
  })

  describe('onDelete', () => {
    it('deletes the subject by external id, url-encoded', async () => {
      const scope = nock(API_BASE).delete('/contacts').query({ externalId: 'user with spaces/&' }).reply(204)

      await testDestination.onDelete?.({ type: 'delete', userId: 'user with spaces/&' } as never, settings)
      expect(scope.isDone()).toBe(true)
    })
  })

  describe('presets', () => {
    it('ships presets for track, identify and group but not page', () => {
      const names = (Definition.presets ?? []).map((p) => p.name)
      expect(names).toEqual(['Track Calls', 'Identify Calls', 'Group Calls'])
    })

    it('only references actions and fields that exist', () => {
      for (const preset of Definition.presets ?? []) {
        if (preset.type !== 'automatic') continue
        const action = Definition.actions[preset.partnerAction]
        expect(action).toBeDefined()
        for (const field of Object.keys(preset.mapping ?? {})) {
          expect(Object.keys(action.fields)).toContain(field)
        }
      }
    })

    it('narrows the identify subscription so required fields are always present', () => {
      const identify = (Definition.presets ?? []).find((p) => p.name === 'Identify Calls')
      // accountExternalId is required, so an identify without a group would fail
      // delivery. Filtering it at subscription level reports it as filtered.
      expect(identify && 'subscribe' in identify && identify.subscribe).toContain('context.groupId != null')
    })
  })
})
