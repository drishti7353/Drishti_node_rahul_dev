# Running Tests in Drishti Node

## Running Scalability Tests

You have two options to run the scalability tests:

### Option 1: Using Jest directly

```bash
# Navigate to your project directory
cd /Users/rahultamatta/Documents/GitHub/drishti_node

# Run the test using npx with jest command
npx jest tests/scalability.test.js
```

### Option 2: Using npm script

```bash
# Navigate to your project directory
cd /Users/rahultamatta/Documents/GitHub/drishti_node

# Run the test using the npm script defined in package.json
npm run test:scalability
```

## Troubleshooting

If you see errors about missing dependencies, ensure you've installed Jest:

```bash
npm install --save-dev jest supertest
```

If you see database connection errors, make sure your MongoDB instance is running:

```bash
# Check if MongoDB is running (on macOS)
brew services list | grep mongodb
```
