"""
Root launcher for the NER Logistics Intelligence backend.
Allows running `python run.py` directly from the project root.
"""

import os
import sys
import subprocess

ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

# Try to use the backend venv python if available, else current python
venv_python = os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")
python_exec = venv_python if os.path.exists(venv_python) else sys.executable

backend_run_script = os.path.join(BACKEND_DIR, "run.py")

if __name__ == "__main__":
    print(f"Launching NER Logistics Backend from {BACKEND_DIR}...")
    sys.exit(subprocess.call([python_exec, backend_run_script], cwd=BACKEND_DIR))
