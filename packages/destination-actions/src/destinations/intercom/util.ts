import dayjs from '../../lib/dayjs'

export const convertValidTimestamp = <Value = unknown>(value: Value): Value | number => {
  // Timestamps may be on a `string` field, so check if the string is only
  // numbers. If it is, ignore it since it's probably already a unix timestamp.
  // DayJS doesn't parse unix timestamps correctly outside of the `.unix()`
  // initializer.
  if (typeof value !== 'string' || /^\d+$/.test(value)) {
    return value
  }

  const maybeDate = dayjs.utc(value)

  if (maybeDate.isValid()) {
    return maybeDate.unix()
  }

  return value
}
