import type { InputField } from '@segment/actions-core'
import {
  DEFAULT_BATCH_BYTES,
  DEFAULT_BATCH_SIZE,
  DEFAULT_SCHEMA_CONTENT_TYPE,
  MAX_BATCH_SIZE,
  MIN_BATCH_SIZE
} from './constants'

// Fields shared by Send Event and Upsert Profile.

export const imsOrgId: InputField = {
  label: 'IMS Organization ID',
  description:
    'Your Adobe IMS Organization ID, ending in `@AdobeOrg`. Must be the organization that owns the streaming connection.',
  type: 'string',
  required: true
}

export const sandboxName: InputField = {
  label: 'Sandbox Name',
  description: 'Name of the AEP sandbox that holds the streaming connection, schema and dataset (for example `prod`).',
  type: 'string',
  required: true
}

export const inletId: InputField = {
  label: 'Streaming Connection (Inlet) ID',
  description:
    'The ID at the end of your HTTP API streaming endpoint URL, `https://dcs.adobedc.net/collection/<inlet ID>`. Find it in AEP under Sources → HTTP API.',
  type: 'string',
  required: true
}

export const schemaRefId: InputField = {
  label: 'Schema ID',
  description:
    'The `$id` of the XDM schema used by the dataset, for example `https://ns.adobe.com/<tenant>/schemas/<id>`.',
  type: 'string',
  required: true
}

export const schemaRefContentType: InputField = {
  label: 'Schema Content Type',
  description: 'Content type and version of the XDM schema.',
  type: 'string',
  required: true,
  default: DEFAULT_SCHEMA_CONTENT_TYPE
}

export const datasetId: InputField = {
  label: 'Dataset ID',
  description: 'ID of the AEP dataset to write to. Its schema must match the Schema ID above.',
  type: 'string',
  required: true
}

export const flowId: InputField = {
  label: 'Dataflow ID',
  description: 'ID of the dataflow attached to the HTTP API streaming connection.',
  type: 'string',
  required: true
}

export const ecid: InputField = {
  label: 'ECID',
  description:
    'Identity sent in the `ECID` namespace of `identityMap`. Primary only when no PID or custom identity is present.',
  type: 'string',
  required: false,
  default: { '@path': '$.anonymousId' }
}

export const pid: InputField = {
  label: 'PID',
  description:
    'Identity sent in the `PID` namespace of `identityMap`. Primary by default. Send Event and Upsert Profile must send the same PID for Customer Journey Analytics to join profiles to events.',
  type: 'string',
  required: false,
  default: { '@path': '$.userId' }
}

export const customIdentities: InputField = {
  label: 'Custom Identities',
  description:
    'Additional identities for `identityMap`. Each namespace must exist in AEP Identity Service. The first entry marked primary becomes the primary identity.',
  type: 'object',
  multiple: true,
  required: false,
  additionalProperties: false,
  defaultObjectUI: 'arrayeditor',
  properties: {
    namespace: {
      label: 'Namespace',
      description: 'Identity namespace code, for example `ECI` or `Email`.',
      type: 'string',
      required: true
    },
    value: {
      label: 'Value',
      description: 'Identity value.',
      type: 'string',
      required: true
    },
    primary: {
      label: 'Primary',
      description: 'Whether this identity should be the primary identity.',
      type: 'boolean',
      required: false
    }
  }
}

export const xdmMappingDescription =
  'XDM fields to send. Each key is a dotted XDM path (for example `commerce.order.priceTotal`) and each value is the Segment field or constant to write there. Paths must exist in your schema.'

export const enable_batching: InputField = {
  label: 'Batch Data',
  description: 'When enabled, events are sent to the AEP batch streaming endpoint in groups.',
  type: 'boolean',
  required: false,
  default: true
}

export const batch_size: InputField = {
  label: 'Batch Size',
  description: `Maximum number of events per request. Actual batch sizes may be smaller.`,
  type: 'number',
  required: false,
  default: DEFAULT_BATCH_SIZE,
  minimum: MIN_BATCH_SIZE,
  maximum: MAX_BATCH_SIZE
}

export const batch_bytes: InputField = {
  label: 'Batch Bytes',
  description: 'Maximum size of a request in bytes. AEP rejects requests over 1 MB.',
  type: 'number',
  required: false,
  default: DEFAULT_BATCH_BYTES,
  unsafe_hidden: true
}

// Typed literally: the framework reserves `batch_keys` and requires this exact shape.
export const batch_keys = {
  label: 'Batch Keys',
  description: 'Fields used to group events into batches. Every request targets one organization, sandbox and inlet.',
  type: 'string' as const,
  required: false as const,
  multiple: true as const,
  unsafe_hidden: true as const,
  default: ['imsOrgId', 'sandboxName', 'inletId']
}

export const commonFields = {
  imsOrgId,
  sandboxName,
  inletId,
  schemaRefId,
  schemaRefContentType,
  datasetId,
  flowId
}

export const identityFields = { ecid, pid, customIdentities }

export const batchFields = { enable_batching, batch_size, batch_bytes, batch_keys }
