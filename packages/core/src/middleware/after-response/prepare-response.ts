import type { AfterResponseHook, NormalizedOptions } from '../../request-client'
import type { ModifiedResponse } from '../../types'

const prepareResponse: AfterResponseHook = async (_request, _options, response) => {
  const modifiedResponse = response as ModifiedResponse

  let content: string
  if (_options.skipResponseCloning) {
    // Skip cloning the response to avoid a Node crash in case the response payload is larger than 16KB
    // TODO STRATCONN-1396: Move all action-destinations to follow this code path instead of cloning the response
    content = await response.text()
  } else {
    // Clone the response before reading the body to avoid
    // `TypeError: body used already` elsewhere
    const clone = response.clone()
    content = await clone.text()
  }

  const agent: NormalizedOptions['agent'] = _options.agent
  if (agent) {
    agent.destroy()
  }

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
