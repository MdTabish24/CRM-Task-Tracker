from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity, verify_jwt_in_request
from flask_cors import CORS, cross_origin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

# Set static folder to frontend build
# In production, build folder is in the same directory as app.py
static_folder = 'build' if os.path.exists('build') else '../frontend/build'
app = Flask(__name__, static_folder=static_folder, static_url_path='')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
# Database configuration - PostgreSQL only
database_url = os.getenv('DATABASE_URL') or os.getenv('SQLALCHEMY_DATABASE_URI')
if not database_url:
    raise ValueError('DATABASE_URL environment variable is required')

# Fix postgres:// to postgresql:// for SQLAlchemy
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
# Database optimizations for large datasets
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 20,
    'pool_recycle': 3600,
    'pool_pre_ping': True,
    'max_overflow': 30
}

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

# Initialize with app
db.init_app(app)
migrate.init_app(app, db)
jwt.init_app(app)

# CORS configuration - Allow all for development
CORS(app, origins="*", supports_credentials=True)

# JWT error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print(f"Token expired for user: {jwt_payload.get('sub')}")
    return jsonify({'message': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"Invalid token error: {error}")
    return jsonify({'message': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    print(f"Missing token error: {error}")
    return jsonify({'message': 'Authorization token is required'}), 401

# Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Record(db.Model):
    __tablename__ = 'records'
    id = db.Column(db.Integer, primary_key=True)
    caller_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    phone_number = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(100))
    response = db.Column(db.Text)
    notes = db.Column(db.Text)
    visit = db.Column(db.Enum('visited', 'confirmed', 'declined', 'pending', name='visit_status'), default='pending')
    visit_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    deadline = db.Column(db.DateTime)
    status = db.Column(db.Enum('pending', 'in_progress', 'completed', 'overdue', name='task_status'), default='pending')
    progress = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CertifiedOfficeAssistant(db.Model):
    __tablename__ = 'certified_office_assistant'
    id = db.Column(db.Integer, primary_key=True)
    record_id = db.Column(db.Integer, db.ForeignKey('records.id'), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    caller_name = db.Column(db.String(100), nullable=False)
    response = db.Column(db.Text)
    processed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class OtherAdmissions(db.Model):
    __tablename__ = 'other_admissions'
    id = db.Column(db.Integer, primary_key=True)
    record_id = db.Column(db.Integer, db.ForeignKey('records.id'), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    caller_name = db.Column(db.String(100), nullable=False)
    response = db.Column(db.Text)
    discount_rate = db.Column(db.Float, nullable=True)
    total_fees = db.Column(db.Float, nullable=True)
    enrolled_course = db.Column(db.String(200), nullable=True)
    fees_paid = db.Column(db.Integer, nullable=True)
    course_total_fees = db.Column(db.Integer, nullable=True)
    course_start_date = db.Column(db.DateTime, nullable=True)
    course_end_date = db.Column(db.DateTime, nullable=True)
    payment_mode = db.Column(db.String(100), nullable=True)
    processed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Admission(db.Model):
    __tablename__ = 'admissions'
    id = db.Column(db.Integer, primary_key=True)
    record_id = db.Column(db.Integer, db.ForeignKey('records.id'), nullable=False)
    admission_type = db.Column(db.Enum('confirmed', 'other', name='admission_type'), nullable=False)
    discount_rate = db.Column(db.Float, nullable=True)  # For other admissions
    total_fees = db.Column(db.Float, nullable=True)     # For other admissions
    enrolled_course = db.Column(db.String(200), nullable=True)  # For other admissions
    processed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Frontend Routes - MUST BE FIRST
@app.route('/')
def serve_frontend():
    print("ROOT ROUTE HIT")
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/favicon.ico')
def favicon():
    print("FAVICON ROUTE HIT")
    return send_from_directory(app.static_folder, 'favicon.ico')

# React Router routes - MUST BE AFTER API ROUTES
@app.route('/login')
def serve_login():
    print(f"LOGIN ROUTE HIT: {request.path}")
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/admin')
def serve_admin():
    print(f"ADMIN ROUTE HIT: {request.path}")
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/admin/<path:subpath>')
def serve_admin_subpaths(subpath):
    print(f"ADMIN SUBPATH ROUTE HIT: {request.path}")
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/caller')
def serve_caller():
    print(f"CALLER ROUTE HIT: {request.path}")
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/caller/<path:subpath>')
def serve_caller_subpaths(subpath):
    print(f"CALLER SUBPATH ROUTE HIT: {request.path}")
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/custom')
def serve_custom():
    print(f"CUSTOM ROUTE HIT: {request.path}")
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/custom/<path:subpath>')
def serve_custom_subpaths(subpath):
    print(f"CUSTOM SUBPATH ROUTE HIT: {request.path}")
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/tasks')
def serve_tasks():
    print(f"TASKS ROUTE HIT: {request.path}")
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/tasks/<path:subpath>')
def serve_tasks_subpaths(subpath):
    print(f"TASKS SUBPATH ROUTE HIT: {request.path}")
    return send_from_directory(app.static_folder, 'index.html')



# API Health Check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'CRM API is running', 'version': '1.0'})

@app.route('/api/init-db', methods=['GET'])
def init_database():
    try:
        # Create all tables
        db.create_all()
        
        # Check if admin exists
        admin = User.query.filter_by(username='admin').first()
        if admin:
            return jsonify({'message': 'Database already initialized'})
        
        # Create admin user
        admin = User(
            name='Administrator',
            username='admin',
            password_hash=generate_password_hash('admin123'),
            role='admin'
        )
        db.session.add(admin)
        
        # Create caller users
        for i in range(1, 4):
            caller = User(
                name=f'Caller {i}',
                username=f'caller{i}',
                password_hash=generate_password_hash('caller123'),
                role='caller'
            )
            db.session.add(caller)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Database initialized successfully',
            'users_created': 4,
            'admin': 'admin/admin123',
            'callers': 'caller1,caller2,caller3/caller123'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    return jsonify({'message': 'Test endpoint working', 'timestamp': datetime.utcnow().isoformat()})

@app.route('/api/test-auth', methods=['GET'])
@jwt_required()
def test_auth_endpoint():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    return jsonify({
        'message': 'Authenticated endpoint working',
        'user_id': current_user_id,
        'username': user.username if user else 'Unknown',
        'timestamp': datetime.utcnow().isoformat()
    })

# Auth Routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    if user and check_password_hash(user.password_hash, password):
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'name': user.name,
                'username': user.username,
                'role': user.role
            }
        })
    
    return jsonify({'message': 'Invalid credentials'}), 401

# Test endpoint
@app.route('/test', methods=['GET'])
@jwt_required()
def test_auth():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return jsonify({
        'message': 'Authentication working',
        'user_id': current_user_id,
        'user_name': user.name if user else 'Unknown'
    })

# Upload Routes
@app.route('/api/admin/upload', methods=['POST'])
@jwt_required()
def upload_csv():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    # Handle multiple files
    files = request.files.getlist('files')
    if not files or len(files) == 0:
        return jsonify({'message': 'No files uploaded'}), 400
    
    # Get active callers
    callers = User.query.filter_by(role='caller').all()
    if not callers:
        return jsonify({'message': 'No callers found. Please create caller users first.'}), 400
    
    try:
        total_records_added = 0
        total_skipped_duplicates = 0
        file_results = []
        
        for file in files:
            if file.filename == '':
                continue
            
            # Validate file extension
            allowed_extensions = ['.csv', '.xlsx', '.xls']
            file_ext = '.' + file.filename.split('.')[-1].lower()
            if file_ext not in allowed_extensions:
                file_results.append({
                    'filename': file.filename,
                    'status': 'error',
                    'message': 'Invalid file type'
                })
                continue
            
            records_data = []
            
            # Smart column detection
            def find_column(columns, possible_names):
                columns_lower = [col.lower().strip() for col in columns]
                for possible in possible_names:
                    for i, col in enumerate(columns_lower):
                        if possible.lower() in col or col in possible.lower():
                            return columns[i]
                return None
            
            # Process file based on extension
            if file_ext == '.csv':
                import csv
                import io
                
                file.seek(0)
                content = file.read().decode('utf-8-sig')
                csv_reader = csv.DictReader(io.StringIO(content))
                
                # Smart phone column detection
                phone_col = find_column(csv_reader.fieldnames, 
                    ['phone', 'mobile', 'number', 'contact', 'cell', 'telephone'])
                
                if not phone_col:
                    file_results.append({
                        'filename': file.filename,
                        'status': 'error',
                        'message': f'No phone column found. Available: {", ".join(csv_reader.fieldnames)}'
                    })
                    continue
                
                # Smart name column detection
                name_col = find_column(csv_reader.fieldnames, 
                    ['name', 'customer', 'client', 'person', 'full_name', 'firstname'])
                
                seen_phones = set()
                for row in csv_reader:
                    phone = str(row.get(phone_col, '')).strip()
                    if phone and phone not in seen_phones:
                        seen_phones.add(phone)
                        records_data.append({
                            'phone_number': phone,
                            'name': str(row.get(name_col, '')).strip() if name_col else ''
                        })
            else:
                try:
                    import pandas as pd
                    
                    file.seek(0)
                    df = pd.read_excel(file)
                    
                    # Smart phone column detection
                    phone_col = find_column(df.columns.tolist(), 
                        ['phone', 'mobile', 'number', 'contact', 'cell', 'telephone'])
                    
                    if not phone_col:
                        file_results.append({
                            'filename': file.filename,
                            'status': 'error',
                            'message': f'No phone column found. Available: {", ".join(df.columns)}'
                        })
                        continue
                    
                    # Smart name column detection
                    name_col = find_column(df.columns.tolist(), 
                        ['name', 'customer', 'client', 'person', 'full_name', 'firstname'])
                    
                    df = df.dropna(subset=[phone_col])
                    df[phone_col] = df[phone_col].astype(str).str.strip()
                    df = df[df[phone_col] != '']
                    df = df.drop_duplicates(subset=[phone_col])
                    
                    for _, row in df.iterrows():
                        records_data.append({
                            'phone_number': str(row[phone_col]).strip(),
                            'name': str(row.get(name_col, '')).strip() if name_col and pd.notna(row.get(name_col)) else ''
                        })
                except ImportError:
                    file_results.append({
                        'filename': file.filename,
                        'status': 'error',
                        'message': 'Excel support not available'
                    })
                    continue
                except Exception as e:
                    file_results.append({
                        'filename': file.filename,
                        'status': 'error',
                        'message': f'Error reading file: {str(e)}'
                    })
                    continue
            
            if not records_data:
                file_results.append({
                    'filename': file.filename,
                    'status': 'error',
                    'message': 'No valid records found'
                })
                continue
            
            # Process records for this file (distribute equally among callers)
            file_records_added = 0
            file_skipped_duplicates = 0
            
            for index, record_data in enumerate(records_data):
                phone_number = record_data['phone_number']
                
                # Check for existing record
                existing = Record.query.filter_by(phone_number=phone_number).first()
                if existing:
                    file_skipped_duplicates += 1
                    continue
                
                # Assign to caller (round-robin for this file)
                caller = callers[index % len(callers)]
                
                # Create new record
                record = Record(
                    caller_id=caller.id,
                    phone_number=phone_number,
                    name=record_data['name']
                )
                db.session.add(record)
                file_records_added += 1
            
            total_records_added += file_records_added
            total_skipped_duplicates += file_skipped_duplicates
            
            file_results.append({
                'filename': file.filename,
                'status': 'success',
                'records_found': len(records_data),
                'records_added': file_records_added,
                'skipped_duplicates': file_skipped_duplicates
            })
        
        # Commit all changes
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Processed {len(files)} files successfully',
            'total_records_added': total_records_added,
            'total_skipped_duplicates': total_skipped_duplicates,
            'files_processed': len([f for f in file_results if f['status'] == 'success']),
            'files_failed': len([f for f in file_results if f['status'] == 'error']),
            'file_results': file_results,
            'final_distribution': {caller.name: Record.query.filter_by(caller_id=caller.id).count() 
                                 for caller in callers}
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error processing files: {str(e)}'}), 500

# Caller Routes
@app.route('/api/caller/records', methods=['GET'])
@jwt_required()
def get_caller_records():
    current_user_id = int(get_jwt_identity())
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '')
    
    query = Record.query.filter_by(caller_id=current_user_id)
    
    if search:
        query = query.filter(
            db.or_(
                Record.phone_number.contains(search),
                Record.name.contains(search)
            )
        )
    
    records = query.paginate(
        page=page, per_page=50, error_out=False
    )
    
    return jsonify({
        'records': [{
            'id': r.id,
            'phone_number': r.phone_number,
            'name': r.name,
            'response': r.response,
            'notes': r.notes,
            'visit': r.visit,
            'updated_at': r.updated_at.isoformat() if r.updated_at else None
        } for r in records.items],
        'total': records.total,
        'pages': records.pages,
        'current_page': page
    })

@app.route('/api/records/<int:record_id>', methods=['PATCH'])
@jwt_required()
def update_record(record_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    record = Record.query.get_or_404(record_id)
    
    # Callers can only update their own records
    if user.role == 'caller' and record.caller_id != current_user_id:
        return jsonify({'message': 'Access denied'}), 403
    
    data = request.get_json()
    
    if 'name' in data:
        record.name = data['name']
    if 'response' in data:
        record.response = data['response']
    if 'notes' in data:
        record.notes = data['notes']
    
    record.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Record updated successfully'})

# Admin Routes - Caller Tasks View
@app.route('/api/admin/caller-tasks', methods=['GET'])
@jwt_required()
def get_all_caller_tasks():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    # Get all tasks with caller info
    tasks = db.session.query(Task, User).join(User, Task.assigned_to == User.id).filter(
        User.role == 'caller'
    ).order_by(Task.created_at.desc()).all()
    
    return jsonify({
        'tasks': [{
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'status': task.status,
            'progress': task.progress,
            'deadline': task.deadline.isoformat() if task.deadline else None,
            'created_at': task.created_at.isoformat(),
            'caller_name': user.name,
            'caller_id': user.id,
            'is_self_assigned': task.assigned_by == task.assigned_to
        } for task, user in tasks]
    })

@app.route('/api/admin/progress', methods=['GET'])
@jwt_required()
def get_progress():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    date_str = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
    target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    
    callers = User.query.filter_by(role='caller').all()
    progress_data = []
    
    for caller in callers:
        # Count responses for the day (when caller actually updated the record)
        responses_today = Record.query.filter(
            Record.caller_id == caller.id,
            db.func.date(Record.updated_at) == target_date,
            Record.response.isnot(None),
            Record.response != ''
        ).count()
        
        total_assigned = Record.query.filter_by(caller_id=caller.id).count()
        
        progress_data.append({
            'caller_id': caller.id,
            'caller_name': caller.name,
            'responses_today': responses_today,
            'total_assigned': total_assigned,
            'target': 100,
            'percentage': min(100, (responses_today / 100) * 100) if responses_today else 0
        })
    
    return jsonify({
        'date': date_str,
        'progress': progress_data
    })

@app.route('/api/visit/<int:record_id>', methods=['PATCH'])
@jwt_required()
def mark_visit(record_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    record = Record.query.get_or_404(record_id)
    data = request.get_json()
    
    if 'visit' in data:
        record.visit = data['visit']
        record.visit_by = current_user_id
        record.updated_at = datetime.utcnow()
        
        # Create admission record for confirmed visits
        if data['visit'] == 'confirmed':
            # Get caller info
            caller = User.query.get(record.caller_id) if record.caller_id else None
            
            # Add to Certified Office Assistant table
            certified_admission = CertifiedOfficeAssistant(
                record_id=record_id,
                phone_number=record.phone_number,
                name=record.name or '',
                caller_name=caller.name if caller else 'Unknown',
                response=record.response or '',
                processed_by=current_user_id
            )
            db.session.add(certified_admission)
            
            # Keep old admission for compatibility
            admission = Admission(
                record_id=record_id,
                admission_type='confirmed',
                processed_by=current_user_id
            )
            db.session.add(admission)
        
        db.session.commit()
    
    return jsonify({'message': 'Visit status updated'})

@app.route('/api/admin/other-admission/<int:record_id>', methods=['POST'])
@jwt_required()
def create_other_admission(record_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    record = Record.query.get_or_404(record_id)
    data = request.get_json()
    
    # Get caller info
    caller = User.query.get(record.caller_id) if record.caller_id else None
    
    # Parse dates if provided
    course_start_date = None
    course_end_date = None
    if data.get('course_start_date'):
        course_start_date = datetime.fromisoformat(data['course_start_date'])
    if data.get('course_end_date'):
        course_end_date = datetime.fromisoformat(data['course_end_date'])
    
    # Add to Other Admissions table
    other_admission = OtherAdmissions(
        record_id=record_id,
        phone_number=record.phone_number,
        name=record.name or '',
        caller_name=caller.name if caller else 'Unknown',
        response=record.response or '',
        discount_rate=data.get('discount_rate'),
        total_fees=data.get('course_total_fees'),
        enrolled_course=data.get('enrolled_course'),
        fees_paid=data.get('fees_paid'),
        course_total_fees=data.get('course_total_fees'),
        course_start_date=course_start_date,
        course_end_date=course_end_date,
        payment_mode=data.get('payment_mode'),
        processed_by=current_user_id
    )
    db.session.add(other_admission)
    
    # Create old admission record for compatibility
    admission = Admission(
        record_id=record_id,
        admission_type='other',
        discount_rate=data.get('discount_rate'),
        total_fees=data.get('course_total_fees'),  # Use course_total_fees for total_fees
        enrolled_course=data.get('enrolled_course'),
        processed_by=current_user_id
    )
    db.session.add(admission)
    
    # Update record visit status to confirmed (since they enrolled)
    record.visit = 'confirmed'
    record.visit_by = current_user_id
    record.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'message': 'Other admission recorded successfully'})

@app.route('/api/admin/admissions', methods=['GET'])
@jwt_required()
def get_admissions():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    # Get all admissions with record and caller info
    admissions = db.session.query(Admission, Record, User).join(
        Record, Admission.record_id == Record.id
    ).join(
        User, Record.caller_id == User.id
    ).order_by(Admission.created_at.desc()).all()
    
    confirmed_admissions = []
    other_admissions = []
    
    for admission, record, caller in admissions:
        admission_data = {
            'id': admission.id,
            'record_id': record.id,
            'phone_number': record.phone_number,
            'name': record.name,
            'caller_name': caller.name,
            'created_at': admission.created_at.isoformat(),
            'discount_rate': admission.discount_rate,
            'total_fees': admission.total_fees,
            'enrolled_course': admission.enrolled_course
        }
        
        if admission.admission_type == 'confirmed':
            confirmed_admissions.append(admission_data)
        else:
            other_admissions.append(admission_data)
    
    return jsonify({
        'confirmed_admissions': confirmed_admissions,
        'other_admissions': other_admissions,
        'total_confirmed': len(confirmed_admissions),
        'total_other': len(other_admissions)
    })

# Visit Management Routes
@app.route('/api/admin/visits', methods=['GET'])
@jwt_required()
def get_all_visits():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    page = request.args.get('page', 1, type=int)
    search_name = request.args.get('search_name', '').strip()
    search_phone = request.args.get('search_phone', '').strip()
    
    # Base query - only pending visits (people who responded but not yet processed)
    query = Record.query.filter(
        Record.response.isnot(None),
        Record.response != '',
        Record.visit == 'pending'
    )
    
    # Search filters
    if search_name:
        query = query.filter(Record.name.contains(search_name))
    
    if search_phone:
        query = query.filter(Record.phone_number.contains(search_phone))
    
    # Order by most recent
    query = query.order_by(Record.updated_at.desc())
    
    records = query.paginate(page=page, per_page=15, error_out=False)
    
    # Get caller info for each record
    result_records = []
    for record in records.items:
        caller = User.query.get(record.caller_id) if record.caller_id else None
        
        result_records.append({
            'id': record.id,
            'phone_number': record.phone_number,
            'name': record.name,
            'response': record.response,
            'notes': record.notes,
            'visit': record.visit,
            'caller': {
                'id': caller.id if caller else None,
                'name': caller.name if caller else 'Unknown'
            },
            'assigned_at': record.assigned_at.isoformat() if record.assigned_at else None,
            'updated_at': record.updated_at.isoformat() if record.updated_at else None
        })
    
    return jsonify({
        'records': result_records,
        'total': records.total,
        'pages': records.pages,
        'current_page': page
    })

@app.route('/api/admin/visited-records', methods=['GET'])
@jwt_required()
def get_visited_records():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    page = request.args.get('page', 1, type=int)
    search_name = request.args.get('search_name', '').strip()
    search_phone = request.args.get('search_phone', '').strip()
    
    # Base query - only visited records (not confirmed yet)
    query = Record.query.filter(Record.visit == 'visited')
    
    # Search filters
    if search_name:
        query = query.filter(Record.name.contains(search_name))
    
    if search_phone:
        query = query.filter(Record.phone_number.contains(search_phone))
    
    # Order by most recent
    query = query.order_by(Record.updated_at.desc())
    
    records = query.paginate(page=page, per_page=15, error_out=False)
    
    # Get caller info for each record
    result_records = []
    for record in records.items:
        caller = User.query.get(record.caller_id) if record.caller_id else None
        
        result_records.append({
            'id': record.id,
            'phone_number': record.phone_number,
            'name': record.name,
            'response': record.response,
            'notes': record.notes,
            'visit': record.visit,
            'caller': {
                'id': caller.id if caller else None,
                'name': caller.name if caller else 'Unknown'
            },
            'assigned_at': record.assigned_at.isoformat() if record.assigned_at else None,
            'updated_at': record.updated_at.isoformat() if record.updated_at else None
        })
    
    return jsonify({
        'records': result_records,
        'total': records.total,
        'pages': records.pages,
        'current_page': page
    })

@app.route('/api/admin/visit-stats', methods=['GET'])
@jwt_required()
def get_visit_stats():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    # Get visit statistics by caller
    callers = User.query.filter_by(role='caller').all()
    caller_stats = []
    
    for caller in callers:
        total_responses = Record.query.filter(
            Record.caller_id == caller.id,
            Record.response.isnot(None),
            Record.response != ''
        ).count()
        
        visits_only = Record.query.filter(
            Record.caller_id == caller.id,
            Record.visit == 'visited'
        ).count()
        
        visits_confirmed = Record.query.filter(
            Record.caller_id == caller.id,
            Record.visit == 'confirmed'
        ).count()
        
        visits_declined = Record.query.filter(
            Record.caller_id == caller.id,
            Record.visit == 'declined'
        ).count()
        
        visits_pending = Record.query.filter(
            Record.caller_id == caller.id,
            Record.visit == 'pending',
            Record.response.isnot(None),
            Record.response != ''
        ).count()
        
        # Total visits done = visited + confirmed (confirmed means they visited AND converted)
        total_visits_done = visits_only + visits_confirmed
        conversion_rate = (visits_confirmed / total_visits_done * 100) if total_visits_done > 0 else 0
        
        caller_stats.append({
            'caller_id': caller.id,
            'caller_name': caller.name,
            'total_responses': total_responses,
            'visits_only': visits_only,
            'visits_done': total_visits_done,
            'visits_confirmed': visits_confirmed,
            'visits_declined': visits_declined,
            'visits_pending': visits_pending,
            'conversion_rate': round(conversion_rate, 2)
        })
    
    # Overall stats
    total_visits_only = Record.query.filter_by(visit='visited').count()
    total_visits_confirmed = Record.query.filter_by(visit='confirmed').count()
    total_visits_declined = Record.query.filter_by(visit='declined').count()
    total_visits_pending = Record.query.filter(
        Record.visit == 'pending',
        Record.response.isnot(None),
        Record.response != ''
    ).count()
    
    # Total visits done = visited + confirmed
    total_visits_done = total_visits_only + total_visits_confirmed
    
    return jsonify({
        'caller_stats': caller_stats,
        'overall_stats': {
            'total_visits_only': total_visits_only,
            'total_visits_done': total_visits_done,
            'total_confirmed': total_visits_confirmed,
            'total_declined': total_visits_declined,
            'total_pending': total_visits_pending
        }
    })

@app.route('/api/admin/custom-users-progress', methods=['GET'])
@jwt_required()
def get_custom_users_progress():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    # Get all custom role users (not admin or caller)
    custom_users = User.query.filter(~User.role.in_(['admin', 'caller'])).all()
    
    users_progress = []
    
    for custom_user in custom_users:
        # Get user's tasks
        user_tasks = Task.query.filter_by(assigned_to=custom_user.id).all()
        
        # Calculate stats
        total_tasks = len(user_tasks)
        completed_tasks = len([t for t in user_tasks if t.status == 'completed'])
        overdue_tasks = len([t for t in user_tasks if t.deadline and t.deadline < datetime.utcnow() and t.status != 'completed'])
        avg_progress = sum([t.progress for t in user_tasks]) / total_tasks if total_tasks > 0 else 0
        
        # Get recent active tasks (not completed) with details
        active_tasks = [t for t in user_tasks if t.status != 'completed']
        recent_tasks = []
        for task in active_tasks[:5]:  # Last 5 active tasks
            recent_tasks.append({
                'id': task.id,
                'title': task.title,
                'deadline': task.deadline.isoformat() if task.deadline else None,
                'progress': task.progress,
                'status': task.status,
                'is_overdue': task.deadline and task.deadline < datetime.utcnow() and task.status != 'completed'
            })
        
        users_progress.append({
            'user_id': custom_user.id,
            'username': custom_user.username,
            'name': custom_user.name,
            'role': custom_user.role,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'overdue_tasks': overdue_tasks,
            'avg_progress': round(avg_progress, 1),
            'recent_tasks': recent_tasks
        })
    
    return jsonify({
        'custom_users': users_progress,
        'total_custom_users': len(custom_users)
    })

@app.route('/api/caller/visit-notifications', methods=['GET'])
@jwt_required()
def get_caller_visit_notifications():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'caller':
        return jsonify({'message': 'Caller access required'}), 403
    
    # Get recent visits and confirmations for this caller
    recent_visits = Record.query.filter(
        Record.caller_id == current_user_id,
        Record.visit == 'visited'
    ).order_by(Record.updated_at.desc()).limit(10).all()
    
    recent_confirmations = Record.query.filter(
        Record.caller_id == current_user_id,
        Record.visit == 'confirmed'
    ).order_by(Record.updated_at.desc()).limit(10).all()
    
    # Get caller's visit stats
    visits_only = Record.query.filter(
        Record.caller_id == current_user_id,
        Record.visit == 'visited'
    ).count()
    
    total_confirmed = Record.query.filter(
        Record.caller_id == current_user_id,
        Record.visit == 'confirmed'
    ).count()
    
    total_declined = Record.query.filter(
        Record.caller_id == current_user_id,
        Record.visit == 'declined'
    ).count()
    
    pending_visits = Record.query.filter(
        Record.caller_id == current_user_id,
        Record.visit == 'pending',
        Record.response.isnot(None),
        Record.response != ''
    ).count()
    
    # Total visits done = visited + confirmed
    total_visits_done = visits_only + total_confirmed
    
    return jsonify({
        'recent_visits': [{
            'id': v.id,
            'phone_number': v.phone_number,
            'name': v.name,
            'updated_at': v.updated_at.isoformat() if v.updated_at else None
        } for v in recent_visits],
        'recent_confirmations': [{
            'id': v.id,
            'phone_number': v.phone_number,
            'name': v.name,
            'updated_at': v.updated_at.isoformat() if v.updated_at else None
        } for v in recent_confirmations],
        'stats': {
            'total_visits_done': total_visits_done,
            'total_confirmed': total_confirmed,
            'total_declined': total_declined,
            'pending_visits': pending_visits
        }
    })

# Caller Tasks Routes (Todo-style)
@app.route('/api/caller/tasks', methods=['GET'])
@jwt_required()
def get_caller_tasks():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role not in ['caller', 'admin']:
        return jsonify({'message': 'Access denied'}), 403
    
    # Get tasks assigned to current caller
    tasks = Task.query.filter_by(assigned_to=current_user_id).order_by(Task.created_at.desc()).all()
    
    return jsonify({
        'tasks': [{
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'status': task.status,
            'progress': task.progress,
            'deadline': task.deadline.isoformat() if task.deadline else None,
            'created_at': task.created_at.isoformat(),
            'assigned_by_name': User.query.get(task.assigned_by).name if task.assigned_by else 'System'
        } for task in tasks]
    })

@app.route('/api/caller/tasks', methods=['POST'])
@jwt_required()
def create_caller_task():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'caller':
        return jsonify({'message': 'Only callers can create personal tasks'}), 403
    
    data = request.get_json()
    
    task = Task(
        title=data.get('title'),
        description=data.get('description', ''),
        assigned_to=current_user_id,
        assigned_by=current_user_id,  # Self-assigned
        deadline=datetime.strptime(data['deadline'], '%Y-%m-%d') if data.get('deadline') else None,
        status='pending'
    )
    
    db.session.add(task)
    db.session.commit()
    
    return jsonify({
        'message': 'Task created successfully',
        'task': {
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'status': task.status,
            'deadline': task.deadline.isoformat() if task.deadline else None
        }
    }), 201

@app.route('/api/caller/tasks/<int:task_id>', methods=['PATCH'])
@jwt_required()
def update_caller_task(task_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    task = Task.query.get_or_404(task_id)
    
    # Only allow caller to update their own tasks or admin to update any
    if user.role == 'caller' and task.assigned_to != current_user_id:
        return jsonify({'message': 'Access denied'}), 403
    
    data = request.get_json()
    
    if 'status' in data:
        task.status = data['status']
    if 'progress' in data:
        task.progress = data['progress']
    if 'title' in data:
        task.title = data['title']
    if 'description' in data:
        task.description = data['description']
    
    task.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Task updated successfully'})

# Task Routes
@app.route('/api/tasks', methods=['POST'])
@jwt_required()
def create_task():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    data = request.get_json()
    
    task = Task(
        title=data['title'],
        description=data.get('description', ''),
        assigned_to=data['assigned_to'],
        assigned_by=current_user_id,
        deadline=datetime.fromisoformat(data['deadline']) if data.get('deadline') else None
    )
    
    db.session.add(task)
    db.session.commit()
    
    return jsonify({'message': 'Task created successfully', 'task_id': task.id})

@app.route('/api/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role == 'admin':
        tasks = Task.query.all()
    else:
        tasks = Task.query.filter_by(assigned_to=current_user_id).all()
    
    return jsonify({
        'tasks': [{
            'id': t.id,
            'title': t.title,
            'description': t.description,
            'assigned_to': t.assigned_to,
            'assigned_by': t.assigned_by,
            'deadline': t.deadline.isoformat() if t.deadline else None,
            'status': t.status,
            'progress': t.progress,
            'created_at': t.created_at.isoformat(),
            'updated_at': t.updated_at.isoformat()
        } for t in tasks]
    })

@app.route('/api/tasks/<int:task_id>', methods=['PATCH'])
@jwt_required()
def update_task(task_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    task = Task.query.get_or_404(task_id)
    
    # Users can only update tasks assigned to them, admins can update any
    if user.role != 'admin' and task.assigned_to != current_user_id:
        return jsonify({'message': 'Access denied'}), 403
    
    data = request.get_json()
    
    if 'status' in data:
        task.status = data['status']
    if 'progress' in data:
        task.progress = data['progress']
    if user.role == 'admin':
        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'assigned_to' in data:
            task.assigned_to = data['assigned_to']
        if 'deadline' in data:
            task.deadline = datetime.fromisoformat(data['deadline']) if data['deadline'] else None
    
    task.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Task updated successfully'})

@app.route('/api/tasks/self', methods=['POST'])
@jwt_required()
def create_self_task():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    # Only for non-admin, non-caller roles (custom roles)
    if user.role in ['admin', 'caller']:
        return jsonify({'message': 'This endpoint is for custom role users only'}), 403
    
    data = request.get_json()
    
    task = Task(
        title=data['title'],
        description=data.get('description', ''),
        assigned_to=current_user_id,
        assigned_by=current_user_id,  # Self-assigned
        deadline=datetime.fromisoformat(data['deadline']) if data.get('deadline') else None,
        status='pending',
        progress=0
    )
    
    db.session.add(task)
    db.session.commit()
    
    return jsonify({'message': 'Task created successfully', 'task_id': task.id})

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    task = Task.query.get_or_404(task_id)
    
    # Users can only delete their own tasks, admins can delete any
    if user.role != 'admin' and task.assigned_to != current_user_id:
        return jsonify({'message': 'Access denied'}), 403
    
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({'message': 'Task deleted successfully'})

# User Management Routes
@app.route('/api/users', methods=['POST'])
@jwt_required()
def create_user():
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        print(f"User creation request from: {user.username} (role: {user.role})")
        
        if user.role != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        data = request.get_json()
        print(f"User creation data: {data}")
        
        # Validate required fields
        if not data or not all(k in data for k in ['name', 'username', 'password', 'role']):
            return jsonify({'message': 'Missing required fields'}), 400
        
        # Check if username already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username already exists'}), 400
        
        new_user = User(
            name=data['name'],
            username=data['username'],
            password_hash=generate_password_hash(data['password']),
            role=data['role']
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        print(f"User created successfully: {new_user.username} with role: {new_user.role}")
        
        return jsonify({'message': 'User created successfully', 'user_id': new_user.id})
        
    except Exception as e:
        print(f"Error creating user: {str(e)}")
        db.session.rollback()
        return jsonify({'message': f'Error creating user: {str(e)}'}), 500

@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    users = User.query.all()
    
    return jsonify({
        'users': [{
            'id': u.id,
            'name': u.name,
            'username': u.username,
            'role': u.role,
            'created_at': u.created_at.isoformat()
        } for u in users]
    })

# Reports Routes
@app.route('/api/reports/calls', methods=['GET'])
@jwt_required()
def calls_report():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    # Get call statistics
    total_records = Record.query.count()
    completed_calls = Record.query.filter(Record.response.isnot(None), Record.response != '').count()
    visits_confirmed = Record.query.filter_by(visit='confirmed').count()
    visits_declined = Record.query.filter_by(visit='declined').count()
    
    return jsonify({
        'total_records': total_records,
        'completed_calls': completed_calls,
        'visits_confirmed': visits_confirmed,
        'visits_declined': visits_declined,
        'completion_rate': (completed_calls / total_records * 100) if total_records > 0 else 0
    })

@app.route('/api/reports/tasks', methods=['GET'])
@jwt_required()
def tasks_report():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    # Get task statistics
    total_tasks = Task.query.count()
    completed_tasks = Task.query.filter_by(status='completed').count()
    overdue_tasks = Task.query.filter(
        Task.deadline < datetime.utcnow(),
        Task.status != 'completed'
    ).count()
    
    return jsonify({
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'overdue_tasks': overdue_tasks,
        'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    })

# Role Management Routes
@app.route('/api/admin/roles', methods=['GET'])
@jwt_required()
def get_roles():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    # Get all unique roles from users table
    roles = db.session.query(User.role).distinct().all()
    role_list = [role[0] for role in roles]
    
    return jsonify({'roles': role_list})

@app.route('/api/admin/roles', methods=['POST'])
@jwt_required()
def create_role():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    data = request.get_json()
    role_name = data.get('role_name', '').strip().lower()
    
    if not role_name:
        return jsonify({'message': 'Role name is required'}), 400
    
    # Check if role already exists
    existing_role = User.query.filter_by(role=role_name).first()
    if existing_role:
        return jsonify({'message': 'Role already exists'}), 400
    
    return jsonify({'message': 'Role can be used when creating users', 'role': role_name})

# Custom Role Dashboard
@app.route('/api/dashboard/custom', methods=['GET'])
@jwt_required()
def custom_dashboard():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    print(f"Custom dashboard request from user: {user.username} (role: {user.role})")
    
    # Only for non-admin, non-caller roles
    if user.role in ['admin', 'caller']:
        return jsonify({'message': 'Access denied'}), 403
    
    # Get user's tasks
    my_tasks = Task.query.filter_by(assigned_to=current_user_id).all()
    
    # Get overdue tasks
    overdue_tasks = Task.query.filter(
        Task.assigned_to == current_user_id,
        Task.deadline < datetime.utcnow(),
        Task.status != 'completed'
    ).all()
    
    # Get today's completed tasks
    today = datetime.now().date()
    today_completed = Task.query.filter(
        Task.assigned_to == current_user_id,
        Task.status == 'completed',
        db.func.date(Task.updated_at) == today
    ).count()
    
    print(f"Found {len(my_tasks)} tasks for user {user.username}")
    
    return jsonify({
        'user': {
            'id': user.id,
            'name': user.name,
            'role': user.role
        },
        'my_tasks': [{
            'id': t.id,
            'title': t.title,
            'description': t.description,
            'deadline': t.deadline.isoformat() if t.deadline else None,
            'status': t.status,
            'progress': t.progress,
            'created_at': t.created_at.isoformat(),
            'updated_at': t.updated_at.isoformat(),
            'assigned_by_name': User.query.get(t.assigned_by).name if t.assigned_by else 'Unknown'
        } for t in my_tasks],
        'overdue_count': len(overdue_tasks),
        'today_completed': today_completed,
        'stats': {
            'total_tasks': len(my_tasks),
            'completed_tasks': len([t for t in my_tasks if t.status == 'completed']),
            'in_progress_tasks': len([t for t in my_tasks if t.status == 'in_progress']),
            'pending_tasks': len([t for t in my_tasks if t.status == 'pending'])
        }
    })

# Clear Records Only
@app.route('/api/admin/clear-records', methods=['POST'])
@jwt_required()
def clear_records_only():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    try:
        # Delete admissions first (foreign key constraint)
        Admission.query.delete()
        
        # Then delete phone records
        records_deleted = Record.query.delete()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Phone records cleared successfully',
            'records_deleted': records_deleted
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': f'Error clearing records: {str(e)}',
            'records_deleted': 0
        }), 500

@app.route('/api/admin/certified-office-assistant', methods=['GET'])
@jwt_required()
def get_certified_office_assistant():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    admissions = CertifiedOfficeAssistant.query.order_by(CertifiedOfficeAssistant.created_at.desc()).all()
    
    return jsonify({
        'admissions': [{
            'id': a.id,
            'phone_number': a.phone_number,
            'name': a.name,
            'caller_name': a.caller_name,
            'response': a.response,
            'created_at': a.created_at.isoformat()
        } for a in admissions],
        'total': len(admissions)
    })

@app.route('/api/admin/other-admission/<int:admission_id>', methods=['PUT'])
@jwt_required()
def update_other_admission(admission_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    admission = OtherAdmissions.query.get_or_404(admission_id)
    data = request.get_json()
    
    # Parse dates if provided
    course_start_date = None
    course_end_date = None
    if data.get('course_start_date'):
        course_start_date = datetime.fromisoformat(data['course_start_date'])
    if data.get('course_end_date'):
        course_end_date = datetime.fromisoformat(data['course_end_date'])
    
    # Update fields
    admission.discount_rate = data.get('discount_rate')
    admission.total_fees = data.get('course_total_fees')
    admission.enrolled_course = data.get('enrolled_course')
    admission.fees_paid = data.get('fees_paid')
    admission.course_total_fees = data.get('course_total_fees')
    admission.course_start_date = course_start_date
    admission.course_end_date = course_end_date
    admission.payment_mode = data.get('payment_mode')
    
    db.session.commit()
    
    return jsonify({'message': 'Admission updated successfully'})

@app.route('/api/admin/other-admission/<int:admission_id>', methods=['DELETE'])
@jwt_required()
def delete_other_admission(admission_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    admission = OtherAdmissions.query.get_or_404(admission_id)
    db.session.delete(admission)
    db.session.commit()
    
    return jsonify({'message': 'Admission deleted successfully'})

@app.route('/api/admin/other-admissions-list', methods=['GET'])
@jwt_required()
def get_other_admissions_list():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    admissions = OtherAdmissions.query.order_by(OtherAdmissions.created_at.desc()).all()
    
    return jsonify({
        'admissions': [{
            'id': a.id,
            'phone_number': a.phone_number,
            'name': a.name,
            'caller_name': a.caller_name,
            'response': a.response,
            'discount_rate': a.discount_rate,
            'total_fees': a.total_fees,
            'enrolled_course': a.enrolled_course,
            'fees_paid': a.fees_paid,
            'course_total_fees': a.course_total_fees,
            'course_start_date': a.course_start_date.isoformat() if a.course_start_date else None,
            'course_end_date': a.course_end_date.isoformat() if a.course_end_date else None,
            'payment_mode': a.payment_mode,
            'created_at': a.created_at.isoformat()
        } for a in admissions],
        'total': len(admissions)
    })

# Delete Old Admin
@app.route('/api/admin/delete-old-admin', methods=['POST'])
@jwt_required()
def delete_old_admin():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    data = request.get_json()
    old_username = data.get('old_username', 'admin')
    
    # Find and delete old admin (not current user)
    old_admin = User.query.filter_by(username=old_username).first()
    if old_admin and old_admin.id != current_user_id:
        db.session.delete(old_admin)
        db.session.commit()
        return jsonify({'message': f'Old admin {old_username} deleted successfully'})
    
    return jsonify({'message': 'Old admin not found or cannot delete current user'})

# Admin Credentials Update
@app.route('/api/admin/update-credentials', methods=['POST'])
@jwt_required()
def update_admin_credentials():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    data = request.get_json()
    new_username = data.get('username')
    new_password = data.get('password')
    
    if not new_username or not new_password:
        return jsonify({'message': 'Username and password required'}), 400
    
    # Update current admin user
    user.username = new_username
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    
    return jsonify({
        'message': 'Admin credentials updated successfully',
        'new_username': new_username
    })

# Static files catch-all - MUST be at the end
@app.route('/<path:path>')
def serve_static_files(path):
    print(f"STATIC FILE CATCH-ALL: {path}")
    
    # Skip API routes
    if path.startswith('api/'):
        print(f"API route not found: {path}")
        return jsonify({'error': 'API endpoint not found'}), 404
    
    # Serve static files only
    if '.' in path:
        print(f"Static file requested: {path}")
        try:
            return send_from_directory(app.static_folder, path)
        except Exception as e:
            print(f"Static file not found: {path}, error: {e}")
            return jsonify({'error': 'File not found'}), 404
    
    # For routes without extension, return 404 (React routes are handled above)
    print(f"Unknown route: {path}")
    return jsonify({'error': 'Route not found'}), 404

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)