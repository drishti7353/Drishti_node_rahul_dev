#!/bin/bash
# Stop all servers and start the server
pm2 stop all
##pm2 start /home/ubuntu/my-app1/index.js
pm2 start /home/ubuntu/my-app1/src/server.js
