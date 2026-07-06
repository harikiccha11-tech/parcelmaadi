#!/bin/bash
# Persistent Next.js dev launcher
cd /home/z/my-project
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 2
rm -f /home/z/my-project/dev.log
exec /home/z/my-project/node_modules/.bin/next dev -p 3000 > /home/z/my-project/dev.log 2>&1
