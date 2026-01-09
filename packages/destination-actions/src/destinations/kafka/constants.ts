export const PRODUCER_TTL_MS = Number(process.env.KAFKA_PRODUCER_TTL_MS) || 0.5 * 60 * 1000 // defaults to 30 seconds

export const PRODUCER_REQUEST_TIMEOUT_MS = 4 * 1000 // defaults to 10 seconds

export const FLAGON_NAME = 'actions-kafka-optimize-connection'
