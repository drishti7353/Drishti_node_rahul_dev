/**
 * This file wraps the main server application to make it more testable
 * by exporting the Express application instance.
 */

const app = require('./server');

module.exports = app;
