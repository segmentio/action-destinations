import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import memoraDestination from '../memora'

const destination: DestinationDefinition<Settings> = {
  ...memoraDestination,
  name: 'Memora Internal',
  slug: 'actions-memora-internal',
  actions: {
    upsertProfile: {
      ...memoraDestination.actions.upsertProfile,
      fields: {
        ...memoraDestination.actions.upsertProfile.fields,
        /**
         * Used by the Segment control plane as part of the Conversation Memory Sync feature.
         * The control plane writes this map when creating or updating a mapping, and reads it back
         * to build the event-emitter enrichment mapping that ensures the referenced Segment traits
         * are present in event payloads at runtime. Not consumed by this action itself — marked
         * unsafe_hidden so it round-trips through subscription settings without being exposed or stripped.
         */
        segment_traits_by_field: {
          label: 'Segment Traits Used',
          description:
            'Per-field map of Segment trait names referenced by each directive (keyed by stored field key). Used by the control plane to wire up event-emitter enrichment. Set automatically — do not edit manually.',
          type: 'object' as const,
          required: false,
          additionalProperties: true,
          unsafe_hidden: true
        },
        /**
         * Used by the Segment control plane as part of the Conversation Memory Sync feature.
         * The control plane writes this map when creating or updating a mapping, and reads it back
         * to populate id_sync so that the declared Segment identifiers are available as external IDs
         * at runtime. Not consumed by this action itself — marked unsafe_hidden so it round-trips
         * through subscription settings without being exposed or stripped.
         */
        segment_identifiers_by_field: {
          label: 'Segment Identifiers Used',
          description:
            'Per-field map of Segment identifier names referenced by each directive (keyed by stored field key). Used by the control plane to wire up id_sync. Set automatically — do not edit manually.',
          type: 'object' as const,
          required: false,
          additionalProperties: true,
          unsafe_hidden: true
        }
      }
    }
  }
}

export default destination
