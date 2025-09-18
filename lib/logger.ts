import pino from 'pino'

// Basic pino instance with sensible defaults. In production can be extended to pino.transport for log shipping.
// Falls back to console if pino unavailable (should not happen if dep installed).

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

export const logger = pino({
  level,
  redact: ['req.headers.authorization', 'password', 'token'],
  base: { service: 'ccframe-web' },
  timestamp: pino.stdTimeFunctions.isoTime
})

export function childLogger(bindings: Record<string, any>) {
  return logger.child(bindings)
}

export type Logger = typeof logger
