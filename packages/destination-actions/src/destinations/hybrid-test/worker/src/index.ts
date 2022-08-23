import type { Payload as ProspectsPayload } from './prospects-generated-types'
import type { Settings } from './settings-generated-types'

async function handleRequest(event) {
  const request = event.request
  const json = await event.request.json()
  // Authorization
  const psk = request.headers.get('Cloudflare-Auth-Token')
  if (psk != CLOUDFLARE_AUTH_TOKEN_VALUE) {
    console.log(json)
    // Correct preshared header key supplied. Fetch request from origin.
    return new Response('INVLIAD TOKEN', {
      status: 403
    })
  }
  const { pathname } = new URL(request.url)
  const settings = json.settings as Settings

  /**
   * Prospects Route
   * @param {Request} Payload
   * @returns {Promise<Response>}
   */
  if (pathname.startsWith('/prospects')) {
    const payload = json.payload as ProspectsPayload
    const baseUrl = settings.isSandbox ? 'https://pi.demo.pardot.com' : 'https://pi.pardot.com'
    const url = `${baseUrl}/api/v5/objects/prospects/do/upsertLatestByEmail`
    const data = buildProspectJSON(payload)

    const newRequestInit = {
      method: 'POST',
      body: JSON.stringify({
        matchEmail: payload.email,
        prospect: data,
        secondaryDeletedSearch: payload.secondaryDeletedSearch
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const AC = new Actions(request, url)
    return AC.perform(newRequestInit)
  }
}

class Actions {
  request: Request
  url: string

  constructor(request: Request, url: string) {
    this.request = request
    this.url = url
  }

  perform = async (newRequestInit: RequestInit) => {
    const newRequest = new Request(this.url, newRequestInit)
    this.request.headers.forEach((headerValue, key) => {
      newRequest.headers.set(key, headerValue)
    })
    newRequest.headers.delete('Cloudflare-Auth-Token')
    try {
      return await fetch(newRequest)
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 })
    }
  }
}

// Helper function defined by Partner
function ProspectsShape(payload: ProspectsPayload) {
  return {
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    salutation: payload.salutation,
    phone: payload.phone,
    company: payload.company,
    jobTitle: payload.jobTitle,
    industry: payload.industry,
    city: payload.city,
    state: payload.state,
    zip: payload.zip,
    country: payload.country,
    website: payload.website
  }
}

function buildProspectJSON(payload: ProspectsPayload) {
  let baseShape = ProspectsShape(payload)

  if (payload.customFields) {
    baseShape = { ...baseShape, ...payload.customFields }
  }

  return baseShape
}

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event).catch((err) => new Response(err.stack, { status: 500 })))
})
