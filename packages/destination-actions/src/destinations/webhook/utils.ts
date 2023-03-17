export function encodeHeader(headers: Record<string, string>): Record<string, string> {
  Object.keys(headers).map((header) => {
    headers[header] = encodeURIComponent(headers[header])
  })
  return headers
}
