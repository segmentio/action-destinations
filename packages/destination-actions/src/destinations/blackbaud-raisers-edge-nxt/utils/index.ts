import { StringIndexedObject } from '../types'

export const dateStringToFuzzyDate = (dateString: string | number) => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    // invalid date object
    return false
  } else {
    // valid date object
    // convert date to a "Fuzzy date"
    // https://developer.blackbaud.com/skyapi/renxt/constituent/entities#FuzzyDate
    return {
      d: date.getDate().toString(),
      m: (date.getMonth() + 1).toString(),
      y: date.getFullYear().toString()
    }
  }
}

export const filterObjectListByMatchFields = (
  list: StringIndexedObject[],
  data: StringIndexedObject,
  matchFields: string[]
) => {
  return list.find((item: StringIndexedObject) => {
    let isMatch: boolean | undefined = undefined
    matchFields.forEach((field: string) => {
      if (isMatch !== false) {
        let fieldName = field
        if (field.startsWith('int:')) {
          fieldName = field.split('int:')[1]
        }
        let itemValue = item[fieldName] ? item[fieldName].toLowerCase() : ''
        let dataValue = data[fieldName] ? data[fieldName].toLowerCase() : ''
        if (field.startsWith('int:')) {
          itemValue = itemValue.replace(/\D/g, '')
          dataValue = dataValue.replace(/\D/g, '')
        }
        isMatch = itemValue === dataValue
      }
    })
    return isMatch
  })
}

export const isRequestErrorRetryable = (statusCode: number) => {
  return statusCode === 429 || statusCode >= 500
}
