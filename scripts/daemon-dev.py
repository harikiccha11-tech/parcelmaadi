#!/usr/bin/env python3
"""Daemonize Next.js dev server using true double-fork."""
import os
import sys
import subprocess
import time
from pathlib import Path

PROJECT_DIR = "/home/z/my-project"
LOG_FILE = f"{PROJECT_DIR}/dev.log"
NEXT_BIN = f"{PROJECT_DIR}/node_modules/.bin/next"

# Step 1: kill old processes
os.system("pkill -f 'next dev' 2>/dev/null; pkill -f 'next-server' 2>/dev/null")
time.sleep(2)

# Step 2: fork
pid = os.fork()
if pid > 0:
    # Parent exits
    print(f"Forked child {pid}, parent exiting")
    sys.exit(0)

# Step 3: become session leader
os.setsid()

# Step 4: ignore SIGHUP
import signal
signal.signal(signal.SIGHUP, signal.SIG_IGN)

# Step 5: second fork
pid = os.fork()
if pid > 0:
    sys.exit(0)

# Step 6: redirect stdin/stdout/stderr
sys.stdout.flush()
sys.stderr.flush()
with open('/dev/null', 'r') as f:
    os.dup2(f.fileno(), 0)
with open(LOG_FILE, 'a+') as f:
    os.dup2(f.fileno(), 1)
    os.dup2(f.fileno(), 2)

# Step 7: write pid file
with open(f"{PROJECT_DIR}/dev.pid", 'w') as f:
    f.write(str(os.getpid()))

# Step 8: exec next dev
os.chdir(PROJECT_DIR)
os.execv(NEXT_BIN, [NEXT_BIN, "dev", "-p", "3000"])
