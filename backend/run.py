"""
NER Logistics Intelligence — Local Development Server Launcher
Usage: python run.py
"""

import uvicorn
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"Starting NER Logistics API server on http://{host}:{port}")
    print(f"Swagger API Documentation: http://localhost:{port}/docs")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
