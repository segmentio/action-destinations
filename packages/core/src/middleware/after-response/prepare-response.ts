import type { AfterResponseHook, NormalizedOptions } from '../../request-client'
import type { ModifiedResponse } from '../../types'

const prepareResponse: AfterResponseHook = async (_request, _options, response) => {
  const modifiedResponse = response as unknown as ModifiedResponse
  // We're consuming the body here. Since it can only be read once,
  // the ModifiedResponse strips away methods that would throw a `Type Error` if called.
  const content = await response.text()

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
