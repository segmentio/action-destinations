import type { AfterResponseHook, NormalizedOptions } from '../../request-client'
import type { ModifiedResponse } from '../../types'

const prepareResponse: AfterResponseHook = async (_request, _options, response) => {
  const modifiedResponse = response as ModifiedResponse

  // Read the body exactly once, without cloning.
  //
  // node-fetch@2's `response.clone()` tees the body into two PassThrough streams (`p1` on the
  // original, `p2` on the clone). We used to read only `p2`; nothing drained `p1`, so on payloads
  // larger than ~16KB (the default PassThrough highWaterMark) backpressure paused the socket, `p2`
  // stalled, and the read hung indefinitely (STRATCONN-7032). Reading the single stream once as a
  // buffer avoids the tee entirely — no clone, no deadlock — and is binary-safe.
  const arrayBuffer = await response.arrayBuffer()
  const content = new TextDecoder().decode(arrayBuffer)

  // We consumed the body, so re-expose the standard body accessors backed by the buffer. This keeps
  // destinations that read the raw response (`.text()` / `.json()` / `.arrayBuffer()`) working —
  // previously they relied on the clone leaving the original stream intact.
  modifiedResponse.text = async () => content
  modifiedResponse.json = async () => JSON.parse(content)
  // Return a fresh copy each call so callers can't mutate the shared buffer.
  modifiedResponse.arrayBuffer = async () => arrayBuffer.slice(0)

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
