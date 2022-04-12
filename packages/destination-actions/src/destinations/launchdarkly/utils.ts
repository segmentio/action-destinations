import dayjs from '../../lib/dayjs'
const BULK_EVENTS_BASE_URL = 'https://events.launchdarkly.com/events/bulk'

export const getEventsUrl = (clientID: string) => {
  return `${BULK_EVENTS_BASE_URL}/${clientID}`
}

export const parseTimestamp = (ts?: string | number): number => {
  const d = dayjs(ts)
  if (!d.isValid()) {
    return new Date().getTime()
  }
  return d.valueOf()
}
