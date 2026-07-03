#!/usr/bin/env python3
"""Start backend and frontend servers as detached daemons."""
import subprocess, os, sys, time, signal

BACKEND_DIR = os.path.join(os.path.dirname(__file__), "backend")
FRONTEND_DIR = os.path.dirname(__file__)
VENV_PYTHON = os.path.join(BACKEND_DIR, "venv", "bin", "python3")

def daemonize(cmd, logfile, cwd=None):
    """Start a process in a new session (fully detached)."""
    f = open(logfile, "w")
    proc = subprocess.Popen(
        cmd,
        cwd=cwd or os.getcwd(),
        stdout=f,
        stderr=subprocess.STDOUT,
        close_fds=True,
        start_new_session=True,
    )
    return proc

if __name__ == "__main__":
    print("Starting backend...")
    p1 = daemonize(
        [VENV_PYTHON, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        "/tmp/backend-daemon.log",
        cwd=BACKEND_DIR,
    )
    print(f"  Backend PID: {p1.pid}")

    print("Starting frontend...")
    npm_path = "/usr/bin/npm"
    p2 = daemonize(
        [npm_path, "run", "dev"],
        "/tmp/frontend-daemon.log",
        cwd=FRONTEND_DIR,
    )
    print(f"  Frontend PID: {p2.pid}")

    print("Waiting for servers to start...")
    time.sleep(5)

    import urllib.request
    for i in range(10):
        try:
            r = urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=3)
            print(f"  Backend: {r.read().decode()}")
            break
        except Exception as e:
            if i < 9:
                time.sleep(2)

    print(f"\nBackend log: tail -f /tmp/backend-daemon.log")
    print(f"Frontend log: tail -f /tmp/frontend-daemon.log")
    print(f"API: http://127.0.0.1:8000")
    print(f"Frontend: http://127.0.0.1:5173")
