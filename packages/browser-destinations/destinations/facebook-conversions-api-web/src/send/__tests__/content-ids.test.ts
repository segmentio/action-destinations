import { content_ids } from '../fields'
import { formatFBEvent } from '../functions'
import { Payload } from '../generated-types'

describe('content_ids field', () => {
  describe('field definition', () => {
    it('is a multiple string field', () => {
      expect(content_ids.type).toBe('string')
      expect(content_ids.multiple).toBe(true)
    })

    // Regression guard: the field previously shipped a broken default that
    // used the disabled Liquid `map` filter
    // ({ '@liquid': "{{ properties.products | map: 'product_id' }}" }).
    // That default threw / never resolved to an array, so content_ids was
    // always dropped. We removed the default; customers configure it if
    // needed. Do NOT reintroduce a default without verifying it resolves to
    // an array of strings AND renders in the app mapping-editor UI.
    it('has no default mapping', () => {
      expect(content_ids.default).toBeUndefined()
    })

    it('is gated behind the relevant event dependencies', () => {
      expect(content_ids.depends_on).toBeDefined()
    })
  })

  describe('formatFBEvent handling of content_ids', () => {
    it('passes a provided array of ids through', () => {
      const payload: Partial<Payload> = {
        event_config: { event_name: 'ViewContent', show_fields: true },
        content_ids: ['SKU-ABC-123', 'SKU-XYZ-789']
      }

      const result = formatFBEvent(payload as Payload)

      expect(result.content_ids).toEqual(['SKU-ABC-123', 'SKU-XYZ-789'])
    })

    it('omits content_ids when it is an empty array', () => {
      const payload: Partial<Payload> = {
        event_config: { event_name: 'AddToCart', show_fields: true },
        content_ids: []
      }

      const result = formatFBEvent(payload as Payload)

      expect(result).not.toHaveProperty('content_ids')
    })

    it('omits content_ids when it is absent', () => {
      const payload: Partial<Payload> = {
        event_config: { event_name: 'Purchase', show_fields: true },
        value: 45.97
      }

      const result = formatFBEvent(payload as Payload)

      expect(result).not.toHaveProperty('content_ids')
    })
  })
})
