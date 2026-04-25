# Drishti Node Testing Guidelines

## Prerequisites

Before running any tests:

1. Make sure MongoDB is running:
   ```bash
   # Check if MongoDB is running
   brew services list | grep mongodb
   
   # Start MongoDB if needed
   brew services start mongodb-community
   ```

2. Install all dependencies:
   ```bash
   npm install
   ```

3. For load tests, install K6:
   ```bash
   # macOS
   brew install k6
   
   # Other platforms: https://k6.io/docs/getting-started/installation/
   ```

## Running Tests by Type

### 1. Scalability Tests (Jest)

```bash
# Option 1: Using npm script
npm run test:scalability

# Option 2: Using Jest directly
npx jest tests/scalability.test.js

# With coverage report
npx jest tests/scalability.test.js --coverage
```

### 2. Load Tests (K6)

```bash
# First, start your server in one terminal
npm start

# Then, in a new terminal, run the load test
npm run test:load

# Or run directly with K6
k6 run tests/load.test.js
```

### 3. Database Benchmark Tests

```bash
# Using npm script
npm run test:db-benchmark

# Or directly with Node
node tests/database.bench.js
```

### 4. All Jest Tests

```bash
# Run all Jest tests
npm test
```

## Common Issues and Solutions

- **MongoDB Connection Errors**: Ensure MongoDB is running and accessible at mongodb://localhost:27017/
- **K6 Syntax Errors**: K6 uses ES modules, so import/export syntax is required (not CommonJS require())
- **Missing Dependencies**: Run `npm install --save-dev jest supertest` if you encounter missing modules
- **Port Already in Use**: If port 3000 is already in use, modify the server port in the test files
