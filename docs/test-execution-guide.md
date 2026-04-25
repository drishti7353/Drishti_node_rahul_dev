# Test Execution Guide

This guide explains how to run different types of tests in the Drishti Node project.

## Prerequisites

Before running tests, ensure you have:

1. MongoDB running locally or accessible via the connection strings in the tests
2. Node.js and npm installed
3. All project dependencies installed (`npm install`)
4. K6 installed for load testing (https://k6.io/docs/getting-started/installation/)

## Running Jest Tests (API and Scalability Tests)

The scalability tests are built with Jest:

```bash
# Run all Jest tests
npm test

# Run specific test file
npx jest tests/scalability.test.js

# Run with coverage
npx jest tests/scalability.test.js --coverage
```

## Running K6 Load Tests

The load tests are built with K6 and need to be run with the K6 tool:

```bash
# Make sure your server is running first
npm start

# In a new terminal window, run the K6 test
k6 run tests/load.test.js
```

Note: You may need to modify the K6 test file if it's using ES modules syntax since it appears to be using CommonJS syntax but K6 typically uses ES modules.

## Running Database Benchmarks

The database benchmarks are standalone Node.js scripts:

```bash
# Run database benchmark
node tests/database.bench.js
```

## Customizing Test Execution

- Adjust database connection strings in each test file if your MongoDB instance is not at the default location
- Modify the thresholds in load tests based on your performance requirements
- For CI/CD integration, add these commands to your pipeline configuration
