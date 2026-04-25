# Testing Troubleshooting Guide

## Common Issues with Scalability Tests

### Module Not Found Errors

If you see errors like `Cannot find module '../server'`, check:

1. The correct path to your server file. In this project, the server is located at `./src/server.js`

2. Whether your server.js properly exports the Express app. If your server.js doesn't export the app, use one of these approaches:

   - Modify your tests to use the correct import path:
     ```js
     const server = require('../src/server');
     ```
   
   - Create a server-export.js file that properly exports the Express app
   
   - Modify your server.js to properly export the Express app:
     ```js
     // At the end of your server.js file
     module.exports = app;
     ```

### Database Connection Errors

If tests fail with database connection errors:

1. Ensure MongoDB is running:
   ```bash
   brew services list | grep mongodb
   
   # Start if not running
   brew services start mongodb-community
   ```

2. Check the connection string in your test matches your MongoDB setup

### API Endpoint Not Found

If endpoint tests fail with 404 errors:

1. Verify the API endpoint path in your test matches your actual routes
2. Check that the route is properly defined in your server
3. Ensure any middleware required for that route is loaded

## Debugging Tests

To get more detailed logs, run Jest with the `--verbose` flag:

```bash
npx jest tests/scalability.test.js --verbose
```

To debug tests in VS Code, create a `.vscode/launch.json` file with:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/jest/bin/jest",
      "args": ["tests/scalability.test.js", "--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```
