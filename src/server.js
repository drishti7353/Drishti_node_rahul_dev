const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const logger = require('../src/common/config/logger');
const morgan = require('../src/common/config/morgan');
const i18next = require('./middleware/i18Next');
const i18nextMiddleware = require('i18next-http-middleware');
const config = require('./common/config/config');
const cluster = require('cluster');
const os = require('os');
const sendSms = require('../src/common/utils/messageService');
const cron = require('node-cron');
const { sendEventReminders } = require('./modules/notification/notificationController'); // Adjust the path if needed
const Notification = require('./models/notification.js'); // Adjust the path as needed


const app = express();

// Remove the duplicate cron schedule code
// cron.schedule('* * * * *', async () => { ... });

// Add this line to initialize the cron job
require('./common/utils/cron')();

if (process.env.NODE_ENV !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(i18nextMiddleware.handle(i18next));

// ── Railway Health Check ─────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: dbStatus,
  });
});
// ─────────────────────────────────────────────────────────────────────────────

require("./route")(app);
// sendSms();
// Error Handling Middleware
app.use((err, req, res, next) => {
  // //   console.error(err);
  // logger.error(err);
  res.status(500).send("Internal Server Error");
});

// if (process.env.NODE_ENV !== "PRODUCTION") {
//   dotenv.config({ path: `${__dirname}/../.env.local` });
// }

mongoose.set("strictQuery", true);
mongoose.set("debug", true);

let server;
let io;

server = app.listen(config.port, '0.0.0.0', () => {
  logger.info(`Listening to port ${config.port}`);
  
  // Initialize Socket.IO
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  // Make io accessible globally (or via setter)
  global._io = io;
  // Setup namespace for nearby users
  const nearbyNamespace = io.of('/ws/nearby');
  nearbyNamespace.use((socket, next) => {
    // TODO: Add authentication logic here (token/userId)
    next();
  });
  nearbyNamespace.on('connection', (socket) => {
    console.log('User connected to /ws/nearby:', socket.id);
    socket.on('disconnect', () => {
      console.log('User disconnected from /ws/nearby:', socket.id);
    });
  });
});

mongoose
  .connect(config.mongoose.url)
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((error) => {
    logger.error("MongoDB Connection Error: " + error.message);
  });

const unexpectedErrorHandler = (error) => {
  //   console.error("Unexpected Error:", error.message);
  //   console.error(error.stack);
  logger.error(error);

  // Additional logging for OAuth2 errors
  if (error.name === "TokenError") {
    //   console.error("OAuth2 Token Error:", error.message);
    //   console.error("OAuth2 Token Error Description:", error.description);
    //   console.error("OAuth2 Token Error Code:", error.code);
  }

  exitHandler();
};

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      mongoose.connection.close(false, () => {
        logger.info("MongoDB connection closed");
        process.exit(1);
      });
    });
  } else {
    mongoose.connection.close(false, () => {
      logger.info("MongoDB connection closed");
      process.exit(1);
    });
  }
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", (reason, promise) => {
  //   console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Additional logging or handling can be added here
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();
  }
});
