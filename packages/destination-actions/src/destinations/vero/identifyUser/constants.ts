export const TIMEZONE_CHOICES = Array.from({ length: 27 }, (_, i) => {
  const offset = i - 12
  return { label: offset === 0 ? 'UTC' : `UTC${offset > 0 ? '+' : ''}${offset}`, value: offset }
})
