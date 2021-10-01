import type { AfterResponseHook } from '../../request-client'
import type { ModifiedResponse } from '../../types'

const prepareResponse: AfterResponseHook = async (_request, _options, response) => {
  const modifiedResponse = response as ModifiedResponse

  // Clone the response before reading the body to avoid
  // `TypeError: body used already` elsewhere
  const clone = response.clone()
  const content = await clone.text()
  let data: unknown

  try {
    if (modifiedResponse.headers.get('content-type')?.includes('application/json')) {
      data = JSON.parse(content)
    } else {
      // TODO handle form urlencoded responses?
      data = content
    }
  } catch (_error) {
    // do nothing
  }

  modifiedResponse.content = content
  modifiedResponse.data = data

  return modifiedResponse
}

export default prepareResponse
