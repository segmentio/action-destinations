import { RequestClient } from '@segment/actions-core'
import type { Payload } from './generated-types'
import { Settings } from '../generated-types'

async function send(request: RequestClient, settings: Settings, events: Payload[]) {
  
    const url = `https://url-to-populate-audience`
    const json = {}
    const response = request(url, {
        method: 'POST',
        json
    })
}