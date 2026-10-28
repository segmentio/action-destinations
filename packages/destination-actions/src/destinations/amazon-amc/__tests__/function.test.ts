import { createPayloadToUploadRecords, processBatchPayload } from '../function'
import type { RequestClient } from '@segment/actions-core'
import type { Payload } from '../syncAudiencesToDSP/generated-types'
import { FLAG_AUDIENCE_MEMBERSHIP } from '../utils'
import type { AudienceSettings, Settings } from '../generated-types'

const audienceSettings = { countryCode: 'US' } as AudienceSettings
const features = { [FLAG_AUDIENCE_MEMBERSHIP]: true }
const settings = { region: 'https://advertising-api.amazon.com' } as Settings

const payload = (event_name?: string, externalUserId = 'user-1'): Payload => ({
  event_name,
  externalUserId,
  audienceId: '123',
  email: 'test@twilio.com'
})

describe('Amazon AMC audience action resolution', () => {
  describe('createPayloadToUploadRecords', () => {
    it('uses event_name when it is Audience Entered or Audience Exited, ignoring audienceMembership', () => {
      const { records } = createPayloadToUploadRecords(
        [payload('Audience Entered'), payload('Audience Exited')],
        audienceSettings,
        features,
        [false, true]
      )
      expect(records.map((r) => r.action)).toEqual(['CREATE', 'DELETE'])
    })

    it('falls back to audienceMembership when event_name is not an audience event', () => {
      const { records } = createPayloadToUploadRecords(
        [payload('Some Other Event'), payload(undefined)],
        audienceSettings,
        features,
        [true, false]
      )
      expect(records.map((r) => r.action)).toEqual(['CREATE', 'DELETE'])
    })

    it('defaults to DELETE when neither event_name nor audienceMembership resolve', () => {
      const { records } = createPayloadToUploadRecords([payload(undefined)], audienceSettings, features)
      expect(records[0].action).toBe('DELETE')
    })
  })

  describe('processBatchPayload', () => {
    it('resolves each record using its own audienceMembership entry', async () => {
      const request = jest.fn().mockResolvedValue({ ok: true, status: 202, data: {} })
      await processBatchPayload(
        request as unknown as RequestClient,
        settings,
        [payload('Audience Entered', 'user-1'), payload(undefined, 'user-2'), payload(undefined, 'user-3')],
        audienceSettings,
        features,
        [false, true, false]
      )
      const body = JSON.parse(request.mock.calls[0][1].body as string)
      expect(body.records.map((r: { action: string }) => r.action)).toEqual(['CREATE', 'CREATE', 'DELETE'])
    })

    it('keeps audienceMembership aligned with payloads when an invalid externalUserId is skipped mid-batch', async () => {
      const request = jest.fn().mockResolvedValue({ ok: true, status: 202, data: {} })
      const response = await processBatchPayload(
        request as unknown as RequestClient,
        settings,
        [payload(undefined, 'user-1'), payload(undefined, 'bad id!'), payload(undefined, 'user-3')],
        audienceSettings,
        features,
        [true, true, false]
      )
      const body = JSON.parse(request.mock.calls[0][1].body as string)
      expect(body.records.map((r: { externalUserId: string; action: string }) => [r.externalUserId, r.action])).toEqual([
        ['user-1', 'CREATE'],
        ['user-3', 'DELETE']
      ])
      expect(response.length()).toBe(3)
      expect(response.isErrorResponseAtIndex(1)).toBe(true)
      expect(response.isSuccessResponseAtIndex(0)).toBe(true)
      expect(response.isSuccessResponseAtIndex(2)).toBe(true)
    })
  })
})
