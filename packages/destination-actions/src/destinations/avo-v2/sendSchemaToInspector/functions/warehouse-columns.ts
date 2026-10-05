// The fields a gateway inspects besides the event properties, named the way a warehouse stores
// them as columns. They come from the mapping's fields (Context, the timestamps and the identity
// fields), keyed like a Segment event, so a customer's remapping changes what is inspected. The rules are pinned
// by the shared gateway vectors (`warehouseColumnCases`), which Avo's generated Segment Insert
// Functions and RudderStack scripts assert too: context paths joined with "_", camelCase as
// snake_case (an acronym run ends before its last capital: ABTest is ab_test), prefixed
// "context_"; arrays as their JSON string; an event property wins a name clash.
//
// Only names and types of these columns are sent: callers must never pass them to the
// encryption session or to event-spec validation, whose pass/fail results would reveal values.

type Columns = { [column: string]: unknown }

const isPlainObject = (value: unknown): value is { [key: string]: unknown } =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

export const columnName = (key: string): string =>
  key
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()

function addContextColumns(columns: Columns, prefix: string, object: { [key: string]: unknown }): void {
  for (const [key, value] of Object.entries(object)) {
    const name = `${prefix}_${columnName(key)}`
    if (isPlainObject(value)) {
      addContextColumns(columns, name, value)
    } else if (Array.isArray(value)) {
      let text: string | undefined
      try {
        text = JSON.stringify(value)
      } catch {
        text = undefined
      }
      if (text !== undefined) {
        columns[name] = text
      }
    } else if (value !== undefined) {
      columns[name] = value
    }
  }
}

const ENVELOPE_COLUMNS: Array<[string, string]> = [
  ['anonymousId', 'anonymous_id'],
  ['userId', 'user_id'],
  ['messageId', 'id'],
  ['event', 'event'],
  ['timestamp', 'timestamp'],
  ['originalTimestamp', 'original_timestamp'],
  ['sentAt', 'sent_at'],
  ['receivedAt', 'received_at']
]

// The warehouse columns to inspect for this scope, minus any the event's own properties already
// name. Builds a new object; neither the fields nor the properties are changed.
export function warehouseColumns(fields: unknown, properties: unknown, inspectedFields: string | undefined): Columns {
  if (!isPlainObject(fields) || (inspectedFields !== 'event+context' && inspectedFields !== 'everything')) {
    return {}
  }
  const columns: Columns = {}
  if (isPlainObject(fields.context)) {
    addContextColumns(columns, 'context', fields.context)
  }
  if (inspectedFields === 'everything') {
    for (const [field, name] of ENVELOPE_COLUMNS) {
      const value = fields[field]
      if (value !== undefined && value !== null) {
        columns[name] = value
      }
    }
  }
  const eventProperties = isPlainObject(properties) ? properties : {}
  for (const name of Object.keys(columns)) {
    if (Object.prototype.hasOwnProperty.call(eventProperties, name)) {
      delete columns[name]
    }
  }
  return columns
}
