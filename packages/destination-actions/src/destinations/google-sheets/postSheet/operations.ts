type Fields = {
  [k: string]: string
}

const processGetSpreadsheetResponse = (response: any, eventMap: Map<string, Fields>) => {
  // TODO: Fail request if above row limit

  const updateBatch: { identifier: string; event: Fields; targetIndex: number }[] = []
  if (response.data.values && response.data.values.length > 0) {
    for (let i = 1; i < response.data.values.length; i++) {
      const targetIdentifier = response.data.values[i][0]
      if (eventMap.has(targetIdentifier)) {
        updateBatch.push({
          identifier: targetIdentifier,
          event: eventMap.get(targetIdentifier) as Fields,
          targetIndex: i
        })
        eventMap.delete(targetIdentifier)
      }
    }
  }

  const appendBatch: { identifier: string; event: Fields }[] = []
  eventMap.forEach((value, key) => {
    appendBatch.push({
      identifier: key,
      event: value
    })
  })

  return { appendBatch, updateBatch }
}

export { processGetSpreadsheetResponse }
