#!/usr/bin/env python3
"""
Run Flask server with proper CORS configuration
"""

import os
from flask import Flask
from flask_cors import CORS
from app import app

if __name__ == '__main__':
    # Configure CORS properly
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    print("🚀 Starting Flask server with CORS enabled...")
    print("📍 Server will run on: http://localhost:5000")
    print("🌐 CORS enabled for: http://localhost:3000")
    
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        threaded=True
    )