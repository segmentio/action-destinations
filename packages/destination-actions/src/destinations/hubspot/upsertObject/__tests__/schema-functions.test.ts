import { objectSchema } from '../functions/schema-functions'
import { HSPropType, HSPropFieldType, HSPropTypeFieldType } from '../types'
import { Payload } from '../generated-types'

function makePayload(properties: Record<string, unknown>): Payload {
  return {
    object_details: {
      object_type: 'contact',
      id_field_name: 'email',
      id_field_value: 'test@test.com'
    },
    properties,
    association_sync_mode: 'upsert',
    enable_batching: true,
    batch_size: 100
  } as unknown as Payload
}

describe('objectSchema / format()', () => {
  describe('type detection', () => {
    it('classifies a date-only string as date:date', () => {
      const schema = objectSchema([makePayload({ churn_date: '2024-01-08' })], 'contact')
      const prop = schema.properties.find((p) => p.name === 'churn_date')!
      expect(prop.type).toBe(HSPropType.Date)
      expect(prop.fieldType).toBe(HSPropFieldType.Date)
      expect(prop.typeFieldType).toBe(HSPropTypeFieldType.DateDate)
    })

    it('classifies a full ISO datetime string as datetime:date', () => {
      const schema = objectSchema([makePayload({ appt_start: '2024-01-08T13:52:50.212Z' })], 'contact')
      const prop = schema.properties.find((p) => p.name === 'appt_start')!
      expect(prop.type).toBe(HSPropType.DateTime)
      expect(prop.fieldType).toBe(HSPropFieldType.Date)
      expect(prop.typeFieldType).toBe(HSPropTypeFieldType.DateTimeDate)
    })

    it('classifies a datetime string with no timezone as datetime:date', () => {
      const schema = objectSchema([makePayload({ appt_start: '2024-01-08T00:00:00' })], 'contact')
      const prop = schema.properties.find((p) => p.name === 'appt_start')!
      expect(prop.type).toBe(HSPropType.DateTime)
      expect(prop.fieldType).toBe(HSPropFieldType.Date)
      expect(prop.typeFieldType).toBe(HSPropTypeFieldType.DateTimeDate)
    })

    it('classifies a numeric epoch string as string:text', () => {
      const schema = objectSchema([makePayload({ appt_start: '1780382814' })], 'contact')
      const prop = schema.properties.find((p) => p.name === 'appt_start')!
      expect(prop.type).toBe(HSPropType.String)
      expect(prop.fieldType).toBe(HSPropFieldType.Text)
      expect(prop.typeFieldType).toBe(HSPropTypeFieldType.StringText)
    })

    it('classifies a number as number:number', () => {
      const schema = objectSchema([makePayload({ count: 42 })], 'contact')
      const prop = schema.properties.find((p) => p.name === 'count')!
      expect(prop.type).toBe(HSPropType.Number)
      expect(prop.fieldType).toBe(HSPropFieldType.Number)
      expect(prop.typeFieldType).toBe(HSPropTypeFieldType.NumberNumber)
    })

    it('classifies a boolean as enumeration:booleancheckbox', () => {
      const schema = objectSchema([makePayload({ active: true })], 'contact')
      const prop = schema.properties.find((p) => p.name === 'active')!
      expect(prop.type).toBe(HSPropType.Enumeration)
      expect(prop.fieldType).toBe(HSPropFieldType.BooleanCheckbox)
      expect(prop.typeFieldType).toBe(HSPropTypeFieldType.EnumerationBooleanCheckbox)
    })

    it('classifies a plain string as string:text', () => {
      const schema = objectSchema([makePayload({ name: 'hello' })], 'contact')
      const prop = schema.properties.find((p) => p.name === 'name')!
      expect(prop.type).toBe(HSPropType.String)
      expect(prop.fieldType).toBe(HSPropFieldType.Text)
      expect(prop.typeFieldType).toBe(HSPropTypeFieldType.StringText)
    })
  })
})
