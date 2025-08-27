import os
import sys

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

# Import the Flask app
from backend.app import app, db, User
from werkzeug.security import generate_password_hash

# Initialize database on startup
with app.app_context():
    db.create_all()
    # Create admin if not exists
    if not User.query.filter_by(username='admin').first():
        admin = User(
            name='Administrator',
            username='admin',
            password_hash=generate_password_hash('admin123'),
            role='admin'
        )
        db.session.add(admin)
        db.session.commit()

# For gunicorn
application = app

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)