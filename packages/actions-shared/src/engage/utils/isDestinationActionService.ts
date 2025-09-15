export function isDestinationActionService() {
  // https://github.com/segmentio/integrations/blob/544b9d42b17f453bb6fcb48925997f68480ca1da/.k2/destination-actions-service.yaml#L35-L38
  return (
    process.env.DESTINATIONS_ACTION_SERVICE === 'true' || process.env.SERVICE_NAME === 'destination-actions-service'
  )
}
