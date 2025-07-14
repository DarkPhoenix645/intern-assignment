import devLogger from "./devLogger";
import prodLogger from "./prodLogger";
import type { Logger as WinstonLogger } from "winston";
import { EventType, LogLevel, LoggerWithEventTypes } from "../../types/logger";

export type CustomLogger = WinstonLogger & LoggerWithEventTypes;

const EVENT_TYPES = [
  EventType.USER_REQ,
  EventType.USER_ERR,
  EventType.SERVER_ERR,
  EventType.SERVER_MSG,
];
const LOG_LEVELS: LogLevel[] = [
  "info",
  "error",
  "warn",
  "debug",
  "verbose",
  "http",
  "silly",
];

const baseLogger: WinstonLogger =
  process.env.NODE_ENV === "production" ? prodLogger() : devLogger();

const logger = baseLogger as CustomLogger;

for (const level of LOG_LEVELS) {
  logger[level] = logger[level].bind(logger);
  for (const eventType of EVENT_TYPES) {
    (logger[level] as any)[eventType] = (message: string, meta: any = {}) =>
      logger[level](message, { ...meta, eventType });
  }
}

export default logger;
