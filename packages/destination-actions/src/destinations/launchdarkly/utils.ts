import dayjs from '../../lib/dayjs'
import { Settings } from './generated-types'
export const DEFAULT_EVENTS_HOST_NAME = 'events.launchdarkly.com'
const BULK_EVENTS_PATH = 'events/bulk'

export const getEventsUrl = (settings: Settings) => {
  const { client_id, events_host_name } = settings
  return `https://${events_host_name || DEFAULT_EVENTS_HOST_NAME}/${BULK_EVENTS_PATH}/${client_id}`
}

export const parseTimestamp = (ts?: string | number): number => {
  const d = dayjs(ts)
  if (!d.isValid()) {
    return new Date().getTime()
  }
  return d.valueOf()
}
