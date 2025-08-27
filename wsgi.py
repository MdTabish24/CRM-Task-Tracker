import os
import sys

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

# Import the Flask app
from backend.app import app

# For gunicorn
application = app

if __name__ == "__main__":
    app.run()