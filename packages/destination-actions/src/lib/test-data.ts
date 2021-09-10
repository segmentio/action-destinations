/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionDefinition, DestinationDefinition } from '@segment/actions-core'
import Chance from 'chance'

function setTestData(destinationName: string, type: string, fieldName?: string, format?: string) {
  const chance = new Chance(destinationName)

  let val: any
  switch (type) {
    case 'boolean':
      val = chance.bool()
      break
    case 'datetime':
      val = chance.date()
      break
    case 'integer':
      val = chance.integer()
      break
    case 'number':
      val = chance.floating({ fixed: 2 })
      break
    case 'text':
      val = chance.sentence()
      break
    case 'object':
      val = { testType: chance.string() }
      break
    default:
      val = chance.string()
      break
  }

  if (format === 'uri') val = chance.url()
  if (fieldName === 'email') val = chance.email()
  if (fieldName === 'currency') val = chance.currency()

  return val
}

function setData(eventData: any, destinationName: string, fieldName: string, field: any, data?: any) {
  const { format, multiple, type } = field

  if (!data) {
    data = setTestData(destinationName, type, fieldName, format)
  }

  eventData[fieldName] = multiple ? [data] : data
  return eventData
}

export function generateTestData(
  destination: DestinationDefinition<any>,
  action: ActionDefinition<any>,
  isRequiredOnly: boolean
) {
  let eventData: any = {}
  const settingsData: any = {}

  const authentication = destination.authentication
  const destinationName = destination.name
  if (authentication) {
    for (const settingKey in authentication.fields) {
      const { format, type } = authentication.fields[settingKey]
      settingsData[settingKey] = setTestData(destinationName, type, undefined, format)
    }
  }

  for (const [name, field] of Object.entries(action.fields)) {
    if (isRequiredOnly && !(field.required || name.includes('id'))) {
      continue
    }

    const { properties } = field

    if (properties) {
      let subData: any = {}
      const propertyFields = Object.keys(properties)
      if (isRequiredOnly) propertyFields.filter((name) => properties[name].required)

      for (const propertyName of propertyFields) {
        const property = properties[propertyName]
        subData = setData(subData, destinationName, propertyName, property)
      }

      eventData = setData(eventData, destinationName, name, field, subData)
      continue
    }

    eventData = setData(eventData, destinationName, name, field)
  }

  return [eventData, settingsData]
}
