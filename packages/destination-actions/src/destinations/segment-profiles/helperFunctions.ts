export function generateSegmentAPIAuthHeaders(writeKey: string): string {
  // Segment's Tracking API uses HTTP Basic Authentication with the
  // Source Write Key. A colon needs to be added to the end of the
  // write key and then base64 encoded. Eg: BASE64(WriteKey + ':')
  return `Basic ${Buffer.from(writeKey + ':').toString('base64')}`
}
