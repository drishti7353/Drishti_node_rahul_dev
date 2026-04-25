#!/bin/bash

# Deployment script for Drishti Node application
# This script pulls the latest code and rebuilds the Docker container

set -e

echo "=========================================="
echo "Starting Drishti Node Deployment"
echo "=========================================="

# Navigate to application directory
cd /home/ec2-user/Drishti_node_rahul_dev || cd /home/ubuntu/Drishti_node_rahul_dev || exit 1

echo "[1/5] Pulling latest code from GitHub..."
git pull origin main

echo "[2/5] Stopping existing Docker container..."
sudo docker stop drishti_container || true
sudo docker rm drishti_container || true

echo "[3/5] Rebuilding Docker image..."
sudo docker build -t drishti_node:latest .

echo "[4/5] Starting new Docker container..."
sudo docker run -d -p 8080:8080 --name drishti_container drishti_node:latest

echo "[5/5] Verifying container is running..."
sleep 2
sudo docker ps | grep drishti_container

echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Testing OTP endpoint..."
curl -X POST http://localhost:8080/user/login \
  -H "Content-Type: application/json" \
  -d '{"mobileNo":"8291541168","countryCode":"+91","type":"VERIFICATION"}' || echo "Test request sent"

echo ""
echo "Container logs:"
sudo docker logs drishti_container | tail -20
