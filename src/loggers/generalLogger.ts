import { createLogger, format as winstonFormat, transports } from "winston";

const logger = createLogger({
  level: "info",
  format: winstonFormat.combine(
    winstonFormat.timestamp(),
    winstonFormat.errors({ stack: true }),
    winstonFormat.splat(),
    winstonFormat.colorize(),
  ),
  defaultMeta: { service: "raleys-store-api" },
  transports: [
    new transports.Console({
      format: winstonFormat.simple(),
    }),
    new transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new transports.File({
      filename: "logs/latest.log",
    }),
    new transports.File({
      filename: "logs/info.log",
      level: "info",
    }),
  ],
});

logger.info("General Logger initialized");

export default logger;
