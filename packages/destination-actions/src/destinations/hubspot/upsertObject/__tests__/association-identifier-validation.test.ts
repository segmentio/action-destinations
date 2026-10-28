import { PayloadValidationError } from '@segment/actions-core'
import { validate } from '../functions/validation-functions'
import { Payload } from '../generated-types'
import { SyncMode } from '../types'

type Association = NonNullable<Payload['associations']>[number]

const association = {
  object_type: 'company',
  association_label: 'HUBSPOT_DEFINED:279',
  id_field_name: 'kompany',
  id_field_value: 'company_id_1'
}

function makePayload(overrides: Partial<Payload> = {}): Payload {
  return {
    object_details: {
      object_type: 'contact',
      id_field_name: 'email',
      id_field_value: 'test@test.com',
      property_group: 'contactinformation'
    },
    association_sync_mode: 'upsert',
    associations: [],
    ...overrides
  } as Payload
}

describe('Hubspot.upsertObject validate: hs_object_id as an associated record identifier', () => {
  describe('when the Associated Record Sync Mode is Create', () => {
    it('throws a PayloadValidationError', () => {
      const payload = makePayload({ associations: [{ ...association, id_field_name: 'hs_object_id' }] })

      expect(() => validate([payload])).toThrow(PayloadValidationError)
    })

    it('uses a 400 status so the error is not retried', () => {
      const payload = makePayload({ associations: [{ ...association, id_field_name: 'hs_object_id' }] })

      try {
        validate([payload])
        throw new Error('validate did not throw')
      } catch (error) {
        expect(error).toBeInstanceOf(PayloadValidationError)
        expect((error as PayloadValidationError).status).toBe(400)
      }
    })

    it('tells the user what to change', () => {
      const payload = makePayload({ associations: [{ ...association, id_field_name: 'hs_object_id' }] })

      expect(() => validate([payload])).toThrow(/hs_object_id.*Create.*"Do not create".*unique property/s)
    })

    it('throws when hs_object_id is only one of several associations', () => {
      const payload = makePayload({
        associations: [
          association,
          { ...association, object_type: 'deal', id_field_name: 'hs_object_id', id_field_value: '123' }
        ]
      })

      expect(() => validate([payload])).toThrow(PayloadValidationError)
    })

    it('throws when only one payload in the batch uses hs_object_id', () => {
      const good = makePayload({ associations: [association] })
      const bad = makePayload({
        object_details: { ...makePayload().object_details, id_field_value: 'other@test.com' },
        associations: [{ ...association, id_field_name: 'hs_object_id', id_field_value: '123' }]
      })

      expect(() => validate([good, bad])).toThrow(PayloadValidationError)
    })

    it('does not throw for a custom unique property', () => {
      const payload = makePayload({ associations: [association] })

      expect(() => validate([payload])).not.toThrow()
    })

    it('does not throw for email', () => {
      const payload = makePayload({
        associations: [{ ...association, object_type: 'contact', id_field_name: 'email', id_field_value: 'a@b.com' }]
      })

      expect(() => validate([payload])).not.toThrow()
    })

    it('does not throw when there are no associations', () => {
      expect(() => validate([makePayload({ associations: [] })])).not.toThrow()
      expect(() => validate([makePayload({ associations: undefined })])).not.toThrow()
    })

    it('does not throw when the main record is identified by hs_object_id and associations use another property', () => {
      const payload = makePayload({
        object_details: { ...makePayload().object_details, id_field_name: 'hs_object_id', id_field_value: '123' },
        associations: [association]
      })

      expect(() => validate([payload])).not.toThrow()
    })

    it('ignores an hs_object_id association whose value is empty, because it is never sent', () => {
      const payload = makePayload({
        associations: [{ ...association, id_field_name: 'hs_object_id', id_field_value: '' }]
      })

      expect(() => validate([payload])).not.toThrow()
    })

    it('ignores an hs_object_id association whose value is null, because it is never sent', () => {
      const payload = makePayload({
        associations: [{ ...association, id_field_name: 'hs_object_id', id_field_value: null as unknown as string }]
      })

      expect(() => validate([payload])).not.toThrow()
    })

    it('ignores an hs_object_id association whose value is missing (undefined), because it is never sent', () => {
      const missing = {
        object_type: 'company',
        association_label: 'HUBSPOT_DEFINED:279',
        id_field_name: 'hs_object_id'
      }
      const payload = makePayload({
        associations: [missing as unknown as Association]
      })

      expect(() => validate([payload])).not.toThrow()
    })

    it('still throws when one hs_object_id association has a value and another is missing', () => {
      const missing = {
        object_type: 'company',
        association_label: 'HUBSPOT_DEFINED:279',
        id_field_name: 'hs_object_id'
      }
      const payload = makePayload({
        associations: [
          missing as unknown as Association,
          { ...association, id_field_name: 'hs_object_id', id_field_value: '123' }
        ]
      })

      expect(() => validate([payload])).toThrow(PayloadValidationError)
    })

    it('does not check dissociations, which always read records', () => {
      const payload = makePayload({
        associations: [association],
        dissociations: [{ ...association, id_field_name: 'hs_object_id', id_field_value: '123' }]
      })

      expect(() => validate([payload])).not.toThrow()
    })

    it('keeps returning the cleaned payloads when the identifiers are valid', () => {
      const payloads = [makePayload({ associations: [association] }), makePayload({ associations: [] })]

      expect(validate(payloads)).toHaveLength(2)
    })
  })

  describe('when the Associated Record Sync Mode is Do not create', () => {
    it('does not throw for hs_object_id, because batch/read accepts it', () => {
      const payload = makePayload({
        association_sync_mode: 'read',
        associations: [{ ...association, id_field_name: 'hs_object_id', id_field_value: '123' }]
      })

      expect(() => validate([payload])).not.toThrow()
    })

    it('does not throw for a mix of hs_object_id and other identifiers', () => {
      const payload = makePayload({
        association_sync_mode: 'read',
        associations: [association, { ...association, id_field_name: 'hs_object_id', id_field_value: '123' }]
      })

      expect(() => validate([payload])).not.toThrow()
    })
  })

  describe('when the Associated Record Sync Mode is not a known value', () => {
    it.each([[SyncMode.Upsert], [SyncMode.Add], [undefined]])(
      'throws when the main record sync mode is %s',
      (syncMode) => {
        const payload = makePayload({
          associations: [{ ...association, id_field_name: 'hs_object_id', id_field_value: '123' }]
        })

        expect(() => validate([payload], syncMode)).toThrow(PayloadValidationError)
      }
    )

    it('does not throw when the main record sync mode is Update, because those events succeed today when the main identifier is not hs_object_id', () => {
      const payload = makePayload({
        associations: [{ ...association, id_field_name: 'hs_object_id', id_field_value: '123' }]
      })

      expect(() => validate([payload], SyncMode.Update)).not.toThrow()
    })

    it('does not throw, matching how the fixture in validate.test.ts uses an arbitrary mode', () => {
      const payload = makePayload({
        association_sync_mode: 'sync',
        associations: [{ ...association, id_field_name: 'hs_object_id', id_field_value: '123' }]
      })

      expect(() => validate([payload])).not.toThrow()
    })
  })
})
