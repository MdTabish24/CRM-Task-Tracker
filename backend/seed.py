from app import app, db, User
from werkzeug.security import generate_password_hash

def seed_database():
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Check if admin already exists
        if User.query.filter_by(username='admin').first():
            print("Database already seeded!")
            return
        
        # Create admin user
        admin = User(
            name='System Administrator',
            username='admin',
            password_hash=generate_password_hash('admin123'),
            role='admin'
        )
        db.session.add(admin)
        
        # Create caller users
        callers = [
            {'name': 'John Caller', 'username': 'caller1'},
            {'name': 'Jane Caller', 'username': 'caller2'},
            {'name': 'Bob Caller', 'username': 'caller3'}
        ]
        
        for caller_data in callers:
            caller = User(
                name=caller_data['name'],
                username=caller_data['username'],
                password_hash=generate_password_hash('caller123'),
                role='caller'
            )
            db.session.add(caller)
        
        # Create test developer user
        developer = User(
            name='Test Developer',
            username='dev1',
            password_hash=generate_password_hash('dev123'),
            role='developer'
        )
        db.session.add(developer)
        
        db.session.commit()
        print("Database seeded successfully!")
        print("Admin: username='admin', password='admin123'")
        print("Callers: username='caller1/caller2/caller3', password='caller123'")
        print("Developer: username='dev1', password='dev123'")

if __name__ == '__main__':
    seed_database()