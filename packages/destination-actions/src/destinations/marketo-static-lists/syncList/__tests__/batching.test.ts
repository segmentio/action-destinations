import { transform, JSONLikeObject } from '@segment/actions-core'
import action from '../index'
import { ADD_BATCH_SIZE, REMOVE_BATCH_SIZE } from '../../constants'

// Adds and removes have to land in separate batches because Marketo caps list removals at 300
// while bulk import accepts 300k. `audience_membership` is the batch key and `batch_size`
// resolves per batch, both from mapping-kit directives on the event. These tests resolve the
// action's real field defaults so the directives cannot drift from what ships.
const mapping = {
  audience_membership: action.fields.audience_membership.default,
  batch_size: action.fields.batch_size.default
} as JSONLikeObject

function resolveBatching(event: Record<string, unknown>) {
  return transform(mapping, event)
}

const personas = (computation_class: string, computation_key: string) => ({
  personas: { computation_class, computation_key, external_audience_id: '12345' }
})

describe('syncList batching directives', () => {
  describe('Engage audiences', () => {
    it('classifies an identify with a true membership trait as an add', () => {
      expect(
        resolveBatching({
          type: 'identify',
          context: personas('audience', 'my_audience'),
          traits: { my_audience: true, email: 'test@example.com' }
        })
      ).toEqual({ audience_membership: 'add', batch_size: ADD_BATCH_SIZE })
    })

    it('classifies an identify with a false membership trait as a remove', () => {
      expect(
        resolveBatching({
          type: 'identify',
          context: personas('audience', 'my_audience'),
          traits: { my_audience: false, email: 'test@example.com' }
        })
      ).toEqual({ audience_membership: 'remove', batch_size: REMOVE_BATCH_SIZE })
    })

    it('classifies Audience Entered as an add', () => {
      expect(
        resolveBatching({
          type: 'track',
          event: 'Audience Entered',
          context: personas('audience', 'my_audience'),
          properties: { my_audience: true, email: 'test@example.com' }
        })
      ).toEqual({ audience_membership: 'add', batch_size: ADD_BATCH_SIZE })
    })

    it('classifies Audience Exited as a remove', () => {
      expect(
        resolveBatching({
          type: 'track',
          event: 'Audience Exited',
          context: personas('audience', 'my_audience'),
          properties: { my_audience: false, email: 'test@example.com' }
        })
      ).toEqual({ audience_membership: 'remove', batch_size: REMOVE_BATCH_SIZE })
    })
  })

  describe('Journeys', () => {
    it('classifies a Journeys V2 entry as an add', () => {
      expect(
        resolveBatching({
          type: 'track',
          event: 'Journeys Step Entered',
          context: personas('journey_step', 'my_journey'),
          properties: { my_journey: true, email: 'test@example.com' }
        })
      ).toEqual({ audience_membership: 'add', batch_size: ADD_BATCH_SIZE })
    })

    it('classifies a Journeys V2 exit as a remove', () => {
      expect(
        resolveBatching({
          type: 'track',
          event: 'Journeys Step Entered',
          context: personas('journey_step', 'my_journey'),
          properties: { my_journey: false, email: 'test@example.com' }
        })
      ).toEqual({ audience_membership: 'remove', batch_size: REMOVE_BATCH_SIZE })
    })

    // Legacy Journeys V1 carries no boolean at properties[computation_key] and is always an add.
    it('classifies a legacy Journeys V1 event as an add', () => {
      expect(
        resolveBatching({
          type: 'track',
          event: 'Journeys Step Entered',
          context: personas('journey_step', 'my_journey'),
          properties: { email: 'test@example.com' }
        })
      ).toEqual({ audience_membership: 'add', batch_size: ADD_BATCH_SIZE })
    })
  })

  // RETL carries no membership boolean, and syncMode is only readable from the mapping.
  // The event name is the only signal available to a directive.
  describe('RETL', () => {
    it.each(['new', 'updated'])('classifies a %s row as an add', (event) => {
      expect(
        resolveBatching({
          type: 'track',
          event,
          context: personas('audience', 'my_audience'),
          properties: { email: 'test@example.com' }
        })
      ).toEqual({ audience_membership: 'add', batch_size: ADD_BATCH_SIZE })
    })

    it('classifies a deleted row as a remove', () => {
      expect(
        resolveBatching({
          type: 'track',
          event: 'deleted',
          context: personas('audience', 'my_audience'),
          properties: { email: 'test@example.com' }
        })
      ).toEqual({ audience_membership: 'remove', batch_size: REMOVE_BATCH_SIZE })
    })

    it.each(['new', 'updated', 'deleted'])('classifies a %s row with no personas context', (event) => {
      const expected = event === 'deleted' ? REMOVE_BATCH_SIZE : ADD_BATCH_SIZE
      expect(resolveBatching({ type: 'track', event, properties: { email: 'test@example.com' } })).toEqual({
        audience_membership: event === 'deleted' ? 'remove' : 'add',
        batch_size: expected
      })
    })
  })

  describe('field wiring', () => {
    it('batches on audience_membership', () => {
      expect(action.fields.batch_keys.default).toEqual(['audience_membership'])
    })

    it('hides batch_size so a manual override cannot break the removal cap', () => {
      expect(action.fields.batch_size.unsafe_hidden).toBe(true)
      expect(action.fields.batch_size.maximum).toBe(300000)
    })
  })
})
