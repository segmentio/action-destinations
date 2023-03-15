import { Logger } from 'ecs-logs-js'

const logger = new Logger({
  level: process.env.LOG_LEVEL || 'debug',
  devMode: true
})

export default logger
