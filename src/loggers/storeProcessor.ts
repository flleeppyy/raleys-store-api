import { createLogger, format as winstonFormat, transports } from "winston";

const logger = createLogger({
  level: "info",
  format: winstonFormat.combine(
    winstonFormat.timestamp(),
    winstonFormat.errors({ stack: true }),
    winstonFormat.splat(),
    winstonFormat.colorize(),
  ),
  defaultMeta: { service: "raleys-store-api-store-processor" },
  transports: [
    new transports.Console({
      format: winstonFormat.simple(),
    }),
    new transports.File({
      filename: "logs/storeProcessor/error.log",
      level: "error",
    }),
    new transports.File({
      filename: "logs/storeProcessor/latest.log",
    }),
    new transports.File({
      filename: "logs/storeProcessor/info.log",
      level: "info",
    }),
  ],
});

logger.info("storeProcessor Logger initialized");

export default logger;
