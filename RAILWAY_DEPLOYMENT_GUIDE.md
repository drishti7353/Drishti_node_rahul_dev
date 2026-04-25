# 🚂 Railway Deployment Guide (2026)

This guide covers the steps required to deploy the Drishti Node.js backend to Railway.

## 📋 Prerequisites

1.  **Railway Account**: Create an account at [Railway.app](https://railway.app/).
2.  **GitHub Repository**: Ensure your code is pushed to a GitHub repository that Railway can access.
3.  **Railway CLI** (Optional but recommended): Install via `npm i -g @railway/cli`.

## 🚀 Deployment Steps

### 1. Create a New Project on Railway

1.  Go to the Railway Dashboard and click **New Project**.
2.  Select **Deploy from GitHub repo**.
3.  Choose the `Drishti_node_rahul_dev` repository.
4.  Railway will automatically detect the Node.js environment and the `railway.toml` configuration file.

### 2. Configure Environment Variables

Railway does not use your local `.env` file for security reasons. You must add the environment variables manually in the Railway Dashboard.

1.  Go to your deployed service in the Railway Dashboard.
2.  Click on the **Variables** tab.
3.  Click **Raw Editor** and paste the contents of your `.env` file.
    *   **Alternative**: Use the Railway CLI to link your local project and import variables:
        ```bash
        railway link
        railway variables --import
        ```
    *   **⚠️ IMPORTANT for Firebase**: The `FIREBASE_PRIVATE_KEY` must be formatted correctly. If copying from `.env.example` or `.env`, ensure the literal `\n` characters are preserved and it is all on a single line.

### 3. Review Railway Configuration

We have already configured the necessary settings in `railway.toml` and `package.json`:

*   **Build Command**: `npm ci --omit=dev` (Installs production dependencies only, skipping devDependencies like `nodemon` or `jest`).
*   **Start Command**: `npm start` (Runs `cross-env NODE_ENV=production node ./src/server.js`).
*   **Health Check**: Railway will ping `/health` to ensure the server is running correctly before routing traffic.
*   **Restart Policy**: The server will automatically restart up to 5 times on failure.

### 4. Database Connection

Ensure your MongoDB Atlas `DB_URI` allows connections from anywhere (`0.0.0.0/0`), as Railway's IP addresses are dynamic. Alternatively, you can provision a PostgreSQL/MySQL/Redis database directly on Railway, but since you are using MongoDB Atlas, just whitelist all IPs in Atlas Network Access.

### 5. Domain Setup (Optional)

1.  Go to your service's **Settings** tab.
2.  Under **Networking**, click **Generate Domain** for a free `.up.railway.app` domain.
3.  Or click **Custom Domain** to connect your own domain (e.g., `api.srisridrishti.com`) by adding a CNAME record in your DNS provider.

## 🛠️ Troubleshooting

### Build Failures

*   Check the **Build Logs** in the Railway Dashboard.
*   Ensure all dependencies are listed in `package.json` under `dependencies` (not `devDependencies` if they are needed at runtime).
*   Check that the Node version in `package.json` (`>=20.0.0`) matches Railway's environment. Railway defaults to the latest LTS version.

### Runtime Errors

*   Check the **Deploy Logs** in the Railway Dashboard.
*   **Missing Variables**: Verify all required environment variables are set in the **Variables** tab.
*   **Port Binding**: Railway automatically provides a `PORT` environment variable. Our app uses `config.port` which defaults to `PORT` from `.env` or `3000`. Ensure `server.js` uses `config.port`.
*   **Database Connection**: If MongoDB fails to connect, check your Atlas Network Access IP whitelist.

### Firebase Private Key Issues

If you see Firebase authentication errors:
*   Ensure the `FIREBASE_PRIVATE_KEY` in the Variables tab contains the exact string with `\n` (e.g., `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...`).

## 🔄 Updating the App

Whenever you push changes to the `main` branch (or whichever branch you linked), Railway will automatically trigger a new deployment. You can track the progress in the Deployments tab.
