import { PayloadValidationError } from "@segment/actions-core"

export function formatDate(input: string): string {
  const ymdRegex = /^\d{4}-\d{2}-\d{2}$/
  if (ymdRegex.test(input)) {
    return input
  }

  const date = new Date(input)

  if (isNaN(date.getTime())) {
    throw new PayloadValidationError(`Invalid date string: ${input}`)
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}