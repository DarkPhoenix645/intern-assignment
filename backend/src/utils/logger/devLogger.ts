import { createLogger, format, transports } from "winston";
import { severityMapping } from "../../types/logger";
const { combine, timestamp, printf, colorize } = format;

// Usage: logger.info("message", { eventType: "USER-REQ" })
const logFormat = printf(({ level, message, timestamp, stack, eventType }) => {
  const severity = severityMapping[level] || "DEFAULT";
  const eventPrefix = eventType ? `[${eventType}] ` : "";
  return `[${timestamp}] [${severity}] ${eventPrefix}${stack || message}`;
});

const devLogger = () => {
  return createLogger({
    level: "debug",
    format: combine(
      colorize(),
      timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.errors({ stack: true }),
      logFormat
    ),
    transports: [new transports.Console()],
    defaultMeta: { service: "twaran-backend-dev" },
  });
};

export default devLogger;
