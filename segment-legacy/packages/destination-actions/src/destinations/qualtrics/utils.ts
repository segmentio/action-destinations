export function parsedEmbeddedData(
  data: { [key: string]: unknown } | undefined
): Record<string, string | number | boolean> {
  const parsedData: Record<string, string | number | boolean> = {}
  Object.keys(data || {}).forEach((key: string) => {
    if (!data) {
      return
    }
    if (typeof data[key] === 'string') {
      parsedData[key] = data[key] as string
    } else if (typeof data[key] === 'number') {
      parsedData[key] = data[key] as number
    } else if (typeof data[key] === 'boolean') {
      parsedData[key] = data[key] as boolean
    } else {
      try {
        parsedData[key] = JSON.stringify(data)
      } catch (err) {
        parsedData[key] = data.toString()
      }
    }
  })
  return parsedData
}

export function generateRandomId(length = 16): string {
  const patternList = 'abcdefghijklmnopqrstuvwxyz123456789'
  const result = []
  for (let i = 0; i < length; i++) {
    result.push(patternList[Math.floor(Math.random() * patternList.length)])
  }
  return result.join('')
}

export function parsedTransactionDate(transactionDate: string | number | undefined): string {
  let dateObject: Date = new Date()
  if (typeof transactionDate === 'number') {
    dateObject = new Date(transactionDate)
  } else if (typeof transactionDate === 'string') {
    const parsedDate = Date.parse(transactionDate)
    if (!isNaN(parsedDate)) {
      dateObject = new Date(parsedDate)
    }
  }
  return dateObject
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d{3}Z/, '')
}
