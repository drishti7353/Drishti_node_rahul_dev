const morgan = require("morgan");
// const config = require('./config');
const logger = require("./logger");
morgan.token("workerId", () => cluster.worker?.id?.toString() || "N/A");

// const customFormat = `:workerId :method :url :status :response-time ms - :res[content-length]`;
// app.use(morgan(customFormat));

morgan.token("message", (req, res) => res.locals.errorMessage || "");

const getIpFormat = () => "";
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

const successHandler = morgan(successResponseFormat, {
  skip: (req, res) => res.statusCode >= 400,
  stream: { write: (message) => logger.info(message.trim()) },
});

const errorHandler = morgan(errorResponseFormat, {
  skip: (req, res) => res.statusCode < 400,
  stream: { write: (message) => logger.error(message.trim()) },
});

module.exports = {
  successHandler,
  errorHandler,
};
