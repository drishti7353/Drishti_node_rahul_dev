module.exports = {
  apps: [
    {
      name: "drishti",
      script: "./src/server.js",
      watch: true,
      interpreter: "none",
      autorestart: true,
      watch_delay: 1000,
      max_memory_restart: "1G",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
