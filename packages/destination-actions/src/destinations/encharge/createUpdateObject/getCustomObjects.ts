import { enchargeRestAPIBase } from '../utils'
import { DynamicFieldResponse, RequestClient } from '@segment/actions-core'

export const getCustomObjects = async (request: RequestClient): Promise<DynamicFieldResponse> => {
  try {
    type ObjectsSchemaResponse = {
      objects: { name: string; displayNameSingular: string }[]
    }
    // docs at https://app-encharge-resources.s3.amazonaws.com/redoc.html#tag/CustomObjectsSchema/operation/GetCustomObjectsSchema
    const response = await request<ObjectsSchemaResponse>(`${enchargeRestAPIBase}/schemas`, {
      method: 'GET'
    })

    const choices = response?.data?.objects.map((object) => ({
      label: object.displayNameSingular,
      value: object.name
    }))
    return {
      choices
    }
  } catch (err) {
    return {
      choices: [],
      error: {
        message: (err as Error)?.message,
        code: (err as Error)?.name
      }
    }
  }
}
