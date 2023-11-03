import { DynamicFieldItem, DynamicFieldResponse } from '@segment/actions-core'
import QualtricsApiClient, { QualtricsApiErrorResponse } from './qualtricsApiClient'
import { RequestClient } from '@segment/actions-core'
import { ExecuteInput } from '@segment/actions-core'
import { Settings } from './generated-types'
import { HTTPError } from '@segment/actions-core'

export async function getDirectoryIds(
  request: RequestClient,
  data: ExecuteInput<Settings, unknown>
): Promise<DynamicFieldResponse> {
  const choices: DynamicFieldItem[] = []
  const apiClient = new QualtricsApiClient(data.settings.datacenter, data.settings.apiToken, request)
  try {
    const response = await apiClient.listDirectories()
    for (const directory of response.elements) {
      choices.push({
        label: `${directory.name}`,
        value: directory.directoryId
      })
    }
  } catch (err) {
    return getError(err)
  }

  return {
    choices
  }
}

async function getError(err: unknown) {
  const errResponse = (err as HTTPError)?.response
  const errorBody = (await errResponse.json()) as QualtricsApiErrorResponse
  return {
    choices: [],
    error: {
      message: errorBody?.meta?.error?.errorMessage ?? 'Unknown Error',
      code: errResponse?.status.toString() ?? '500'
    }
  }
}
