// Logger event types and log levels for use across the backend

export enum EventType {
  USER_REQ = 'USER_REQ',
  USER_ERR = 'USER_ERR',
  SERVER_ERR = 'SERVER_ERR',
  SERVER_MSG = 'SERVER_MSG',
}

export type LogLevel = 'info' | 'error' | 'warn' | 'debug' | 'verbose' | 'http' | 'silly';

export type EventTypeLoggerFn = (message: string, meta?: any) => void;

export type LoggerWithEventTypes = {
  [L in LogLevel]: ((message: string, meta?: any) => void) & {
    [E in EventType]: EventTypeLoggerFn;
  };
};

export const severityMapping: Record<LogLevel, string> = {
  error: 'ERROR',
  warn: 'WARNING',
  info: 'INFO',
  http: 'NOTICE',
  verbose: 'DEBUG',
  debug: 'DEBUG',
  silly: 'DEBUG',
};
