import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';
import { severityMapping } from '../../types/logger';

const { combine, timestamp, printf, errors } = format;

const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFormat = printf(({ level, message, timestamp, stack, eventType }) => {
  const severity = severityMapping[level] || 'DEFAULT';
  const eventPrefix = eventType ? `[${eventType}] ` : '';
  return `[${timestamp}] [${severity}] ${eventPrefix}${stack || message}`;
});

// File rotation setup (Stores logs locally)
const errorsFileRotateTransport = new DailyRotateFile({
  filename: `${logDir}/errors-%DATE%.log`,
  level: 'error',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '60d', // Keep logs for 60 days
});

const combinedFileRotateTransport = new DailyRotateFile({
  filename: `${logDir}/combined-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '60d',
});

const productionLogger = () => {
  return createLogger({
    level: 'info',
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat),
    transports: [new transports.Console(), errorsFileRotateTransport, combinedFileRotateTransport],
    defaultMeta: { service: 'twaran-backend' },
  });
};

export default productionLogger;
